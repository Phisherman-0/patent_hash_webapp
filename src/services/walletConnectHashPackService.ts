import { createWeb3Modal, defaultConfig } from '@web3modal/ethers/react'
import { BrowserProvider, JsonRpcProvider } from 'ethers'

export interface HashPackWalletConnectInfo {
  accountId: string;
  network: 'testnet' | 'mainnet';
  isConnected: boolean;
  address?: string;
  sessionData?: any;
  connectionType: 'walletconnect';
}

export enum WalletConnectState {
  Disconnected = 'Disconnected',
  Connecting = 'Connecting',
  Connected = 'Connected',
  Error = 'Error'
}

// Hedera network configurations
const HEDERA_NETWORKS = {
  testnet: {
    chainId: 296, // Hedera Testnet
    name: 'Hedera Testnet',
    currency: 'HBAR',
    explorerUrl: 'https://hashscan.io/testnet',
    rpcUrl: 'https://testnet.hashio.io/api'
  },
  mainnet: {
    chainId: 295, // Hedera Mainnet
    name: 'Hedera Mainnet',
    currency: 'HBAR',
    explorerUrl: 'https://hashscan.io/mainnet',
    rpcUrl: 'https://mainnet.hashio.io/api'
  }
};

// WalletConnect configuration
const projectId = process.env.VITE_WALLETCONNECT_PROJECT_ID || 'your-project-id-here';

// Defensively get window location to prevent errors in SSR
const getWindowLocation = () => {
  if (typeof window === 'undefined' || !window.location) {
    return {
      origin: 'http://localhost',
      hostname: 'localhost'
    };
  }
  return {
    origin: window.location.origin,
    hostname: window.location.hostname
  };
};

const getWindowLocationOrigin = () => {
  const location = getWindowLocation();
  return location.origin;
};

const metadata = {
  name: 'Patent Hash',
  description: 'Blockchain-based Patent Management System',
  url: getWindowLocationOrigin(),
  icons: [`${getWindowLocationOrigin()}/favicon.ico`]
};

// Configure chains for Hedera
const chains = [
  {
    chainId: HEDERA_NETWORKS.testnet.chainId,
    name: HEDERA_NETWORKS.testnet.name,
    currency: HEDERA_NETWORKS.testnet.currency,
    explorerUrl: HEDERA_NETWORKS.testnet.explorerUrl,
    rpcUrl: HEDERA_NETWORKS.testnet.rpcUrl
  },
  {
    chainId: HEDERA_NETWORKS.mainnet.chainId,
    name: HEDERA_NETWORKS.mainnet.name,
    currency: HEDERA_NETWORKS.mainnet.currency,
    explorerUrl: HEDERA_NETWORKS.mainnet.explorerUrl,
    rpcUrl: HEDERA_NETWORKS.mainnet.rpcUrl
  }
];

const ethersConfig = defaultConfig({
  metadata,
  enableEIP6963: true,
  enableInjected: true,
  enableCoinbase: true,
  rpcUrl: 'https://cloudflare-eth.com/v1/mainnet',
  defaultChainId: HEDERA_NETWORKS.testnet.chainId
});

export class WalletConnectHashPackService {
  private state: WalletConnectState = WalletConnectState.Disconnected;
  private walletInfo: HashPackWalletConnectInfo | null = null;
  private eventListeners: Map<string, Function[]> = new Map();
  private web3Modal: any = null;
  private provider: BrowserProvider | null = null;
  private isInitialized: boolean = false;

  constructor() {
    this.initializeWeb3Modal();
  }

  /**
   * Initialize Web3Modal with HashPack-specific configuration
   */
  private initializeWeb3Modal(): void {
    try {
      // Only initialize Web3Modal in browser environment
      if (typeof window === 'undefined') {
        console.log('ℹ️ Skipping Web3Modal initialization in non-browser environment');
        return;
      }

      // Check if Web3Modal is already defined on window to prevent conflicts
      const windowAny = window as any;
      if (windowAny.web3ModalInstance) {
        console.log('ℹ️ Using existing Web3Modal instance');
        this.web3Modal = windowAny.web3ModalInstance;
        this.isInitialized = true;
        return;
      }

      // Create Web3Modal instance
      this.web3Modal = createWeb3Modal({
        ethersConfig,
        chains,
        projectId,
        enableAnalytics: false,
        themeMode: 'light',
        themeVariables: {
          '--w3m-color-mix': '#00D4AA',
          '--w3m-color-mix-strength': 20
        },
        featuredWalletIds: [
          // HashPack wallet ID (you may need to get the actual ID from WalletConnect)
          'hashpack-wallet-id'
        ],
        includeWalletIds: [
          'hashpack-wallet-id'
        ],
        excludeWalletIds: [
          // Exclude other wallets to focus on HashPack
          'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
          '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0'  // Trust Wallet
        ]
      });

      // Store instance on window to prevent re-initialization
      windowAny.web3ModalInstance = this.web3Modal;

      console.log('✅ Web3Modal initialized for HashPack WalletConnect');
      this.isInitialized = true;
    } catch (error) {
      console.error('❌ Failed to initialize Web3Modal:', error);
      this.state = WalletConnectState.Error;
    }
  }

  /**
   * Initialize the service
   */
  async init(): Promise<void> {
    if (!this.isInitialized) {
      this.initializeWeb3Modal();
    }

    try {
      // Check for existing connection
      const savedConnection = this.loadSavedConnection();
      if (savedConnection) {
        console.log('💾 Found saved WalletConnect connection:', savedConnection);
        this.walletInfo = savedConnection;
        this.state = WalletConnectState.Connected;
        this.emitEvent('connected', this.walletInfo);
      }

      console.log('✅ WalletConnect HashPack service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize WalletConnect service:', error);
      this.state = WalletConnectState.Error;
      throw error;
    }
  }

  /**
   * Connect to HashPack via WalletConnect
   */
  async connect(network: 'testnet' | 'mainnet' = 'testnet'): Promise<HashPackWalletConnectInfo> {
    console.log(`🔗 Starting HashPack WalletConnect connection - Network: ${network}`);
    
    if (this.state === WalletConnectState.Connected && this.walletInfo) {
      console.log('✅ Already connected via WalletConnect');
      return this.walletInfo;
    }

    if (!this.isInitialized) {
      throw new Error('WalletConnect service not initialized');
    }

    this.state = WalletConnectState.Connecting;
    this.emitEvent('statusChanged', this.state);

    try {
      // Open WalletConnect modal
      console.log('📱 Opening WalletConnect modal...');
      await this.web3Modal.open();

      // Wait for connection
      const provider = await this.waitForConnection();
      
      if (!provider) {
        throw new Error('Failed to establish WalletConnect connection');
      }

      this.provider = new BrowserProvider(provider);
      
      // Get account information
      const accounts = await this.provider.listAccounts();
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found in connected wallet');
      }

      const address = accounts[0].address;
      console.log('📍 Connected address:', address);

      // Convert Ethereum address to Hedera account ID if possible
      const accountId = await this.convertAddressToAccountId(address, network);

      const walletInfo: HashPackWalletConnectInfo = {
        accountId: accountId || address, // Fallback to address if conversion fails
        network,
        isConnected: true,
        address,
        connectionType: 'walletconnect',
        sessionData: {
          address,
          chainId: HEDERA_NETWORKS[network].chainId,
          timestamp: Date.now()
        }
      };

      // Save connection
      this.saveConnection(walletInfo);
      
      this.walletInfo = walletInfo;
      this.state = WalletConnectState.Connected;
      
      this.emitEvent('connected', walletInfo);
      this.emitEvent('statusChanged', this.state);
      
      console.log('✅ HashPack WalletConnect connection successful:', walletInfo);
      return walletInfo;

    } catch (error) {
      console.error('💥 HashPack WalletConnect connection failed:', error);
      this.state = WalletConnectState.Error;
      this.emitEvent('statusChanged', this.state);
      throw error;
    }
  }

  /**
   * Wait for WalletConnect connection to be established
   */
  private async waitForConnection(timeout: number = 60000): Promise<any> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('WalletConnect connection timeout'));
      }, timeout);

      // Listen for connection events
      const checkConnection = () => {
        if (this.web3Modal.getWalletProvider()) {
          clearTimeout(timeoutId);
          resolve(this.web3Modal.getWalletProvider());
        } else {
          setTimeout(checkConnection, 1000);
        }
      };

      checkConnection();
    });
  }

  /**
   * Convert Ethereum address to Hedera account ID
   * This is a placeholder - you'll need to implement the actual conversion logic
   */
  private async convertAddressToAccountId(address: string, network: 'testnet' | 'mainnet'): Promise<string | null> {
    try {
      // This is where you'd implement the conversion from Ethereum address to Hedera account ID
      // For now, we'll return null and use the address as fallback
      
      // Example API call to Hedera mirror node (if such conversion exists)
      const mirrorNodeUrl = network === 'testnet' 
        ? 'https://testnet.mirrornode.hedera.com'
        : 'https://mainnet-public.mirrornode.hedera.com';
      
      // Note: This is a placeholder - actual conversion logic depends on HashPack's implementation
      console.log(`🔄 Would convert address ${address} to Hedera account ID using ${mirrorNodeUrl}`);
      
      return null; // Return null for now, use address as fallback
    } catch (error) {
      console.warn('⚠️ Failed to convert address to account ID:', error);
      return null;
    }
  }

  /**
   * Disconnect from WalletConnect
   */
  async disconnect(): Promise<void> {
    try {
      console.log('🔌 Disconnecting from HashPack WalletConnect...');

      if (this.web3Modal) {
        await this.web3Modal.disconnect();
      }

      // Clear saved connection
      this.clearSavedConnection();

      // Clear local state
      this.walletInfo = null;
      this.provider = null;
      this.state = WalletConnectState.Disconnected;
      
      this.emitEvent('disconnected');
      this.emitEvent('statusChanged', this.state);
      
      console.log('✅ HashPack WalletConnect disconnected successfully');
    } catch (error) {
      console.error('❌ Failed to disconnect HashPack WalletConnect:', error);
      throw error;
    }
  }

  /**
   * Send transaction through WalletConnect
   */
  async sendTransaction(transactionData: any): Promise<any> {
    if (!this.walletInfo || !this.provider) {
      throw new Error('HashPack WalletConnect not connected');
    }

    try {
      console.log('📝 Sending transaction via WalletConnect...');
      
      const signer = await this.provider.getSigner();
      const txResponse = await signer.sendTransaction(transactionData);
      
      console.log('✅ Transaction sent via WalletConnect:', txResponse);
      return txResponse;
    } catch (error) {
      console.error('❌ Transaction failed via WalletConnect:', error);
      throw error;
    }
  }

  /**
   * Sign message through WalletConnect
   */
  async signMessage(message: string): Promise<string> {
    if (!this.walletInfo || !this.provider) {
      throw new Error('HashPack WalletConnect not connected');
    }

    try {
      console.log('✍️ Signing message via WalletConnect...');
      
      const signer = await this.provider.getSigner();
      const signature = await signer.signMessage(message);
      
      console.log('✅ Message signed via WalletConnect');
      return signature;
    } catch (error) {
      console.error('❌ Message signing failed via WalletConnect:', error);
      throw error;
    }
  }

  /**
   * Get current wallet info
   */
  getWalletInfo(): HashPackWalletConnectInfo | null {
    return this.walletInfo;
  }

  /**
   * Get current connection state
   */
  getState(): WalletConnectState {
    return this.state;
  }

  /**
   * Check if wallet is connected
   */
  isConnected(): boolean {
    return this.state === WalletConnectState.Connected && this.walletInfo?.isConnected === true;
  }

  /**
   * Add event listener
   */
  addEventListener(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  /**
   * Remove event listener
   */
  removeEventListener(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Save connection to localStorage
   */
  private saveConnection(walletInfo: HashPackWalletConnectInfo): void {
    try {
      localStorage.setItem('hashpack-walletconnect-connection', JSON.stringify(walletInfo));
      console.log('💾 WalletConnect connection saved to localStorage');
    } catch (error) {
      console.warn('⚠️ Failed to save WalletConnect connection to localStorage:', error);
    }
  }

  /**
   * Load saved connection from localStorage
   */
  private loadSavedConnection(): HashPackWalletConnectInfo | null {
    try {
      const saved = localStorage.getItem('hashpack-walletconnect-connection');
      if (saved) {
        const connection = JSON.parse(saved);
        // Check if connection is not too old (24 hours)
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        if (connection.sessionData?.timestamp && (Date.now() - connection.sessionData.timestamp) < maxAge) {
          return connection;
        } else {
          console.log('💾 Saved WalletConnect connection expired, clearing...');
          this.clearSavedConnection();
        }
      }
    } catch (error) {
      console.warn('⚠️ Failed to load saved WalletConnect connection:', error);
    }
    return null;
  }

  /**
   * Clear saved connection from localStorage
   */
  private clearSavedConnection(): void {
    try {
      localStorage.removeItem('hashpack-walletconnect-connection');
      console.log('🗑️ Saved WalletConnect connection cleared');
    } catch (error) {
      console.warn('⚠️ Failed to clear saved WalletConnect connection:', error);
    }
  }

  /**
   * Emit event to listeners
   */
  private emitEvent(eventType: string, data?: any): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in WalletConnect event listener for ${eventType}:`, error);
        }
      });
    }
    
    // Also emit as window event for global listening
    // Check if we're in a browser environment and window is available
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      try {
        // Check if the property can be defined without conflicts
        const eventName = `hashpack-walletconnect-${eventType}`;
        window.dispatchEvent(new CustomEvent(eventName, { detail: data }));
      } catch (error) {
        console.warn(`Failed to dispatch custom event: ${error.message}`);
      }
    }
  }

  /**
   * Open HashPack wallet directly
   */
  openHashPackWallet(): void {
    const hashpackUrl = 'https://wallet.hashpack.app';
    window.open(hashpackUrl, '_blank');
  }

  /**
   * Get QR code for mobile connection
   */
  async getConnectionQR(): Promise<string | null> {
    try {
      if (this.web3Modal) {
        // This would return the WalletConnect QR code
        // Implementation depends on the specific Web3Modal version
        return null; // Placeholder
      }
      return null;
    } catch (error) {
      console.error('❌ Failed to get connection QR code:', error);
      return null;
    }
  }

  /**
   * Debug method
   */
  debug(): void {
    console.log('🐛 HashPack WalletConnect Debug Info:');
    console.log('- State:', this.state);
    console.log('- Wallet Info:', this.walletInfo);
    console.log('- Is Initialized:', this.isInitialized);
    console.log('- Provider:', this.provider);
    console.log('- Web3Modal:', this.web3Modal);
    
    // Check localStorage
    try {
      const saved = localStorage.getItem('hashpack-walletconnect-connection');
      console.log('- Saved Connection:', saved ? JSON.parse(saved) : null);
    } catch (error) {
      console.log('- Saved Connection: Error reading -', error.message);
    }
  }
}

// Export singleton instance
export const walletConnectHashPackService = new WalletConnectHashPackService();