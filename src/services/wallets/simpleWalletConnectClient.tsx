import { useCallback, useEffect, useState } from 'react';
import EventEmitter from "events";

// Simple wallet interface without complex Hedera SDK dependencies
export interface SimpleWalletInfo {
  accountId: string;
  network: 'testnet' | 'mainnet';
  isConnected: boolean;
  balance?: string;
}

// Event emitter for wallet state changes
const walletEvents = new EventEmitter();

// Simple wallet state management
class SimpleWalletManager {
  private walletInfo: SimpleWalletInfo | null = null;
  private isConnecting = false;

  async connect(network: 'testnet' | 'mainnet' = 'testnet'): Promise<SimpleWalletInfo> {
    this.isConnecting = true;
    walletEvents.emit('connecting');

    try {
      // Check if HashPack extension is available
      if (typeof window !== 'undefined' && (window as any).hashpack) {
        const hashpack = (window as any).hashpack;
        
        // Try to connect to HashPack
        const response = await hashpack.requestAccountInfo();
        
        if (response && response.accountId) {
          this.walletInfo = {
            accountId: response.accountId,
            network: response.network || network,
            isConnected: true,
          };
          
          // Save to localStorage
          localStorage.setItem('simple-wallet-info', JSON.stringify(this.walletInfo));
          
          walletEvents.emit('connected', this.walletInfo);
          return this.walletInfo;
        }
      }
      
      // If HashPack extension is not available, show instructions
      throw new Error('HashPack extension not found. Please install HashPack wallet extension.');
      
    } catch (error: any) {
      walletEvents.emit('error', error.message);
      throw error;
    } finally {
      this.isConnecting = false;
      walletEvents.emit('connectingEnd');
    }
  }

  async disconnect(): Promise<void> {
    this.walletInfo = null;
    localStorage.removeItem('simple-wallet-info');
    walletEvents.emit('disconnected');
  }

  getWalletInfo(): SimpleWalletInfo | null {
    return this.walletInfo;
  }

  isWalletConnecting(): boolean {
    return this.isConnecting;
  }

  // Load saved wallet info from localStorage
  loadSavedWallet(): SimpleWalletInfo | null {
    try {
      const saved = localStorage.getItem('simple-wallet-info');
      if (saved) {
        this.walletInfo = JSON.parse(saved);
        return this.walletInfo;
      }
    } catch (error) {
      console.error('Failed to load saved wallet:', error);
    }
    return null;
  }

  // Check if HashPack extension is available
  isExtensionAvailable(): boolean {
    return typeof window !== 'undefined' && !!(window as any).hashpack;
  }

  // Get account balance from mirror node
  async getAccountBalance(accountId: string, network: 'testnet' | 'mainnet' = 'testnet'): Promise<string | null> {
    try {
      const baseUrl = network === 'mainnet' 
        ? 'https://mainnet-public.mirrornode.hedera.com'
        : 'https://testnet.mirrornode.hedera.com';
      
      const response = await fetch(`${baseUrl}/api/v1/balances?account.id=${accountId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      const balance = data.balances?.[0]?.balance || 0;
      
      // Convert tinybars to HBAR
      return (balance / 100000000).toFixed(8);
    } catch (error) {
      console.error('Error fetching balance:', error);
      return null;
    }
  }

  // Send a simple transaction (placeholder for now)
  async sendTransaction(transactionData: any): Promise<string | null> {
    if (!this.walletInfo) {
      throw new Error('Wallet not connected');
    }

    try {
      if (typeof window !== 'undefined' && (window as any).hashpack) {
        const hashpack = (window as any).hashpack;
        const result = await hashpack.sendTransaction(transactionData);
        return result?.transactionId || null;
      }
      throw new Error('HashPack extension not available');
    } catch (error: any) {
      console.error('Transaction failed:', error);
      throw error;
    }
  }
}

// Singleton instance
const walletManager = new SimpleWalletManager();

// React hook for wallet state
export const useSimpleWallet = () => {
  const [walletInfo, setWalletInfo] = useState<SimpleWalletInfo | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExtensionAvailable, setIsExtensionAvailable] = useState(false);

  // Initialize wallet state
  useEffect(() => {
    // Load saved wallet
    const saved = walletManager.loadSavedWallet();
    if (saved) {
      setWalletInfo(saved);
    }

    // Check extension availability
    setIsExtensionAvailable(walletManager.isExtensionAvailable());

    // Set up event listeners
    const handleConnected = (info: SimpleWalletInfo) => {
      setWalletInfo(info);
      setError(null);
    };

    const handleDisconnected = () => {
      setWalletInfo(null);
      setError(null);
    };

    const handleConnecting = () => {
      setIsConnecting(true);
      setError(null);
    };

    const handleConnectingEnd = () => {
      setIsConnecting(false);
    };

    const handleError = (errorMessage: string) => {
      setError(errorMessage);
      setIsConnecting(false);
    };

    walletEvents.on('connected', handleConnected);
    walletEvents.on('disconnected', handleDisconnected);
    walletEvents.on('connecting', handleConnecting);
    walletEvents.on('connectingEnd', handleConnectingEnd);
    walletEvents.on('error', handleError);

    return () => {
      walletEvents.off('connected', handleConnected);
      walletEvents.off('disconnected', handleDisconnected);
      walletEvents.off('connecting', handleConnecting);
      walletEvents.off('connectingEnd', handleConnectingEnd);
      walletEvents.off('error', handleError);
    };
  }, []);

  const connect = useCallback(async (network: 'testnet' | 'mainnet' = 'testnet') => {
    try {
      await walletManager.connect(network);
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      await walletManager.disconnect();
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  }, []);

  const getBalance = useCallback(async () => {
    if (!walletInfo) return null;
    
    try {
      const balance = await walletManager.getAccountBalance(walletInfo.accountId, walletInfo.network);
      if (balance && walletInfo) {
        const updatedInfo = { ...walletInfo, balance };
        setWalletInfo(updatedInfo);
        localStorage.setItem('simple-wallet-info', JSON.stringify(updatedInfo));
      }
      return balance;
    } catch (error: any) {
      setError(error.message);
      return null;
    }
  }, [walletInfo]);

  const sendTransaction = useCallback(async (transactionData: any) => {
    try {
      return await walletManager.sendTransaction(transactionData);
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  }, []);

  return {
    walletInfo,
    isConnecting,
    error,
    isExtensionAvailable,
    connect,
    disconnect,
    getBalance,
    sendTransaction,
    clearError: () => setError(null),
  };
};