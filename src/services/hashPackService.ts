export interface HashPackWalletInfo {
  accountId: string;
  network: 'testnet' | 'mainnet';
  isConnected: boolean;
  sessionData?: any;
}

export enum ConnectionState {
  Disconnected = 'Disconnected',
  Connecting = 'Connecting', 
  Connected = 'Connected'
}

// HashPack extension interface (multiple possible formats)
interface HashPackExtension {
  requestAccountInfo?: (params?: any) => Promise<any>;
  connect?: (params?: any) => Promise<any>;
  getAccountInfo?: () => Promise<any>;
  sendTransaction?: (transaction: any) => Promise<any>;
  isConnected?: () => boolean;
  // Alternative method names
  request?: (params: any) => Promise<any>;
  enable?: () => Promise<any>;
  // Hedera-specific methods
  getAccountId?: () => Promise<string>;
  signTransaction?: (transaction: any) => Promise<any>;
}

declare global {
  interface Window {
    hashpack?: HashPackExtension;
    // Alternative extension names
    HashPack?: HashPackExtension;
    hashConnect?: any;
    hedera?: HashPackExtension;
    // Check for injected providers
    ethereum?: any;
  }
}

export class HashPackService {
  private state: ConnectionState = ConnectionState.Disconnected;
  private walletInfo: HashPackWalletInfo | null = null;
  private eventListeners: Map<string, Function[]> = new Map();
  private isInitialized: boolean = false;
  private extensionCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.setupExtensionDetection();
  }

  /**
   * Initialize HashPack service
   */
  async init(): Promise<void> {
    if (this.isInitialized) {
      console.log('✅ HashPack service already initialized');
      return;
    }

    console.log('🚀 Initializing HashPack service (Enhanced Extension Detection)...');
    
    try {
      // Check for existing connection in localStorage
      const savedConnection = this.loadSavedConnection();
      if (savedConnection) {
        console.log('💾 Found saved connection:', savedConnection);
        this.walletInfo = savedConnection;
        this.state = ConnectionState.Connected;
        this.emitWalletEvent('connected', this.walletInfo);
        this.emitWalletEvent('statusChanged', this.state);
      } else {
        this.state = ConnectionState.Disconnected;
        this.emitWalletEvent('statusChanged', this.state);
      }

      this.isInitialized = true;
      console.log('✅ HashPack service initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize HashPack service:', error);
      this.state = ConnectionState.Disconnected;
      this.emitWalletEvent('statusChanged', this.state);
      throw error;
    }
  }

  /**
   * Connect to HashPack wallet with enhanced extension detection
   */
  async connect(network: 'testnet' | 'mainnet' = 'testnet'): Promise<HashPackWalletInfo> {
    console.log(`🔗 Starting HashPack connection - Network: ${network}`);
    
    if (this.state === ConnectionState.Connected && this.walletInfo) {
      console.log('✅ Already connected, returning existing wallet info');
      return this.walletInfo;
    }

    // Ensure service is initialized
    if (!this.isInitialized) {
      await this.init();
    }

    this.state = ConnectionState.Connecting;
    this.emitWalletEvent('statusChanged', this.state);

    try {
      // Wait a bit for extension to load if needed
      await this.waitForExtension();

      // Try extension connection
      if (this.isExtensionAvailable()) {
        console.log('🔌 HashPack extension found, attempting direct connection...');
        return await this.connectToExtension(network);
      } else {
        console.log('❌ HashPack extension not found');
        this.state = ConnectionState.Disconnected;
        this.emitWalletEvent('statusChanged', this.state);
        
        // Provide clear instructions
        const instructions = this.getInstallationInstructions();
        throw new Error(
          `${instructions.title}: ${instructions.message}\n\n` +
          `Please:\n${instructions.steps.join('\n')}\n\n` +
          `Download from: ${instructions.downloadUrl}`
        );
      }
    } catch (error) {
      console.error('💥 HashPack connection failed:', error);
      this.state = ConnectionState.Disconnected;
      this.emitWalletEvent('statusChanged', this.state);
      throw error;
    }
  }

  /**
   * Wait for extension to load (sometimes takes time)
   */
  private async waitForExtension(maxWait: number = 5000): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWait) {
      if (this.isExtensionAvailable()) {
        console.log('✅ Extension detected after waiting');
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('⏰ Extension wait timeout');
  }

  /**
   * Connect to HashPack extension with comprehensive method trying
   */
  private async connectToExtension(network: 'testnet' | 'mainnet'): Promise<HashPackWalletInfo> {
    return new Promise((resolve, reject) => {
      console.log('🔌 Attempting extension connection...');

      const extension = this.getHashPackExtension();
      if (!extension) {
        reject(new Error('HashPack extension not available'));
        return;
      }

      console.log('🔍 Extension methods available:', Object.getOwnPropertyNames(extension));

      // Set up timeout
      const timeout = setTimeout(() => {
        reject(new Error('Extension connection timeout after 30 seconds'));
      }, 30000);

      const attemptConnection = async () => {
        try {
          let result;
          
          // Try different methods in order of preference
          const connectionMethods = [
            {
              name: 'requestAccountInfo',
              method: () => extension.requestAccountInfo!({ network })
            },
            {
              name: 'connect',
              method: () => extension.connect!({ network })
            },
            {
              name: 'request (hedera_getAccountInfo)',
              method: () => extension.request!({
                method: 'hedera_getAccountInfo',
                params: { network }
              })
            },
            {
              name: 'request (eth_requestAccounts)',
              method: () => extension.request!({
                method: 'eth_requestAccounts',
                params: []
              })
            },
            {
              name: 'enable',
              method: () => extension.enable!()
            },
            {
              name: 'getAccountInfo',
              method: () => extension.getAccountInfo!()
            },
            {
              name: 'getAccountId',
              method: () => extension.getAccountId!()
            }
          ];

          for (const connectionMethod of connectionMethods) {
            if (extension[connectionMethod.name.split(' ')[0] as keyof HashPackExtension]) {
              try {
                console.log(`📞 Trying ${connectionMethod.name}...`);
                result = await connectionMethod.method();
                console.log(`✅ ${connectionMethod.name} succeeded:`, result);
                break;
              } catch (methodError) {
                console.log(`❌ ${connectionMethod.name} failed:`, methodError);
                continue;
              }
            }
          }

          if (!result) {
            throw new Error('All connection methods failed');
          }

          clearTimeout(timeout);

          // Extract account ID from various response formats
          const accountId = this.extractAccountId(result);
          
          if (accountId) {
            const walletInfo: HashPackWalletInfo = {
              accountId,
              network: result?.network || network,
              isConnected: true,
              sessionData: {
                ...result,
                connectionType: 'extension',
                timestamp: Date.now()
              }
            };

            // Save connection
            this.saveConnection(walletInfo);
            
            this.walletInfo = walletInfo;
            this.state = ConnectionState.Connected;
            this.emitWalletEvent('connected', walletInfo);
            this.emitWalletEvent('statusChanged', this.state);
            
            console.log('✅ Extension connection successful:', walletInfo);
            resolve(walletInfo);
          } else {
            throw new Error('No account information received from HashPack extension');
          }
        } catch (error) {
          clearTimeout(timeout);
          console.error('❌ Extension connection failed:', error);
          reject(error);
        }
      };

      attemptConnection();
    });
  }

  /**
   * Get HashPack extension with comprehensive detection
   */
  private getHashPackExtension(): HashPackExtension | null {
    // Try multiple possible extension locations
    const possibleLocations = [
      { name: 'window.hashpack', obj: window.hashpack },
      { name: 'window.HashPack', obj: window.HashPack },
      { name: 'window.hashConnect', obj: window.hashConnect },
      { name: 'window.hedera', obj: window.hedera }
    ];

    for (const location of possibleLocations) {
      if (location.obj) {
        console.log(`🔍 Found HashPack at ${location.name}`);
        return location.obj;
      }
    }

    console.log('🔍 No HashPack extension found in any location');
    return null;
  }

  /**
   * Extract account ID from various response formats
   */
  private extractAccountId(data: any): string | null {
    if (!data) return null;

    // Handle string responses (direct account ID)
    if (typeof data === 'string' && data.match(/^0\.0\.\d+$/)) {
      return data;
    }

    // Try various possible locations for account ID
    const possiblePaths = [
      data.accountId,
      data.account,
      data.selectedAccount,
      data.walletAccount,
      data.accountIds?.[0],
      data.accounts?.[0],
      data.data?.accountId,
      data.data?.account,
      data.data?.accountIds?.[0],
      data.result?.accountId,
      data.result?.account,
      data.params?.accountId,
      data.params?.account,
      data.params?.accounts?.[0],
      data.response?.accountId,
      data.response?.account,
      // Ethereum-style responses
      data[0], // First element if array
      data.address,
      data.addresses?.[0]
    ];

    for (const path of possiblePaths) {
      if (path && typeof path === 'string') {
        // Check for Hedera account ID format
        if (path.match(/^0\.0\.\d+$/)) {
          return path;
        }
        // Check for Ethereum address that might need conversion
        if (path.match(/^0x[a-fA-F0-9]{40}$/)) {
          console.log('🔄 Found Ethereum address, may need conversion:', path);
          // For now, we can't convert without additional info
          // In a real implementation, you'd convert ETH address to Hedera account ID
        }
      }
    }

    console.log('❌ No valid account ID found in response:', data);
    return null;
  }

  /**
   * Disconnect from HashPack
   */
  async disconnect(): Promise<void> {
    try {
      console.log('🔌 Disconnecting from HashPack...');

      // Clear saved connection
      this.clearSavedConnection();

      // Clear backend connection
      try {
        await fetch('/api/wallet/hashpack/disconnect', {
          method: 'DELETE',
          credentials: 'include'
        });
      } catch (error) {
        console.warn('Failed to clear backend connection:', error);
      }

      // Clear local state
      this.walletInfo = null;
      this.state = ConnectionState.Disconnected;
      
      this.emitWalletEvent('disconnected');
      this.emitWalletEvent('statusChanged', this.state);
      
      console.log('✅ HashPack disconnected successfully');
    } catch (error) {
      console.error('❌ Failed to disconnect HashPack:', error);
      throw error;
    }
  }

  /**
   * Send transaction through HashPack for signing
   */
  async sendTransaction(transactionBytes: Uint8Array): Promise<any> {
    if (!this.walletInfo) {
      throw new Error('HashPack wallet not connected');
    }

    try {
      console.log('📝 Sending transaction for signing...');
      
      const extension = this.getHashPackExtension();
      if (!extension) {
        throw new Error('HashPack extension not available for transaction signing');
      }

      // Try different transaction signing methods
      const signingMethods = [
        {
          name: 'sendTransaction',
          method: () => extension.sendTransaction!({
            transactionBytes: Array.from(transactionBytes),
            accountId: this.walletInfo!.accountId
          })
        },
        {
          name: 'signTransaction',
          method: () => extension.signTransaction!({
            transactionBytes: Array.from(transactionBytes),
            accountId: this.walletInfo!.accountId
          })
        },
        {
          name: 'request (hedera_executeTransaction)',
          method: () => extension.request!({
            method: 'hedera_executeTransaction',
            params: {
              transactionBytes: Array.from(transactionBytes),
              accountId: this.walletInfo!.accountId
            }
          })
        }
      ];

      for (const signingMethod of signingMethods) {
        if (extension[signingMethod.name.split(' ')[0] as keyof HashPackExtension]) {
          try {
            console.log(`📝 Trying ${signingMethod.name}...`);
            const response = await signingMethod.method();
            console.log(`✅ Transaction signed with ${signingMethod.name}:`, response);
            return response;
          } catch (methodError) {
            console.log(`❌ ${signingMethod.name} failed:`, methodError);
            continue;
          }
        }
      }

      throw new Error('All transaction signing methods failed');
    } catch (error) {
      console.error('❌ Transaction failed:', error);
      throw error;
    }
  }

  /**
   * Check if HashPack extension is available
   */
  isExtensionAvailable(): boolean {
    return !!this.getHashPackExtension();
  }

  /**
   * Get available wallet extensions
   */
  getAvailableExtensions(): any[] {
    const extension = this.getHashPackExtension();
    return extension ? [{ name: 'HashPack', available: true }] : [];
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
    return this.state === ConnectionState.Connected && this.walletInfo?.isConnected === true;
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
   * Set up comprehensive extension detection
   */
  private setupExtensionDetection(): void {
    // Watch for changes to window object (defensive approach to prevent conflicts)
      const checkAndWatchExtensions = () => {
        // Only proceed if we're in a browser environment
        if (typeof window === 'undefined') return;
        
        // Check for extensions
        checkExtension();
        
        // Use a more defensive approach to watch for extension additions
        // Instead of overriding Object.defineProperty, we'll use a proxy approach
        // or simply check at intervals to avoid conflicts
        const safeCheckExtension = () => {
          try {
            checkExtension();
          } catch (error) {
            console.warn('Safe extension check failed:', error);
          }
        };
        
        // Check at different intervals
        const checkTimes = [500, 1000, 2000, 3000, 5000];
        checkTimes.forEach(time => {
          setTimeout(safeCheckExtension, time);
        });
      };

      // Check immediately
      checkAndWatchExtensions();

      // Set up periodic checking
      this.extensionCheckInterval = setInterval(checkAndWatchExtensions, 1000);

      if (typeof window !== 'undefined') {
        // Listen for various HashPack extension events
        const extensionEvents = [
          'hashpack-loaded',
          'hashconnect-loaded',
          'hedera-loaded',
          'ethereum#initialized',
          'load',
          'DOMContentLoaded'
        ];

        extensionEvents.forEach(eventName => {
          try {
            window.addEventListener(eventName, () => {
              console.log(`🔍 Extension event detected: ${eventName}`);
              setTimeout(() => {
                try {
                  checkExtension();
                } catch (error) {
                  console.warn('Extension check after event failed:', error);
                }
              }, 100);
            });
          } catch (error) {
            console.warn(`Failed to add listener for ${eventName}:`, error);
          }
        });

        // Check for extension injection at different intervals
        const checkTimes = [500, 1000, 2000, 3000, 5000];
        checkTimes.forEach(time => {
          setTimeout(() => {
            try {
              checkExtension();
            } catch (error) {
              console.warn(`Extension check at ${time}ms failed:`, error);
            }
          }, time);
        });
      }
  }

  /**
   * Save connection to localStorage
   */
  private saveConnection(walletInfo: HashPackWalletInfo): void {
    try {
      localStorage.setItem('hashpack-connection', JSON.stringify(walletInfo));
      console.log('💾 Connection saved to localStorage');
    } catch (error) {
      console.warn('⚠️ Failed to save connection to localStorage:', error);
    }
  }

  /**
   * Load saved connection from localStorage
   */
  private loadSavedConnection(): HashPackWalletInfo | null {
    try {
      const saved = localStorage.getItem('hashpack-connection');
      if (saved) {
        const connection = JSON.parse(saved);
        // Check if connection is not too old (24 hours)
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        if (connection.sessionData?.timestamp && (Date.now() - connection.sessionData.timestamp) < maxAge) {
          return connection;
        } else {
          console.log('💾 Saved connection expired, clearing...');
          this.clearSavedConnection();
        }
      }
    } catch (error) {
      console.warn('⚠️ Failed to load saved connection:', error);
    }
    return null;
  }

  /**
   * Clear saved connection from localStorage
   */
  private clearSavedConnection(): void {
    try {
      localStorage.removeItem('hashpack-connection');
      console.log('🗑️ Saved connection cleared');
    } catch (error) {
      console.warn('⚠️ Failed to clear saved connection:', error);
    }
  }

  /**
   * Emit wallet event to listeners
   */
  private emitWalletEvent(eventType: string, data?: any): void {
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
    
    // Also emit as window event for global listening
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(`hashpack-${eventType}`, { detail: data }));
    }
  }

  /**
   * Cleanup method
   */
  cleanup(): void {
    if (this.extensionCheckInterval) {
      clearInterval(this.extensionCheckInterval);
      this.extensionCheckInterval = null;
    }
  }

  /**
   * Debug method to check HashPack state
   */
  debug(): void {
    console.log('🐛 HashPack Debug Info (Enhanced Extension Detection):');
    console.log('- State:', this.state);
    console.log('- Wallet Info:', this.walletInfo);
    console.log('- Is Initialized:', this.isInitialized);
    console.log('- Extension Available:', this.isExtensionAvailable());
    console.log('- Available Extensions:', this.getAvailableExtensions());
    
    // Check all possible extension locations
    console.log('- window.hashpack:', !!window.hashpack, window.hashpack);
    console.log('- window.HashPack:', !!window.HashPack, window.HashPack);
    console.log('- window.hashConnect:', !!window.hashConnect, window.hashConnect);
    console.log('- window.hedera:', !!window.hedera, window.hedera);
    
    const extension = this.getHashPackExtension();
    if (extension) {
      console.log('- Extension Methods:', Object.getOwnPropertyNames(extension));
      console.log('- Extension Prototype:', Object.getOwnPropertyNames(Object.getPrototypeOf(extension)));
    }
    
    // Check localStorage
    try {
      const saved = localStorage.getItem('hashpack-connection');
      console.log('- Saved Connection:', saved ? JSON.parse(saved) : null);
    } catch (error) {
      console.log('- Saved Connection: Error reading -', error.message);
    }

    // Extension availability check
    console.log('- Extension Check Result:', this.isExtensionAvailable());
    console.log('- Recommended Action:', this.isExtensionAvailable() 
      ? 'Extension available - ready to connect' 
      : 'Extension not found - please install HashPack extension'
    );
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
      title: 'HashPack Extension Required',
      message: 'To connect your wallet, please install the HashPack browser extension.',
      downloadUrl: 'https://www.hashpack.app/download',
      steps: [
        '1. Visit https://www.hashpack.app/download',
        '2. Download the extension for your browser (Chrome, Firefox, etc.)',
        '3. Install and set up your HashPack wallet',
        '4. Make sure the extension is enabled in your browser',
        '5. Refresh this page and try connecting again'
      ]
    };
  }
}

// Export singleton instance
export const hashPackService = new HashPackService();