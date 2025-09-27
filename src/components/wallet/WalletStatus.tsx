import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Wallet, 
  ExternalLink, 
  Copy, 
  AlertCircle, 
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useHashPackWallet } from '@/contexts/HashPackWalletContext';
import { ConnectionState } from '@/services/hashPackWalletService';

export function WalletStatus() {
  const { toast } = useToast();
  const {
    walletInfo,
    connectionState,
    isConnecting,
    error,
    connect,
    disconnect,
    isExtensionAvailable
  } = useHashPackWallet();
  
  const [isRefreshing, setIsRefreshing] = useState(false);

  const isConnected = connectionState === ConnectionState.Connected && walletInfo?.isConnected;

  const handleConnect = async () => {
    try {
      await connect('testnet');
      toast({
        title: "Wallet Connected",
        description: "Successfully connected to HashPack wallet",
      });
    } catch (error: any) {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect wallet",
        variant: "destructive",
      });
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      toast({
        title: "Wallet Disconnected",
        description: "Successfully disconnected from wallet",
      });
    } catch (error: any) {
      toast({
        title: "Disconnection Failed",
        description: error.message || "Failed to disconnect wallet",
        variant: "destructive",
      });
    }
  };

  const copyAccountId = () => {
    if (walletInfo?.accountId) {
      navigator.clipboard.writeText(walletInfo.accountId);
      toast({
        title: "Copied",
        description: "Account ID copied to clipboard",
      });
    }
  };

  const openInExplorer = () => {
    if (walletInfo?.accountId) {
      const explorerUrl = walletInfo.network === 'mainnet' 
        ? `https://hashscan.io/mainnet/account/${walletInfo.accountId}`
        : `https://hashscan.io/testnet/account/${walletInfo.accountId}`;
      window.open(explorerUrl, '_blank');
    }
  };

  if (!isConnected) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleConnect}
        disabled={isConnecting}
        className="flex items-center space-x-2"
      >
        {isConnecting ? (
          <RefreshCw className="h-4 w-4 animate-spin" />
        ) : (
          <Wallet className="h-4 w-4" />
        )}
        <span>{isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
      </Button>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center space-x-2"
        >
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span className="hidden sm:inline">Connected</span>
          <Badge variant="secondary" className="hidden md:inline">
            {walletInfo.network === 'mainnet' ? 'Mainnet' : 'Testnet'}
          </Badge>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Wallet Connected</h4>
            <Badge variant="outline">
              {walletInfo.network === 'mainnet' ? 'Mainnet' : 'Testnet'}
            </Badge>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Account</span>
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyAccountId}
                  className="h-6 w-6 p-0"
                >
                  <Copy className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={openInExplorer}
                  className="h-6 w-6 p-0"
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <div className="p-2 bg-muted rounded-md">
              <code className="text-xs font-mono break-all">
                {walletInfo.accountId}
              </code>
            </div>
          </div>
          
          {error && (
            <div className="flex items-center space-x-2 p-2 bg-destructive/10 rounded-md">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <span className="text-xs text-destructive">{error}</span>
            </div>
          )}
          
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDisconnect}
              className="flex-1"
            >
              Disconnect
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}