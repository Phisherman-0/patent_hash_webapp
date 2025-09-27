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

// HashPack extension interface
interface HashPackExtension {
  requestAccountInfo: (params?: any) => Promise<any>;
  connect: (params?: any) => Promise<any>;
  getAccountInfo: () => Promise<any>;
  sendTransaction: (transaction: any) => Promise<any>;
  isConnected: () => boolean;
}

declare global {
  interface Window {
    hashpack?: HashPackExtension;
  }
}

export class HashPackServiceSimple {
  private state: ConnectionState = ConnectionState.Disconnected;
  private walletInfo: HashPackWalletInfo | null = null;
  private eventListeners: Map<string, Function[]> = new Map();
  private isInitialized: boolean = false;

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

    console.log('🚀 Initializing HashPack service (simplified)...');
    
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
   * Connect to HashPack wallet - simplified approach
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
      // Try extension connection first
      if (this.isExtensionAvailable()) {
        console.log('🔌 HashPack extension found, attempting direct connection...');
        return await this.connectToExtension(network);
      } else {
        console.log('🌐 No HashPack extension found, using manual connection approach...');
        return await this.connectManually(network);
      }
    } catch (error) {
      console.error('💥 HashPack connection failed:', error);
      this.state = ConnectionState.Disconnected;
      this.emitWalletEvent('statusChanged', this.state);
      throw error;
    }
  }

  /**
   * Connect to HashPack extension directly
   */
  private async connectToExtension(network: 'testnet' | 'mainnet'): Promise<HashPackWalletInfo> {
    return new Promise((resolve, reject) => {
      console.log('🔌 Attempting extension connection...');

      if (!window.hashpack) {
        reject(new Error('HashPack extension not available'));
        return;
      }

      // Set up timeout
      const timeout = setTimeout(() => {
        reject(new Error('Extension connection timeout after 30 seconds'));
      }, 30000);

      const attemptConnection = async () => {
        try {
          let result;
          
          // Try different methods available in HashPack extension
          if (window.hashpack!.requestAccountInfo) {
            console.log('📞 Using requestAccountInfo method...');
            result = await window.hashpack!.requestAccountInfo({ network });
          } else if (window.hashpack!.connect) {
            console.log('📞 Using connect method...');
            result = await window.hashpack!.connect({ network });
          } else if (window.hashpack!.getAccountInfo) {
            console.log('📞 Using getAccountInfo method...');
            result = await window.hashpack!.getAccountInfo();
          } else {
            throw new Error('No suitable connection method found in HashPack extension');
          }

          clearTimeout(timeout);

          if (result && result.accountId) {
            const walletInfo: HashPackWalletInfo = {
              accountId: result.accountId,
              network: result.network || network,
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
   * Manual connection approach with clear instructions
   */
  private async connectManually(network: 'testnet' | 'mainnet'): Promise<HashPackWalletInfo> {
    return new Promise((resolve, reject) => {
      console.log('📝 Starting manual connection process...');
      
      // Create a more user-friendly modal instead of basic prompt
      const modal = this.createConnectionModal(network, (accountId: string) => {
        if (accountId && accountId.match(/^0\.0\.\d+$/)) {
          const walletInfo: HashPackWalletInfo = {
            accountId,
            network,
            isConnected: true,
            sessionData: {
              connectionType: 'manual',
              timestamp: Date.now()
            }
          };

          // Save connection
          this.saveConnection(walletInfo);
          
          this.walletInfo = walletInfo;
          this.state = ConnectionState.Connected;
          this.emitWalletEvent('connected', walletInfo);
          this.emitWalletEvent('statusChanged', this.state);
          
          console.log('✅ Manual connection successful:', walletInfo);
          resolve(walletInfo);
        } else {
          reject(new Error('Invalid account ID format. Please use format: 0.0.123456'));
        }
      }, () => {
        reject(new Error('Manual connection cancelled by user'));
      });
    });
  }

  /**
   * Create a user-friendly connection modal
   */
  private createConnectionModal(
    network: 'testnet' | 'mainnet',
    onConnect: (accountId: string) => void,
    onCancel: () => void
  ): void {
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    // Create modal content
    const modal = document.createElement('div');
    modal.style.cssText = `
      background: white;
      border-radius: 12px;
      padding: 24px;
      max-width: 500px;
      width: 90%;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    `;

    modal.innerHTML = `
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="margin: 0 0 8px 0; color: #1f2937; font-size: 24px; font-weight: 600;">
          Connect HashPack Wallet
        </h2>
        <p style="margin: 0; color: #6b7280; font-size: 14px;">
          HashPack web wallet connection is not available. Please use one of the options below.
        </p>
      </div>

      <div style="background: #f3f4f6; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
        <h3 style="margin: 0 0 12px 0; color: #374151; font-size: 16px; font-weight: 500;">
          Option 1: Install HashPack Extension (Recommended)
        </h3>
        <p style="margin: 0 0 12px 0; color: #6b7280; font-size: 14px;">
          For the best experience, install the HashPack browser extension:
        </p>
        <button id="installExtension" style="
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 8px 16px;
          font-size: 14px;
          cursor: pointer;
          text-decoration: none;
          display: inline-block;
        ">
          Download HashPack Extension
        </button>
      </div>

      <div style="background: #fef3c7; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
        <h3 style="margin: 0 0 12px 0; color: #92400e; font-size: 16px; font-weight: 500;">
          Option 2: Manual Connection
        </h3>
        <p style="margin: 0 0 12px 0; color: #92400e; font-size: 14px;">
          Enter your ${network} account ID manually:
        </p>
        <input 
          type="text" 
          id="accountIdInput" 
          placeholder="0.0.123456" 
          style="
            width: 100%;
            padding: 8px 12px;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            font-size: 14px;
            margin-bottom: 12px;
            box-sizing: border-box;
          "
        />
        <div style="display: flex; gap: 8px;">
          <button id="connectManual" style="
            background: #f59e0b;
            color: white;
            border: none;
            border-radius: 6px;
            padding: 8px 16px;
            font-size: 14px;
            cursor: pointer;
            flex: 1;
          ">
            Connect Manually
          </button>
          <button id="cancelConnection" style="
            background: #6b7280;
            color: white;
            border: none;
            border-radius: 6px;
            padding: 8px 16px;
            font-size: 14px;
            cursor: pointer;
            flex: 1;
          ">
            Cancel
          </button>
        </div>
      </div>

      <div style="background: #e0f2fe; border-radius: 8px; padding: 12px;">
        <p style="margin: 0; color: #0277bd; font-size: 12px; text-align: center;">
          <strong>Note:</strong> Manual connections cannot sign transactions. 
          For full functionality, please use the HashPack extension.
        </p>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Add event listeners
    const installBtn = modal.querySelector('#installExtension') as HTMLButtonElement;
    const connectBtn = modal.querySelector('#connectManual') as HTMLButtonElement;
    const cancelBtn = modal.querySelector('#cancelConnection') as HTMLButtonElement;
    const input = modal.querySelector('#accountIdInput') as HTMLInputElement;

    installBtn.addEventListener('click', () => {
      window.open('https://www.hashpack.app/download', '_blank');
    });

    connectBtn.addEventListener('click', () => {
      const accountId = input.value.trim();
      document.body.removeChild(overlay);
      onConnect(accountId);
    });

    cancelBtn.addEventListener('click', () => {
      document.body.removeChild(overlay);
      onCancel();
    });

    // Allow Enter key to connect
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        connectBtn.click();
      }
    });

    // Focus the input
    setTimeout(() => input.focus(), 100);
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

    if (this.walletInfo.sessionData?.connectionType === 'manual') {
      throw new Error('Transaction signing not available for manual connections. Please use HashPack extension.');
    }

    try {
      console.log('📝 Sending transaction for signing...');
      
      if (window.hashpack && window.hashpack.sendTransaction) {
        // Use extension for transaction signing
        console.log('📝 Signing transaction with HashPack extension...');
        const response = await window.hashpack.sendTransaction({
          transactionBytes: Array.from(transactionBytes),
          accountId: this.walletInfo.accountId
        });
        console.log('✅ Transaction signed successfully:', response);
        return response;
      } else {
        throw new Error('HashPack extension not available for transaction signing');
      }
    } catch (error) {
      console.error('❌ Transaction failed:', error);
      throw error;
    }
  }

  /**
   * Check if HashPack extension is available
   */
  isExtensionAvailable(): boolean {
    return !!(window.hashpack);
  }

  /**
   * Get available wallet extensions
   */
  getAvailableExtensions(): any[] {
    return window.hashpack ? [{ name: 'HashPack', available: true }] : [];
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
   * Set up extension detection
   */
  private setupExtensionDetection(): void {
    // Check for HashPack extension periodically
    const checkExtension = () => {
      const wasAvailable = this.getAvailableExtensions().length > 0;
      const isAvailable = this.isExtensionAvailable();
      
      if (isAvailable && !wasAvailable) {
        console.log('🔍 HashPack extension detected');
        this.emitWalletEvent('extensionFound', { name: 'HashPack' });
      }
    };

    // Check immediately and then periodically
    checkExtension();
    setInterval(checkExtension, 2000);

    // Listen for HashPack extension events
    if (typeof window !== 'undefined') {
      window.addEventListener('hashpack-loaded', () => {
        console.log('🔍 HashPack extension loaded');
        this.emitWalletEvent('extensionFound', { name: 'HashPack' });
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
   * Debug method to check HashPack state
   */
  debug(): void {
    console.log('🐛 HashPack Debug Info (Simplified):');
    console.log('- State:', this.state);
    console.log('- Wallet Info:', this.walletInfo);
    console.log('- Is Initialized:', this.isInitialized);
    console.log('- Extension Available:', this.isExtensionAvailable());
    console.log('- Available Extensions:', this.getAvailableExtensions());
    console.log('- Window HashPack:', !!window.hashpack);
    
    if (window.hashpack) {
      console.log('- HashPack Methods:', Object.getOwnPropertyNames(window.hashpack));
    }
    
    // Check localStorage
    try {
      const saved = localStorage.getItem('hashpack-connection');
      console.log('- Saved Connection:', saved ? JSON.parse(saved) : null);
    } catch (error) {
      console.log('- Saved Connection: Error reading -', error.message);
    }
  }
}

// Export singleton instance
export const hashPackServiceSimple = new HashPackServiceSimple();