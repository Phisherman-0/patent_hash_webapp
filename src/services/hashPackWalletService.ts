import {
  DAppConnector,
  HederaJsonRpcMethod,
  HederaSessionEvent,
  HederaChainId,
  SignAndExecuteTransactionParams
} from "@hashgraph/hedera-wallet-connect";
import { SignClientTypes } from "@walletconnect/types";
import { AccountId, LedgerId, Transaction, TransactionId, Client } from "@hashgraph/sdk";
import EventEmitter from "events";
import { hederaConfig } from "@/config/hedera";

// Wallet info interface
export interface HashPackWalletInfo {
  accountId: string;
  network: 'testnet' | 'mainnet';
  isConnected: boolean;
  topic?: string;
  pairingTopic?: string;
}

export enum ConnectionState {
  Disconnected = 'Disconnected',
  Connecting = 'Connecting',
  Connected = 'Connected'
}

// Use the project ID from config
const WALLET_CONNECT_PROJECT_ID = hederaConfig.walletConnect.projectId;
const APP_METADATA: SignClientTypes.Metadata = hederaConfig.walletConnect.metadata;

class HashPackWalletService {
  private dappConnector: DAppConnector | null = null;
  private state: ConnectionState = ConnectionState.Disconnected;
  private walletInfo: HashPackWalletInfo | null = null;
  private isInitialized: boolean = false;
  private refreshEvent = new EventEmitter();

  constructor() {
    // Initialize will be called when needed
  }

  /**
   * Initialize service with fallback options
   */
  async init(network: 'testnet' | 'mainnet' = 'testnet'): Promise<void> {
    if (this.isInitialized) {
      console.log('✅ HashPack service already initialized');
      return;
    }

    try {
      console.log('🚀 Initializing HashPack service...');
      
      // Determine ledger ID based on network
      const ledgerId = network === 'mainnet' ? LedgerId.MAINNET : LedgerId.TESTNET;
      const chainId = network === 'mainnet' ? HederaChainId.Mainnet : HederaChainId.Testnet;
      
      // Create DAppConnector instance
      this.dappConnector = new DAppConnector(
        APP_METADATA,
        ledgerId,
        WALLET_CONNECT_PROJECT_ID,
        Object.values(HederaJsonRpcMethod),
        [HederaSessionEvent.ChainChanged, HederaSessionEvent.AccountsChanged],
        [chainId]
      );

      // Initialize the connector with timeout to handle network issues
      console.log('🔗 Initializing WalletConnect with timeout protection...');
      await Promise.race([
        this.dappConnector.init(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('WalletConnect initialization timeout')), 10000)
        )
      ]);
      
      // Set up event listeners
      this.setupEventListeners();
      
      this.isInitialized = true;
      console.log('✅ HashPack service initialized successfully');
      
      // Check for existing session
      await this.checkExistingSession();
      
    } catch (error: any) {
      console.error('❌ Failed to initialize HashPack service:', error);
      
      // Even if WalletConnect fails, we can still detect and use the HashPack extension
      this.isInitialized = true; // Set as initialized to allow extension-only usage
      console.log('⚠️ WalletConnect initialization failed, but HashPack extension may still work');
    }
  }

  /**
   * Set up event listeners for wallet events
   */
  private setupEventListeners(): void {
    if (!this.dappConnector) return;
    
    // Listen for session updates
    this.dappConnector.walletConnectClient.on('session_update', (event: any) => {
      console.log('HashPack session updated:', event);
      this.refreshEvent.emit("sync");
    });

    // Listen for session delete
    this.dappConnector.walletConnectClient.on('session_delete', (event: any) => {
      console.log('HashPack session deleted:', event);
      this.handleDisconnect();
    });
  }

  /**
   * Check for existing wallet session
   */
  private async checkExistingSession(): Promise<void> {
    if (!this.dappConnector) return;
    
    try {
      // Check if we have existing sessions
      const sessions = this.dappConnector.walletConnectClient.session.getAll();
      if (sessions.length > 0) {
        const session = sessions[0]; // Use the first session
        const accountId = session.namespaces?.hedera?.accounts?.[0]?.split(":")[2];
        
        if (accountId) {
          this.walletInfo = {
            accountId,
            network: session.namespaces?.hedera?.chains?.[0]?.includes('mainnet') ? 'mainnet' : 'testnet',
            isConnected: true,
            topic: session.topic
          };
          
          this.state = ConnectionState.Connected;
          this.emitEvent('connected', this.walletInfo);
          console.log('✅ Restored existing wallet session:', this.walletInfo);
        }
      }
    } catch (error) {
      console.warn('⚠️ Could not restore existing session:', error);
    }
  }

  /**
   * Connect to HashPack wallet with enhanced extension detection
   */
  async connect(network: 'testnet' | 'mainnet' = 'testnet'): Promise<HashPackWalletInfo> {
    if (!this.isInitialized) {
      await this.init(network);
    }

    if (this.state === ConnectionState.Connected && this.walletInfo) {
      console.log('✅ Already connected');
      return this.walletInfo;
    }

    if (!this.dappConnector) {
      throw new Error('HashPack service not initialized');
    }

    console.log(`🔗 Connecting to HashPack on ${network}...`);
    this.state = ConnectionState.Connecting;
    this.emitEvent('statusChanged', this.state);

    try {
      // First, try to detect and connect to HashPack extension directly
      const extensionAvailable = this.isExtensionAvailable();
      console.log('🔌 Extension availability check:', extensionAvailable);
      
      if (extensionAvailable) {
        console.log('🔍 Attempting direct extension connection...');
        const directResult = await this.tryDirectExtensionConnection(network);
        if (directResult) {
          return directResult;
        }
      }

      // Fallback to WalletConnect modal
      console.log('📱 Opening WalletConnect modal...');
      await this.dappConnector.openModal();
      
      // Wait for connection
      const signer = this.dappConnector.signers[0];
      if (!signer) {
        throw new Error('No signer found after connection');
      }
      
      const accountId = signer.getAccountId().toString();
      
      this.walletInfo = {
        accountId,
        network,
        isConnected: true,
        topic: signer.topic
      };
      
      this.state = ConnectionState.Connected;
      this.emitEvent('connected', this.walletInfo);
      this.emitEvent('statusChanged', this.state);
      
      console.log('✅ HashPack connected successfully:', this.walletInfo);
      return this.walletInfo;

    } catch (error: any) {
      console.error('❌ HashPack connection failed:', error);
      this.state = ConnectionState.Disconnected;
      this.emitEvent('statusChanged', this.state);
      
      if (error.message?.includes('User rejected')) {
        throw new Error('Connection cancelled by user');
      } else {
        throw new Error(`Failed to connect to HashPack: ${error.message || error}`);
      }
    }
  }

  /**
   * Try to connect directly to HashPack extension with enhanced object handling
   */
  private async tryDirectExtensionConnection(network: 'testnet' | 'mainnet'): Promise<HashPackWalletInfo | null> {
    try {
      const windowAny = window as any;
      
      // Try different possible HashPack object names with priority
      const possibleObjects = [
        { name: 'window.hashpack', obj: windowAny.hashpack },
        { name: 'window.HashPack', obj: windowAny.HashPack },
        { name: 'window.hotWallet', obj: windowAny.hotWallet },
        { name: 'window.hotWalletsProviders', obj: windowAny.hotWalletsProviders },
        { name: 'window.hashConnect', obj: windowAny.hashConnect },
        { name: 'window.hedera', obj: windowAny.hedera }
      ];
      
      let hashpack = null;
      let objectName = '';
      for (const { name, obj } of possibleObjects) {
        if (obj) {
          hashpack = obj;
          objectName = name;
          console.log(`🔌 Found HashPack object at ${name}:`, typeof obj, Object.keys(obj || {}));
          
          // If it's hotWallet, check if it has provider or other wallet-like properties
          if (name === 'window.hotWallet') {
            const keys = Object.keys(obj || {});
            console.log('🔍 hotWallet object keys:', keys);
            
            // Look for nested wallet/provider objects
            for (const key of keys) {
              const nestedObj = obj[key];
              if (nestedObj && typeof nestedObj === 'object') {
                const nestedKeys = Object.keys(nestedObj);
                console.log(`🔍 hotWallet.${key} keys:`, nestedKeys);
                
                // Check if this nested object looks like a wallet
                const walletIndicators = nestedKeys.filter(k => 
                  k.includes('request') || k.includes('connect') || k.includes('sign') || 
                  k.includes('account') || k.includes('provider') || k.includes('wallet')
                );
                
                if (walletIndicators.length > 0) {
                  console.log(`⚠️ ${name}.${key} might be a wallet object with methods:`, walletIndicators);
                }
              }
            }
          }
          break;
        }
      }
      
      if (hashpack) {
        console.log(`🔌 ${objectName} extension detected, trying direct connection...`);
        
        // Check what methods are available on the object
        const availableMethods = Object.getOwnPropertyNames(hashpack).filter(
          prop => typeof (hashpack as any)[prop] === 'function'
        );
        console.log('🔍 Available methods on extension object:', availableMethods);
        
        // Try different HashPack API methods
        let accountInfo;
        if (typeof hashpack.requestAccountInfo === 'function') {
          console.log('📱 Calling hashpack.requestAccountInfo()...');
          accountInfo = await hashpack.requestAccountInfo({ network });
        } else if (typeof hashpack.connect === 'function') {
          console.log('📱 Calling hashpack.connect()...');
          accountInfo = await hashpack.connect({ network });
        } else if (typeof hashpack.getAccountInfo === 'function') {
          console.log('📱 Calling hashpack.getAccountInfo()...');
          accountInfo = await hashpack.getAccountInfo();
        } else if (typeof hashpack.request === 'function') {
          console.log('📱 Calling hashpack.request() with hedera_getAccountInfo...');
          try {
            accountInfo = await hashpack.request({
              method: 'hedera_getAccountInfo',
              params: { network }
            });
          } catch (requestError) {
            console.log('⚠️ hedera_getAccountInfo failed, trying eth_requestAccounts...');
            accountInfo = await hashpack.request({
              method: 'eth_requestAccounts',
              params: []
            });
          }
        } else if (typeof hashpack.enable === 'function') {
          console.log('📱 Calling hashpack.enable()...');
          await hashpack.enable();
          // After enabling, try to get account info
          if (hashpack.getAccountInfo) {
            accountInfo = await hashpack.getAccountInfo();
          }
        } else if (typeof hashpack.getAccount === 'function') {
          console.log('📱 Calling hashpack.getAccount()...');
          accountInfo = await hashpack.getAccount();
        } else if (typeof hashpack.getAccounts === 'function') {
          console.log('📱 Calling hashpack.getAccounts()...');
          const accounts = await hashpack.getAccounts();
          if (accounts && accounts.length > 0) {
            accountInfo = { accountId: accounts[0] };
          }
        } else {
          // For hotWallet objects, try to find nested wallet objects
          if (objectName === 'window.hotWallet') {
            console.log('🔍 Searching for nested wallet objects in hotWallet...');
            
            // Look for common wallet object names within hotWallet
            const potentialWalletObjects = [
              hashpack.provider,
              hashpack.wallet,
              hashpack.connector,
              hashpack.hederaWallet,
              hashpack.hashpack,
              hashpack.hashPack
            ];
            
            for (const walletObj of potentialWalletObjects) {
              if (walletObj && typeof walletObj === 'object') {
                console.log('🔍 Found potential nested wallet object, checking methods...');
                const nestedMethods = Object.getOwnPropertyNames(walletObj).filter(
                  prop => typeof (walletObj as any)[prop] === 'function'
                );
                console.log('🔍 Nested wallet object methods:', nestedMethods);
                
                // Try common wallet methods on nested object
                if (typeof walletObj.requestAccountInfo === 'function') {
                  console.log('📱 Calling nested walletObj.requestAccountInfo()...');
                  accountInfo = await walletObj.requestAccountInfo({ network });
                  break;
                } else if (typeof walletObj.connect === 'function') {
                  console.log('📱 Calling nested walletObj.connect()...');
                  accountInfo = await walletObj.connect({ network });
                  break;
                } else if (typeof walletObj.getAccountInfo === 'function') {
                  console.log('📱 Calling nested walletObj.getAccountInfo()...');
                  accountInfo = await walletObj.getAccountInfo();
                  break;
                } else if (typeof walletObj.request === 'function') {
                  console.log('📱 Calling nested walletObj.request()...');
                  try {
                    accountInfo = await walletObj.request({
                      method: 'hedera_getAccountInfo',
                      params: { network }
                    });
                  } catch (requestError) {
                    accountInfo = await walletObj.request({
                      method: 'eth_requestAccounts',
                      params: []
                    });
                  }
                  break;
                }
              }
            }
            
            if (!accountInfo) {
              console.log('⚠️ No known HashPack API methods found on hotWallet object');
              console.log('🔍 Available methods on hotWallet:', availableMethods);
              
              // Try to infer account info from available properties
              const potentialAccountProps = Object.keys(hashpack).filter(
                key => key.includes('account') || key.includes('Account')
              );
              console.log('🔍 Potential account properties:', potentialAccountProps);
              
              // If we find account-like properties, try to use them
              for (const prop of potentialAccountProps) {
                const value = hashpack[prop];
                if (typeof value === 'string' && value.match(/^0\.0\.\d+$/)) {
                  console.log(`🔍 Found potential account ID in property '${prop}':`, value);
                  accountInfo = { accountId: value };
                  break;
                }
              }
            }
          } else {
            console.log('⚠️ No known HashPack API methods found, available methods:', availableMethods);
            return null;
          }
        }
        
        console.log('✅ HashPack extension response:', accountInfo);
        
        if (accountInfo && (accountInfo.accountId || accountInfo.account || (accountInfo.length && accountInfo[0]))) {
          // Handle different response formats
          let accountId;
          if (accountInfo.accountId) {
            accountId = accountInfo.accountId;
          } else if (accountInfo.account) {
            accountId = accountInfo.account;
          } else if (accountInfo.length && accountInfo[0]) {
            // Array response, take first element
            accountId = accountInfo[0];
          }
          
          if (accountId) {
            this.walletInfo = {
              accountId,
              network: accountInfo.network || network,
              isConnected: true
            };
            
            this.state = ConnectionState.Connected;
            this.emitEvent('connected', this.walletInfo);
            this.emitEvent('statusChanged', this.state);
            
            console.log('✅ Direct HashPack extension connection successful:', this.walletInfo);
            return this.walletInfo;
          }
        }
      }
    } catch (error) {
      console.warn('⚠️ Direct HashPack extension connection failed:', error);
    }
    
    return null;
  }

  /**
   * Disconnect from HashPack
   */
  async disconnect(): Promise<void> {
    try {
      console.log('🔌 Disconnecting from HashPack...');
      
      if (this.dappConnector && this.walletInfo?.topic) {
        await this.dappConnector.disconnect(this.walletInfo.topic);
      }
      
      this.handleDisconnect();
      console.log('✅ HashPack disconnected successfully');
    } catch (error) {
      console.error('❌ Failed to disconnect HashPack:', error);
      // Still reset local state even if disconnect fails
      this.handleDisconnect();
      throw error;
    }
  }

  /**
   * Handle disconnection locally
   */
  private handleDisconnect(): void {
    this.walletInfo = null;
    this.state = ConnectionState.Disconnected;
    this.emitEvent('disconnected');
    this.emitEvent('statusChanged', this.state);
  }

  /**
   * Send transaction for signing
   */
  async sendTransaction(transaction: Transaction): Promise<TransactionId> {
    if (!this.walletInfo || this.state !== ConnectionState.Connected) {
      throw new Error('HashPack wallet not connected');
    }

    if (!this.dappConnector || !this.dappConnector.signers.length) {
      throw new Error('No signer available');
    }

    try {
      console.log('📝 Sending transaction for signing...');
      
      const signer = this.dappConnector.signers[0];
      await transaction.freezeWithSigner(signer);
      const response = await transaction.executeWithSigner(signer);
      
      console.log('✅ Transaction signed successfully:', response.transactionId);
      return response.transactionId;
    } catch (error: any) {
      console.error('❌ Transaction failed:', error);
      throw new Error(`Transaction failed: ${error.message || error}`);
    }
  }

  /**
   * Get current wallet info
   */
  getWalletInfo(): HashPackWalletInfo | null {
    return this.walletInfo;
  }

  /**
   * Get current connection state
   */
  getState(): ConnectionState {
    return this.state;
  }

  /**
   * Check if wallet is connected
   */
  isConnected(): boolean {
    return this.state === ConnectionState.Connected && 
           this.walletInfo?.isConnected === true && 
           !!this.walletInfo?.accountId;
  }

  /**
   * Check if HashPack extension is available with comprehensive detection
   */
  isExtensionAvailable(): boolean {
    if (typeof window === 'undefined') return false;
    
    // Comprehensive check for HashPack extension
    const windowAny = window as any;
    
    // Check for HashPack extension in multiple ways
    const hasHashPackWindow = !!windowAny.hashpack;
    const hasHashPackCapital = !!windowAny.HashPack;
    const hasHashConnectWindow = !!windowAny.hashConnect;
    const hasHederaWindow = !!windowAny.hedera;
    const hasHotWallet = !!windowAny.hotWallet;
    const hasHotWalletsProviders = !!windowAny.hotWalletsProviders;
    const hasExtensionMeta = !!(document && document.querySelector && document.querySelector('meta[name="hashpack-extension"]'));
    
    // Log what's available for debugging
    console.log('🔍 HashPack detection results:', {
      hashpackWindow: hasHashPackWindow,
      HashPackWindow: hasHashPackCapital,
      hashConnectWindow: hasHashConnectWindow,
      hederaWindow: hasHederaWindow,
      hotWallet: hasHotWallet,
      hotWalletsProviders: hasHotWalletsProviders,
      extensionMeta: hasExtensionMeta
    });
    
    // If we find hotWallet or hotWalletsProviders, log more details
    if (hasHotWallet || hasHotWalletsProviders) {
      console.log('🔍 Found hotWallet objects, inspecting...');
      if (hasHotWallet) {
        console.log('🔍 hotWallet type:', typeof windowAny.hotWallet);
        console.log('🔍 hotWallet keys:', Object.keys(windowAny.hotWallet || {}));
        // Check if it has wallet-like properties
        const hotWalletKeys = Object.keys(windowAny.hotWallet || {});
        const walletIndicators = hotWalletKeys.filter(key => 
          key.includes('Account') || key.includes('Sign') || key.includes('Transact') || 
          key.includes('Connect') || key.includes('Wallet') || key.includes('Provider')
        );
        if (walletIndicators.length > 0) {
          console.log('⚠️ hotWallet might be a wallet object with methods:', walletIndicators);
        }
      }
      if (hasHotWalletsProviders) {
        console.log('🔍 hotWalletsProviders type:', typeof windowAny.hotWalletsProviders);
        console.log('🔍 hotWalletsProviders keys:', Object.keys(windowAny.hotWalletsProviders || {}));
      }
    }
    
    return hasHashPackWindow || hasHashPackCapital || hasHashConnectWindow || 
           hasHederaWindow || hasHotWallet || hasHotWalletsProviders || hasExtensionMeta;
  }

  /**
   * Event handling
   */
  private eventListeners: Map<string, Function[]> = new Map();

  addEventListener(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  removeEventListener(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emitEvent(eventType: string, data?: any): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${eventType}:`, error);
        }
      });
    }
    
    // Also emit as window event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(`hashpack-${eventType}`, { detail: data }));
    }
  }

  /**
   * Debug method
   */
  debug(): void {
    console.log('🐛 HashPack Wallet Service Debug Info:');
    console.log('- State:', this.state);
    console.log('- Wallet Info:', this.walletInfo);
    console.log('- Is Initialized:', this.isInitialized);
    console.log('- Extension Available:', this.isExtensionAvailable());
    console.log('- DAppConnector:', !!this.dappConnector);
    
    if (typeof window !== 'undefined') {
      const windowAny = window as any;
      console.log('- Window HashPack objects:', {
        hashpack: !!windowAny.hashpack,
        HashPack: !!windowAny.HashPack,
        hashConnect: !!windowAny.hashConnect,
        hedera: !!windowAny.hedera,
        hotWallet: !!windowAny.hotWallet,
        hotWalletsProviders: !!windowAny.hotWalletsProviders
      });
      
      // Detailed inspection of hotWallet object if available
      if (windowAny.hotWallet) {
        console.log('🔍 Detailed hotWallet inspection:');
        console.log('- hotWallet type:', typeof windowAny.hotWallet);
        
        try {
          const hotWalletKeys = Object.keys(windowAny.hotWallet || {});
          console.log('- hotWallet keys:', hotWalletKeys);
          
          // Check for nested objects that might be wallet providers
          for (const key of hotWalletKeys) {
            const value = windowAny.hotWallet[key];
            if (value && typeof value === 'object') {
              try {
                const nestedKeys = Object.keys(value);
                console.log(`- hotWallet.${key} keys:`, nestedKeys);
                
                // Look for wallet-like properties
                const walletIndicators = nestedKeys.filter(k => 
                  k.includes('Account') || k.includes('Sign') || k.includes('Transact') ||
                  k.includes('Connect') || k.includes('Wallet') || k.includes('Provider')
                );
                
                if (walletIndicators.length > 0) {
                  console.log(`⚠️ hotWallet.${key} might be wallet-related:`, walletIndicators);
                }
              } catch (error) {
                console.log(`- hotWallet.${key}: Error accessing keys`, error.message);
              }
            } else if (typeof value === 'function') {
              console.log(`- hotWallet.${key}: [Function]`);
            } else {
              console.log(`- hotWallet.${key}:`, typeof value, value);
            }
          }
        } catch (error) {
          console.log('- hotWallet keys: Error accessing', error.message);
        }
      }
      
      // Log available methods on HashPack objects
      if (windowAny.hashpack) {
        console.log('- hashpack methods:', Object.getOwnPropertyNames(windowAny.hashpack));
      }
      if (windowAny.HashPack) {
        console.log('- HashPack methods:', Object.getOwnPropertyNames(windowAny.HashPack));
      }
      if (windowAny.hotWallet) {
        console.log('- hotWallet methods:', Object.getOwnPropertyNames(windowAny.hotWallet));
      }
      if (windowAny.hotWalletsProviders) {
        console.log('- hotWalletsProviders methods:', Object.getOwnPropertyNames(windowAny.hotWalletsProviders));
      }
    }
    
    if (this.dappConnector) {
      try {
        console.log('- Sessions:', this.dappConnector.walletConnectClient.session.getAll());
      } catch (error) {
        console.log('- Sessions: Error retrieving sessions', error);
      }
    }
  }

  /**
   * Advanced debug to inspect all wallet-related objects on window
   */
  advancedDebug(): void {
    if (typeof window === 'undefined') return;
    
    console.log('🔍 Advanced HashPack Debug Info:');
    const windowAny = window as any;
    
    // Find all wallet-related keys
    const allKeys = Object.keys(windowAny);
    const walletKeys = allKeys.filter(key => 
      key.toLowerCase().includes('wallet') || 
      key.toLowerCase().includes('hash') || 
      key.toLowerCase().includes('hedera') ||
      key.toLowerCase().includes('hot')
    );
    
    console.log('- All wallet-related window keys:', walletKeys);
    
    // Inspect each potentially relevant object
    walletKeys.forEach(key => {
      const obj = windowAny[key];
      if (obj && typeof obj === 'object') {
        try {
          const propNames = Object.getOwnPropertyNames(obj);
          console.log(`- ${key} properties:`, propNames.slice(0, 20)); // Limit to first 20
          
          // Check if this looks like a wallet object
          const walletIndicators = propNames.filter(prop => 
            prop.includes('Account') || 
            prop.includes('Sign') || 
            prop.includes('Transact') ||
            prop.includes('Connect') ||
            prop.includes('Wallet')
          );
          
          if (walletIndicators.length > 0) {
            console.log(`⚠️  ${key} might be a wallet object with methods:`, walletIndicators);
          }
        } catch (error) {
          console.log(`- ${key}: Error inspecting object`, error);
        }
      } else if (obj && typeof obj === 'function') {
        console.log(`- ${key}: [Function]`);
      }
    });
  }

  /**
   * Get installation instructions for users
   */
  getInstallationInstructions(): {
    title: string;
    message: string;
    downloadUrl: string;
    steps: string[];
  } {
    return {
      title: 'HashPack Wallet Required',
      message: 'To connect your wallet, please install the HashPack wallet.',
      downloadUrl: 'https://www.hashpack.app/download',
      steps: [
        '1. Visit https://www.hashpack.app/download',
        '2. Download the HashPack wallet for your device',
        '3. Create or import your Hedera account',
        '4. Make sure you have some HBAR for transaction fees',
        '5. Return here and click "Connect HashPack"'
      ]
    };
  }
}

// Export singleton instance
export const hashPackWalletService = new HashPackWalletService();