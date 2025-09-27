import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { hashPackWalletService, HashPackWalletInfo, ConnectionState } from '@/services/hashPackWalletService';
import { Transaction } from '@hashgraph/sdk';

interface HashPackWalletContextType {
  walletInfo: HashPackWalletInfo | null;
  connectionState: ConnectionState;
  isConnecting: boolean;
  error: string | null;
  connect: (network?: 'testnet' | 'mainnet') => Promise<void>;
  disconnect: () => Promise<void>;
  sendTransaction: (transaction: Transaction) => Promise<any>;
  isInitialized: boolean;
  isExtensionAvailable: boolean;
  debug: () => void;
}

const HashPackWalletContext = createContext<HashPackWalletContextType | undefined>(undefined);

export function HashPackWalletProvider({ children }: { children: ReactNode }) {
  const [walletInfo, setWalletInfo] = useState<HashPackWalletInfo | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    ConnectionState.Disconnected
  );
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isExtensionAvailable, setIsExtensionAvailable] = useState(false);

  // Check backend wallet status on mount
  useEffect(() => {
    const checkBackendWalletStatus = async () => {
      try {
        const response = await fetch('/api/wallet/hashpack/status', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.isConnected && data.accountId) {
            // Update local state with backend wallet info
            const walletInfo: HashPackWalletInfo = {
              accountId: data.accountId,
              network: data.network,
              isConnected: true,
              lastConnected: data.lastConnected
            };
            
            setWalletInfo(walletInfo);
            setConnectionState(ConnectionState.Connected);
          }
        }
      } catch (error) {
        console.warn('Could not check backend wallet status:', error);
      }
    };

    checkBackendWalletStatus();
  }, []);

  // Initialize HashConnect on mount
  useEffect(() => {
    const initializeHashConnect = async () => {
      try {
        console.log('🚀 Initializing HashPack service...');
        await hashPackWalletService.init();
        setIsInitialized(true);
        
        // Get initial state
        const initialState = hashPackWalletService.getState();
        const initialWallet = hashPackWalletService.getWalletInfo();
        const extensionAvailable = hashPackWalletService.isExtensionAvailable();
        
        console.log('✅ HashConnect initialized - State:', initialState, 'Wallet:', initialWallet);
        console.log('🔌 Extension available:', extensionAvailable);
        
        setConnectionState(initialState);
        setWalletInfo(initialWallet);
        setIsExtensionAvailable(extensionAvailable);
        
        // If we have a wallet, we're connected
        if (initialWallet && initialState === ConnectionState.Connected && initialWallet.accountId) {
          console.log('✅ Found existing wallet connection');
        }
      } catch (error: any) {
        console.error('❌ Failed to initialize HashConnect:', error);
        setError(error.message);
        setIsInitialized(true); // Set as initialized even on error to prevent infinite loading
      }
    };

    // Initialize immediately
    initializeHashConnect();
  }, []);

  // Set up event listeners for HashPack events
  useEffect(() => {
    const handleConnected = (event: CustomEvent) => {
      console.log('HashPack connected event received in context:', event.detail);
      const walletInfo = event.detail;
      // Validate that we actually have a valid connection
      if (walletInfo && walletInfo.accountId) {
        setWalletInfo(walletInfo);
        setConnectionState(ConnectionState.Connected);
        setIsConnecting(false);
        setError(null);
      } else {
        // Invalid connection, treat as disconnected
        setWalletInfo(null);
        setConnectionState(ConnectionState.Disconnected);
        setIsConnecting(false);
        setError('Invalid wallet connection - missing account information');
      }
    };

    const handleDisconnected = () => {
      console.log('HashPack disconnected event received in context');
      setWalletInfo(null);
      setConnectionState(ConnectionState.Disconnected);
      setIsConnecting(false);
    };

    const handleStatusChanged = (event: CustomEvent) => {
      console.log('HashPack status changed event received in context:', event.detail);
      const newState = event.detail;
      setConnectionState(newState);
      
      // If we're connecting, update the connecting state
      if (newState === ConnectionState.Connecting) {
        setIsConnecting(true);
      } else {
        setIsConnecting(false);
      }
      
      // If we're disconnected, also clear wallet info
      if (newState === ConnectionState.Disconnected) {
        setWalletInfo(null);
      }
    };

    // Add event listeners
    window.addEventListener('hashpack-connected', handleConnected as EventListener);
    window.addEventListener('hashpack-disconnected', handleDisconnected);
    window.addEventListener('hashpack-statusChanged', handleStatusChanged as EventListener);

    return () => {
      // Cleanup event listeners
      window.removeEventListener('hashpack-connected', handleConnected as EventListener);
      window.removeEventListener('hashpack-disconnected', handleDisconnected);
      window.removeEventListener('hashpack-statusChanged', handleStatusChanged as EventListener);
    };
  }, []);

  const connect = async (network: 'testnet' | 'mainnet' = 'testnet') => {
    if (!isInitialized) {
      setError('HashConnect not initialized');
      return;
    }

    console.log('Starting HashPack connection process for network:', network);
    setIsConnecting(true);
    setConnectionState(ConnectionState.Connecting);
    setError(null);

    try {
      // Re-initialize with the selected network if different
      const currentWallet = hashPackWalletService.getWalletInfo();
      if (!currentWallet || currentWallet.network !== network) {
        console.log('Initializing HashPack for network:', network);
        await hashPackWalletService.init(network);
        setConnectionState(hashPackWalletService.getState());
        setWalletInfo(hashPackWalletService.getWalletInfo());
        console.log('HashPack service initialized successfully');
      }

      console.log('Attempting to connect to HashPack...');
      const wallet = await hashPackWalletService.connect(network);
      
      console.log('HashPack connection successful:', wallet);
      // Validate that we actually have a valid connection
      if (wallet && wallet.accountId) {
        setWalletInfo(wallet);
        setConnectionState(ConnectionState.Connected);
        
        // Save connection to backend
        if (wallet) {
          try {
            console.log('Saving wallet connection to backend...');
            const response = await fetch('/api/wallet/hashpack/connect', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include',
              body: JSON.stringify({
                accountId: wallet.accountId,
                network: wallet.network,
                sessionData: wallet.sessionData || {},
              }),
            });
            
            if (!response.ok) {
              console.error('Failed to save wallet connection to backend:', response.statusText);
              // Don't throw error here, just log it - the connection is still valid
            } else {
              console.log('Wallet connection saved to backend successfully');
            }
          } catch (error) {
            console.error('Failed to save wallet connection to backend:', error);
            // Don't throw error here, just log it - the connection is still valid
          }
        }
      } else {
        throw new Error('Invalid wallet connection - missing account information');
      }
    } catch (error: any) {
      console.error('HashPack connection failed:', error);
      setError(error.message);
      setWalletInfo(null);
      setConnectionState(ConnectionState.Disconnected);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = async () => {
    try {
      console.log('Disconnecting HashPack wallet...');
      await hashPackWalletService.disconnect();
      setWalletInfo(null);
      setConnectionState(ConnectionState.Disconnected);
      setError(null);
      console.log('HashPack wallet disconnected successfully');
    } catch (error: any) {
      console.error('Failed to disconnect HashPack wallet:', error);
      setError(error.message);
    }
  };

  const sendTransaction = async (transaction: Transaction) => {
    if (!walletInfo) {
      throw new Error('Wallet not connected');
    }

    try {
      return await hashPackWalletService.sendTransaction(transaction);
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  };

  const debug = () => {
    hashPackWalletService.debug();
  };

  const value = {
    walletInfo,
    connectionState,
    isConnecting,
    error,
    connect,
    disconnect,
    sendTransaction,
    isInitialized,
    isExtensionAvailable,
    debug,
  };

  return (
    <HashPackWalletContext.Provider value={value}>
      {children}
    </HashPackWalletContext.Provider>
  );
}

export function useHashPackWallet() {
  const context = useContext(HashPackWalletContext);
  if (context === undefined) {
    throw new Error('useHashPackWallet must be used within a HashPackWalletProvider');
  }
  return context;
}