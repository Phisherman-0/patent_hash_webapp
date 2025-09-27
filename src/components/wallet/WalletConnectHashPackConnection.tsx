import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Wallet, 
  CheckCircle, 
  AlertCircle, 
  Unlink, 
  ExternalLink, 
  Copy, 
  RefreshCw, 
  Smartphone,
  QrCode,
  ChevronDown,
  Zap
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useWalletConnectHashPack } from "@/contexts/WalletConnectHashPackContext";
import { WalletConnectState } from "@/services/walletConnectHashPackService";

interface WalletConnectHashPackConnectionProps {
  onWalletConnect?: (walletInfo: any) => void;
  onWalletDisconnect?: () => void;
}

export function WalletConnectHashPackConnection({ onWalletConnect, onWalletDisconnect }: WalletConnectHashPackConnectionProps) {
  const { 
    walletInfo, 
    connectionState, 
    isConnecting, 
    error, 
    connect, 
    disconnect,
    openHashPackWallet,
    isInitialized,
    debug
  } = useWalletConnectHashPack();
  
  const [selectedNetwork, setSelectedNetwork] = useState<'testnet' | 'mainnet'>('testnet');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const { toast } = useToast();

  // Reset connection attempts on successful connection
  useEffect(() => {
    if (connectionState === WalletConnectState.Connected) {
      setConnectionAttempts(0);
    }
  }, [connectionState]);

  const handleConnect = async () => {
    try {
      setConnectionAttempts(prev => prev + 1);
      await connect(selectedNetwork);
      
      if (walletInfo) {
        onWalletConnect?.(walletInfo);
        toast({
          title: "HashPack Connected via WalletConnect",
          description: `Successfully connected to HashPack on ${selectedNetwork}`,
        });
      }
    } catch (error: any) {
      console.error('WalletConnect connection failed:', error);
      toast({
        title: "WalletConnect Connection Failed",
        description: error.message || 'Failed to connect to HashPack via WalletConnect',
        variant: "destructive",
      });
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      onWalletDisconnect?.();
      toast({
        title: "HashPack Disconnected",
        description: "Your HashPack wallet has been disconnected from WalletConnect",
      });
    } catch (error: any) {
      toast({
        title: "Disconnection Failed",
        description: error.message || 'Failed to disconnect HashPack from WalletConnect',
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: `${label} copied to clipboard`,
    });
  };

  const getConnectionStateDisplay = () => {
    switch (connectionState) {
      case WalletConnectState.Connected:
        return { text: "Connected", color: "bg-green-500", icon: CheckCircle };
      case WalletConnectState.Connecting:
        return { text: "Connecting", color: "bg-yellow-500", icon: RefreshCw };
      case WalletConnectState.Disconnected:
        return { text: "Disconnected", color: "bg-gray-500", icon: AlertCircle };
      case WalletConnectState.Error:
        return { text: "Error", color: "bg-red-500", icon: AlertCircle };
      default:
        return { text: "Unknown", color: "bg-gray-500", icon: AlertCircle };
    }
  };

  if (!isInitialized) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Initializing WalletConnect
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (walletInfo && connectionState === WalletConnectState.Connected) {
    const stateDisplay = getConnectionStateDisplay();

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            HashPack Connected via WalletConnect
          </CardTitle>
          <CardDescription>
            Your HashPack wallet is connected via WalletConnect and ready for transactions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${stateDisplay.color}`}></div>
              {stateDisplay.text}
            </Badge>
            <Badge variant="secondary">
              {walletInfo.network.toUpperCase()}
            </Badge>
            <Badge variant="outline" className="text-xs">
              WalletConnect
            </Badge>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Account ID</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 px-3 py-2 bg-muted rounded-md font-mono text-sm text-foreground">
                {walletInfo.accountId}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(walletInfo.accountId, 'Account ID')}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {walletInfo.address && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Wallet Address</label>
              <div className="flex items-center gap-2">
                <div className="flex-1 px-3 py-2 bg-muted rounded-md font-mono text-sm text-foreground">
                  {walletInfo.address}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(walletInfo.address!, 'Wallet Address')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Network</label>
            <div className="px-3 py-2 bg-muted rounded-md text-sm capitalize text-foreground">
              {walletInfo.network}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="destructive"
              onClick={handleDisconnect}
              className="flex items-center gap-2"
            >
              <Unlink className="h-4 w-4" />
              Disconnect
            </Button>
            <Button
              variant="outline"
              onClick={openHashPackWallet}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Open HashPack
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open('https://portal.hedera.com', '_blank')}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Hedera Portal
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5" />
          Connect HashPack via WalletConnect
          {connectionAttempts > 0 && (
            <Badge variant="outline" className="text-xs">
              Attempt {connectionAttempts}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Connect your HashPack wallet using WalletConnect protocol for secure mobile and web access
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium">Network</label>
          <select
            value={selectedNetwork}
            onChange={(e) => setSelectedNetwork(e.target.value as 'testnet' | 'mainnet')}
            className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
            disabled={isConnecting}
          >
            <option value="testnet">Testnet (Recommended for Development)</option>
            <option value="mainnet">Mainnet (Production)</option>
          </select>
        </div>

        <Alert className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950">
          <Smartphone className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertDescription className="text-blue-800 dark:text-blue-200">
            <strong>WalletConnect Integration:</strong> This will open a connection modal where you can scan a QR code with your HashPack mobile app or connect via the web wallet at wallet.hashpack.app.
          </AlertDescription>
        </Alert>

        <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border border-green-200 dark:border-green-800">
          <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2 flex items-center gap-2">
            <QrCode className="h-4 w-4" />
            How WalletConnect Works:
          </h4>
          <ul className="text-sm text-green-800 dark:text-green-200 space-y-1">
            <li>• Click "Connect via WalletConnect" to open the connection modal</li>
            <li>• Scan the QR code with HashPack mobile app</li>
            <li>• Or click "HashPack" in the wallet list to open web wallet</li>
            <li>• Approve the connection in your HashPack wallet</li>
            <li>• Sign transactions securely through WalletConnect</li>
          </ul>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleConnect}
            disabled={isConnecting}
            className="flex-1"
          >
            {isConnecting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Connecting via WalletConnect...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Connect via WalletConnect
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            onClick={openHashPackWallet}
            className="flex items-center gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            Open HashPack
          </Button>
        </div>

        {/* Connection Methods */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="p-3 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Smartphone className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-sm">Mobile App</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Scan QR code with HashPack mobile app for secure connection
            </p>
          </div>
          
          <div className="p-3 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <ExternalLink className="h-4 w-4 text-green-600" />
              <span className="font-medium text-sm">Web Wallet</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Connect directly through wallet.hashpack.app
            </p>
          </div>
        </div>

        {/* Advanced Options */}
        <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between text-xs">
              <span>Advanced Options</span>
              <ChevronDown className="h-3 w-3" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 mt-3">
            <div className="text-xs space-y-2">
              <div><strong>Connection State:</strong> {connectionState}</div>
              <div><strong>Is Connecting:</strong> {isConnecting ? "Yes" : "No"}</div>
              <div><strong>Connection Attempts:</strong> {connectionAttempts}</div>
              {error && <div><strong>Error:</strong> {error}</div>}
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={debug}
                className="text-xs"
              >
                Debug to Console
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
                className="text-xs"
              >
                Reload Page
              </Button>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <div className="text-xs text-gray-500 text-center">
          Don't have HashPack? Download it from{" "}
          <a 
            href="https://www.hashpack.app/download" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            hashpack.app
          </a>
          {" "}or use the web wallet at{" "}
          <a 
            href="https://wallet.hashpack.app" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            wallet.hashpack.app
          </a>
        </div>
      </CardContent>
    </Card>
  );
}