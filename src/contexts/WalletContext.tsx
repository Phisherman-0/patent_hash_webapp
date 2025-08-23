import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { walletAPI } from '@/lib/apiService';

interface WalletStatusInfo {
  isConfigured: boolean;
  accountId?: string;
  network?: string;
  configuredAt?: string;
}

interface WalletContextType {
  walletStatus: WalletStatusInfo;
  isLoading: boolean;
  error: string | null;
  refreshStatus: () => Promise<void>;
  updateStatus: (status: WalletStatusInfo) => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [walletStatus, setWalletStatus] = useState<WalletStatusInfo>({ isConfigured: false });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkWalletStatus = async () => {
    try {
      setError(null);
      const status = await walletAPI.getStatus();
      setWalletStatus(status as WalletStatusInfo);
    } catch (error: any) {
      console.error('Failed to check wallet status:', error);
      setError('Failed to check wallet status');
      setWalletStatus({ isConfigured: false });
    } finally {
      setIsLoading(false);
    }
  };

  const refreshStatus = async () => {
    setIsLoading(true);
    await checkWalletStatus();
  };

  const updateStatus = (status: WalletStatusInfo) => {
    setWalletStatus(status);
    setError(null);
  };

  useEffect(() => {
    checkWalletStatus();
    
    // Set up polling to check wallet status every 30 seconds
    const interval = setInterval(checkWalletStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const value = {
    walletStatus,
    isLoading,
    error,
    refreshStatus,
    updateStatus,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
