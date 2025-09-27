import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useHederaWallet } from '@/contexts/HederaWalletContext';
import { Wallet, Copy, ExternalLink, RefreshCw, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function HederaWalletConnect() {
  const { 
    walletInfo, 
    isConnecting, 
    error, 
    connect, 
    disconnect, 
    refreshBalance 
  } = useHederaWallet();
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleConnect = async () => {
    try {
      await connect();
      toast({
        title: "Wallet Connected",
        description: "Successfully connected to HashPack wallet",
      });
    } catch (err: any) {
      toast({
        title: "Connection Failed",
        description: err.message || "Failed to connect wallet",
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
    } catch (err: any) {
      toast({
        title: "Disconnection Failed",
        description: err.message || "Failed to disconnect wallet",
        variant: "destructive",
      });
    }
  };

  const handleRefreshBalance = async () => {
    setIsRefreshing(true);
    try {
      await refreshBalance();
      toast({
        title: "Balance Updated",
        description: "Account balance has been refreshed",
      });
    } catch (err: any) {
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh balance",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
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

  const formatBalance = (balance?: number) => {
    if (balance === undefined || balance === null) return 'Loading...';
    return `${(balance / 100000000).toFixed(8)} HBAR`; // Convert tinybars to HBAR
  };

  if (!walletInfo?.isConnected) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Wallet className="w-6 h-6 text-primary" />
          </div>
          <CardTitle>Connect Your Wallet</CardTitle>
          <CardDescription>
            Connect your HashPack wallet to interact with the Hedera network
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
          
          <Button 
            onClick={handleConnect} 
            disabled={isConnecting}
            className="w-full"
            size="lg"
          >
            {isConnecting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Wallet className="w-4 h-4 mr-2" />
                Connect HashPack
              </>
            )}
          </Button>
          
          <div className="text-center text-sm text-muted-foreground">
            <p>Don't have HashPack?</p>
            <a 
              href="https://www.hashpack.app/download" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Download HashPack Wallet
            </a>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Wallet className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Wallet Connected</CardTitle>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="text-xs">
                  {walletInfo.network.toUpperCase()}
                </Badge>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Account ID */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Account ID</label>
          <div className="flex items-center space-x-2 p-2 bg-muted rounded-md">
            <code className="flex-1 text-sm font-mono">{walletInfo.accountId}</code>
            <Button
              variant="ghost"
              size="sm"
              onClick={copyAccountId}
              className="h-8 w-8 p-0"
            >
              <Copy className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={openInExplorer}
              className="h-8 w-8 p-0"
            >
              <ExternalLink className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Balance */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-muted-foreground">Balance</label>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefreshBalance}
              disabled={isRefreshing}
              className="h-6 w-6 p-0"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          <div className="p-2 bg-muted rounded-md">
            <p className="text-sm font-mono">{formatBalance(walletInfo.balance)}</p>
          </div>
        </div>

        <Separator />

        {/* Actions */}
        <div className="space-y-2">
          <Button 
            variant="outline" 
            onClick={handleDisconnect}
            className="w-full"
          >
            Disconnect Wallet
          </Button>
        </div>

        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}