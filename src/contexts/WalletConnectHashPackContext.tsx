import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { walletConnectHashPackService, HashPackWalletConnectInfo, WalletConnectState } from '@/services/walletConnectHashPackService';

interface WalletConnectHashPackContextType {
  walletInfo: HashPackWalletConnectInfo | null;
  connectionState: WalletConnectState;
  isConnecting: boolean;
  error: string | null;
  connect: (network?: 'testnet' | 'mainnet') => Promise<void>;
  disconnect: () => Promise<void>;
  sendTransaction: (transactionData: any) => Promise<any>;
  signMessage: (message: string) => Promise<string>;
  openHashPackWallet: () => void;
  isInitialized: boolean;
  debug: () => void;
}

const WalletConnectHashPackContext = createContext<WalletConnectHashPackContextType | undefined>(undefined);

export function WalletConnectHashPackProvider({ children }: { children: ReactNode }) {
  const [walletInfo, setWalletInfo] = useState<HashPackWalletConnectInfo | null>(null);
  const [connectionState, setConnectionState] = useState<WalletConnectState>(
    WalletConnectState.Disconnected
  );
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize WalletConnect service on mount
  useEffect(() => {
    const initializeWalletConnect = async () => {
      try {
        console.log('🚀 Initializing HashPack WalletConnect service...');
        await walletConnectHashPackService.init();
        setIsInitialized(true);
        
        // Get initial state
        const initialState = walletConnectHashPackService.getState();
        const initialWallet = walletConnectHashPackService.getWalletInfo();
        
        console.log('✅ WalletConnect initialized - State:', initialState, 'Wallet:', initialWallet);
        
        setConnectionState(initialState);
        setWalletInfo(initialWallet);
        
        // If we have a wallet, we're connected
        if (initialWallet && initialState === WalletConnectState.Connected) {
          console.log('✅ Found existing WalletConnect connection');
        }
      } catch (error: any) {
        console.error('❌ Failed to initialize WalletConnect:', error);
        setError(error.message);
        setIsInitialized(true); // Set as initialized even on error to prevent infinite loading
      }
    };

    // Initialize immediately
    initializeWalletConnect();
  }, []);

  // Set up event listeners for WalletConnect events
  useEffect(() => {
    const handleConnected = (event: CustomEvent) => {
      console.log('WalletConnect connected event received in context:', event.detail);
      setWalletInfo(event.detail);
      setConnectionState(WalletConnectState.Connected);
      setIsConnecting(false);
      setError(null);
    };

    const handleDisconnected = () => {
      console.log('WalletConnect disconnected event received in context');
      setWalletInfo(null);
      setConnectionState(WalletConnectState.Disconnected);
      setIsConnecting(false);
    };

    const handleStatusChanged = (event: CustomEvent) => {
      console.log('WalletConnect status changed event received in context:', event.detail);
      setConnectionState(event.detail);
      
      // If we're connecting, update the connecting state
      if (event.detail === WalletConnectState.Connecting) {
        setIsConnecting(true);
      } else {
        setIsConnecting(false);
      }
    };

    // Add event listeners
    window.addEventListener('hashpack-walletconnect-connected', handleConnected as EventListener);
    window.addEventListener('hashpack-walletconnect-disconnected', handleDisconnected);
    window.addEventListener('hashpack-walletconnect-statusChanged', handleStatusChanged as EventListener);

    return () => {
      // Cleanup event listeners
      window.removeEventListener('hashpack-walletconnect-connected', handleConnected as EventListener);
      window.removeEventListener('hashpack-walletconnect-disconnected', handleDisconnected);
      window.removeEventListener('hashpack-walletconnect-statusChanged', handleStatusChanged as EventListener);
    };
  }, []);

  const connect = async (network: 'testnet' | 'mainnet' = 'testnet') => {
    if (!isInitialized) {
      setError('WalletConnect not initialized');
      return;
    }

    console.log('Starting HashPack WalletConnect connection process for network:', network);
    setIsConnecting(true);
    setConnectionState(WalletConnectState.Connecting);
    setError(null);

    try {
      console.log('Attempting to connect to HashPack via WalletConnect...');
      const wallet = await walletConnectHashPackService.connect(network);
      
      console.log('HashPack WalletConnect connection successful:', wallet);
      setWalletInfo(wallet);
      setConnectionState(WalletConnectState.Connected);
      
      // Save connection to backend
      if (wallet) {
        try {
          console.log('Saving WalletConnect wallet connection to backend...');
          const response = await fetch('/api/wallet/hashpack/connect', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
              accountId: wallet.accountId,
              network: wallet.network,
              address: wallet.address,
              connectionType: 'walletconnect',
              sessionData: wallet.sessionData || {},
            }),
          });
          
          if (!response.ok) {
            console.error('Failed to save WalletConnect wallet connection to backend:', response.statusText);
          } else {
            console.log('WalletConnect wallet connection saved to backend successfully');
          }
        } catch (error) {
          console.error('Failed to save WalletConnect wallet connection to backend:', error);
        }
      }
    } catch (error: any) {
      console.error('HashPack WalletConnect connection failed:', error);
      setError(error.message);
      setConnectionState(WalletConnectState.Error);
      setIsConnecting(false);
    }
  };

  const disconnect = async () => {
    try {
      console.log('Disconnecting HashPack WalletConnect wallet...');
      await walletConnectHashPackService.disconnect();
      setWalletInfo(null);
      setConnectionState(WalletConnectState.Disconnected);
      setError(null);
      console.log('HashPack WalletConnect wallet disconnected successfully');
    } catch (error: any) {
      console.error('Failed to disconnect HashPack WalletConnect wallet:', error);
      setError(error.message);
    }
  };

  const sendTransaction = async (transactionData: any) => {
    if (!walletInfo) {
      throw new Error('WalletConnect wallet not connected');
    }

    try {
      return await walletConnectHashPackService.sendTransaction(transactionData);
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  };

  const signMessage = async (message: string) => {
    if (!walletInfo) {
      throw new Error('WalletConnect wallet not connected');
    }

    try {
      return await walletConnectHashPackService.signMessage(message);
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  };

  const openHashPackWallet = () => {
    walletConnectHashPackService.openHashPackWallet();
  };

  const debug = () => {
    walletConnectHashPackService.debug();
  };

  const value = {
    walletInfo,
    connectionState,
    isConnecting,
    error,
    connect,
    disconnect,
    sendTransaction,
    signMessage,
    openHashPackWallet,
    isInitialized,
    debug,
  };

  return (
    <WalletConnectHashPackContext.Provider value={value}>
      {children}
    </WalletConnectHashPackContext.Provider>
  );
}

export function useWalletConnectHashPack() {
  const context = useContext(WalletConnectHashPackContext);
  if (context === undefined) {
    throw new Error('useWalletConnectHashPack must be used within a WalletConnectHashPackProvider');
  }
  return context;
}