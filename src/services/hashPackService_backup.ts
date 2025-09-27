import { HashConnect, HashConnectConnectionState, SessionData } from 'hashconnect';

// Define LedgerId enum locally to avoid @hashgraph/sdk dependency in frontend
enum LedgerId {
  MAINNET = 'mainnet',
  TESTNET = 'testnet'
}

export interface HashPackWalletInfo {
  accountId: string;
  network: 'testnet' | 'mainnet';
  isConnected: boolean;
  sessionData?: SessionData;
}

export interface AppMetadata {
  name: string;
  description: string;
  icons: string[];
  url: string;
}

class HashPackService {
  private hashConnect: HashConnect | null = null;
  private state: HashConnectConnectionState = HashConnectConnectionState.Disconnected;
  private walletInfo: HashPackWalletInfo | null = null;
  private isInitializing: boolean = false;

  // App metadata for HashConnect
  private appMetadata: AppMetadata = {
    name: "Patent Hash",
    description: "Secure patent storage and verification on Hedera blockchain",
    icons: [`${window.location.origin}/favicon.ico`],
    url: window.location.origin
  };

  // Optimized project ID for HashConnect (no WalletConnect dependency needed)
  private projectId = "2f05a4b1b9b2b4b1b9b2b4b1b9b2b4b1";
  private debug = false;

  constructor() {
    this.setupEventListeners();
  }

  /**
   * Initialize HashConnect with fallback to direct HashPack connection
   */
  async init(network: 'testnet' | 'mainnet' = 'testnet'): Promise<void> {
    if (this.isInitializing) {
      console.log('HashConnect already initializing...');
      return;
    }

    this.isInitializing = true;
    
    try {
      // Check for HashPack extension first
      const hasExtension = this.checkHashPackExtension();
      
      if (hasExtension) {
        console.log('HashPack extension detected, attempting direct connection');
        try {
          await this.initDirectHashPackConnection();
        } catch (error) {
          console.warn('Direct HashPack connection failed, falling back to HashConnect:', error);
          await this.initHashConnectWithTimeout(network);
        }
      } else {
        console.log('No HashPack extension detected, initializing HashConnect');
        await this.initHashConnectWithTimeout(network);
      }
      
      // Fallback to HashConnect with timeout
      await this.initHashConnectWithTimeout(network);
    } catch (error) {
      console.warn('Direct HashPack connection failed, using HashConnect:', error);
      await this.initHashConnectWithTimeout(network);
    }
  }

  /**
   * Initialize HashConnect with timeout to avoid WalletConnect relay issues
   */
  private async initHashConnectWithTimeout(network: 'testnet' | 'mainnet'): Promise<void> {
    const ledgerId = network === 'mainnet' ? LedgerId.MAINNET : LedgerId.TESTNET;
    
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        console.log('HashConnect initialization timed out, using direct connection');
        resolve();
      }, 5000); // 5 second timeout
      
      const initHashConnect = async () => {
        try {
          this.hashConnect = new HashConnect(ledgerId, this.projectId, this.appMetadata, this.debug);
          this.setupHashConnectEvents();
          await this.hashConnect.init();
          clearTimeout(timeout);
          resolve();
        } catch (error) {
          console.warn('HashConnect initialization failed:', error);
          clearTimeout(timeout);
          resolve();
        }
      };
      
      initHashConnect();
    });
  }

  /**
   * Initialize direct HashPack connection without HashConnect
   */
  private async initDirectHashPackConnection(): Promise<void> {
    console.log('Initializing direct HashPack connection');
    this.isInitializing = false;
  }

  /**
   * Connect to HashPack wallet with direct and fallback options
   */
  async connect(): Promise<HashPackWalletInfo> {
    try {
      const hasExtension = this.checkHashPackExtension();
      
      if (hasExtension) {
        console.log('Attempting direct HashPack extension connection');
        return await this.connectDirectHashPack();
      } else {
        console.log('No extension found, opening web wallet');
        this.openHashPackWebWallet();
        return await this.waitForConnection();
      }
    } catch (error) {
      console.error('Failed to connect to HashPack:', error);
      throw new Error(`Failed to connect to HashPack wallet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Attempt direct connection to HashPack extension
   */
  private async connectDirectHashPack(): Promise<HashPackWalletInfo> {
    // Try HashPack extension API first
    const hashpack = (window as any).hashpack;
    
    if (hashpack) {
      try {
        console.log('HashPack extension found, attempting connection');
        
        // Try different HashPack API methods
        let accountInfo;
        if (hashpack.requestAccountInfo) {
          accountInfo = await hashpack.requestAccountInfo();
        } else if (hashpack.connect) {
          accountInfo = await hashpack.connect();
        } else {
          throw new Error('HashPack extension API not available');
        }
        
        console.log('HashPack response:', accountInfo);
        
        if (accountInfo && accountInfo.accountId) {
          this.walletInfo = {
            accountId: accountInfo.accountId,
            network: accountInfo.network || 'testnet',
            isConnected: true,
            sessionData: accountInfo
          };
          
          this.state = HashConnectConnectionState.Connected;
          this.emitWalletEvent('connected', this.walletInfo);
          this.emitWalletEvent('statusChanged', this.state);
          
          return this.walletInfo;
        }
      } catch (error) {
        console.warn('Direct HashPack API failed, falling back to HashConnect:', error);
      }
    }
    
    // Fallback to HashConnect pairing if direct connection fails
    console.log('Direct HashPack API not available, trying HashConnect pairing');
    if (!this.hashConnect) {
      console.log('HashConnect not initialized, initializing now...');
      await this.initHashConnectWithTimeout('testnet');
    }
    
    if (this.hashConnect) {
      console.log('Starting HashConnect pairing process');
      await this.hashConnect.connectToLocalWallet();
      return await this.waitForConnection();
    } else {
      throw new Error('Unable to initialize HashConnect');
    }
  }

  /**
   * Wait for connection to be established
   */
  private async waitForConnection(): Promise<HashPackWalletInfo> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout - please ensure HashPack is installed and try again'));
      }, 120000); // 2 minute timeout

      const checkConnection = () => {
        if (this.state === HashConnectConnectionState.Connected && this.walletInfo) {
          clearTimeout(timeout);
          resolve(this.walletInfo);
        } else {
          setTimeout(checkConnection, 1000);
        }
      };

      checkConnection();
    });
  }

  /**
   * Disconnect from HashPack wallet
   */
  async disconnect(): Promise<void> {
    if (this.hashConnect) {
      try {
        await this.hashConnect.disconnect();
        this.walletInfo = null;
        this.state = HashConnectConnectionState.Disconnected;
      } catch (error) {
        console.error('Failed to disconnect from HashPack:', error);
      }
    }
  }

  /**
   * Send transaction to HashPack for signing
   */
  async sendTransaction(transactionBytes: string): Promise<any> {
    if (!this.hashConnect || !this.walletInfo) {
      throw new Error('HashPack not connected');
    }

    try {
      const response = await this.hashConnect.sendTransaction(this.walletInfo.sessionData?.topic || '', transactionBytes);
      return response;
    } catch (error) {
      console.error('Failed to send transaction:', error);
      throw new Error('Failed to send transaction to HashPack');
    }
  }

  /**
   * Get current wallet info
   */
  getWalletInfo(): HashPackWalletInfo | null {
    return this.walletInfo;
  }

  /**
   * Get connection state
   */
  getConnectionState(): HashConnectConnectionState {
    return this.state;
  }

  /**
   * Check if wallet is connected
   */
  isConnected(): boolean {
    return this.state === HashConnectConnectionState.Connected && this.walletInfo !== null;
  }

  /**
   * Set up HashConnect event listeners with improved handling
   */
  private setupHashConnectEvents(): void {
    if (!this.hashConnect) return;

    this.hashConnect.pairingEvent.on((newPairing: SessionData) => {
      console.log('HashConnect pairing event:', newPairing);
      this.walletInfo = {
        accountId: newPairing.accountIds[0],
        network: newPairing.network === 'mainnet' ? 'mainnet' : 'testnet',
        isConnected: true,
        sessionData: newPairing
      };
      this.emitWalletEvent('connected', this.walletInfo);
    });

    this.hashConnect.disconnectionEvent.on((data) => {
      console.log('HashConnect disconnection event:', data);
      this.walletInfo = null;
      this.emitWalletEvent('disconnected', null);
    });

    this.hashConnect.connectionStatusChangeEvent.on((connectionStatus: HashConnectConnectionState) => {
      console.log('HashConnect connection status changed:', connectionStatus);
      this.state = connectionStatus;
      this.emitWalletEvent('statusChanged', connectionStatus);
    });
  }

  /**
   * Set up event listeners for HashPack extension
   */
  private setupEventListeners(): void {
    // Listen for HashPack extension availability
    window.addEventListener('load', () => {
      this.checkHashPackExtension();
    });
  }

  /**
   * Check if HashPack extension is available
   */
  private checkHashPackExtension(): boolean {
    // Check for HashPack extension in multiple ways
    const hasHashPackWindow = !!(window as any).hashpack;
    const hasHashConnectWindow = !!(window as any).hashConnect;
    const hasExtensionMeta = !!(document.querySelector('meta[name="hashpack-extension"]'));
    
    console.log('HashPack detection:', {
      hashpackWindow: hasHashPackWindow,
      hashConnectWindow: hasHashConnectWindow,
      extensionMeta: hasExtensionMeta
    });
    
    return hasHashPackWindow || hasHashConnectWindow || hasExtensionMeta;
  }

  /**
   * Try to get wallet info from existing connection
   */
  private tryGetConnectedWalletInfo(): void {
    if (!this.hashConnect) return;
    
    try {
      // If we're connected but don't have wallet info, emit status change
      if (this.state === HashConnectConnectionState.Connected && !this.walletInfo) {
        this.emitWalletEvent('statusChanged', this.state);
      }
    } catch (error) {
      console.error('Failed to get connected wallet info:', error);
    }
  }

  /**
   * Open HashPack web wallet for connection
   */
  private openHashPackWebWallet(): void {
    const webWalletUrl = 'https://wallet.hashpack.app';
    const params = new URLSearchParams({
      network: this.walletInfo?.network || 'testnet',
      dAppCode: this.projectId
    });
    
    const popup = window.open(
      `${webWalletUrl}?${params.toString()}`,
      'hashpack-wallet',
      'width=400,height=600,scrollbars=yes,resizable=yes'
    );
    
    // Monitor popup for connection
    this.monitorPopupConnection(popup);
  }

  /**
   * Monitor popup window for wallet connection
   */
  private monitorPopupConnection(popup: Window | null): void {
    if (!popup) return;
    
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        // Check if connection was established
        setTimeout(() => {
          if (!this.isConnected()) {
            console.log('Popup closed without connection');
          }
        }, 1000);
      }
    }, 1000);
  }

  /**
   * Emit custom wallet events for React context
   */
  private emitWalletEvent(type: string, data: any): void {
    const event = new CustomEvent(`hashpack-${type}`, { detail: data });
    window.dispatchEvent(event);
  }

  /**
   * Get signer for transactions
   */
  getSigner() {
    return this.hashConnect?.getSigner(this.walletInfo?.sessionData?.accountIds[0] || '');
  }
}

// Export singleton instance
export const hashPackService = new HashPackService();
