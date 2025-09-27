import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Wallet, CheckCircle, AlertCircle, Unlink, ExternalLink, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useHashPackWallet } from "@/contexts/HashPackWalletContext";
import { ConnectionState } from "@/services/hashPackWalletService";

interface HashPackWalletConnectionProps {
  onWalletConnect?: (walletInfo: any) => void;
  onWalletDisconnect?: () => void;
}

export function HashPackWalletConnection({ onWalletConnect, onWalletDisconnect }: HashPackWalletConnectionProps) {
  const { 
    walletInfo, 
    connectionState, 
    isConnecting, 
    error, 
    connect, 
    disconnect,
    isInitialized,
    isExtensionAvailable,
    debug
  } = useHashPackWallet();
  const [selectedNetwork, setSelectedNetwork] = useState<'testnet' | 'mainnet'>('testnet');
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const { toast } = useToast();

  const handleConnect = async () => {
    try {
      await connect(selectedNetwork);
      if (walletInfo) {
        onWalletConnect?.(walletInfo);
        toast({
          title: "HashPack Connected",
          description: `Successfully connected to HashPack on ${selectedNetwork}`,
        });
      }
    } catch (error: any) {
      toast({
        title: "Connection Failed",
        description: error.message || 'Failed to connect to HashPack',
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
        description: "Your HashPack wallet has been disconnected",
      });
    } catch (error: any) {
      toast({
        title: "Disconnection Failed",
        description: error.message || 'Failed to disconnect HashPack',
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

  const openHashPackPortal = () => {
    window.open('https://portal.hedera.com', '_blank');
  };

  const getConnectionStateDisplay = () => {
    switch (connectionState) {
      case ConnectionState.Connected:
        return { text: "Connected", color: "bg-green-500", icon: CheckCircle };
      case ConnectionState.Connecting:
        return { text: "Connecting", color: "bg-yellow-500", icon: AlertCircle };
      case ConnectionState.Disconnected:
        return { text: "Disconnected", color: "bg-gray-500", icon: AlertCircle };
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
            Initializing HashPack Connection
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

  if (walletInfo && connectionState === ConnectionState.Connected) {
    const stateDisplay = getConnectionStateDisplay();

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            HashPack Connected
          </CardTitle>
          <CardDescription>
            Your HashPack wallet is connected and ready for blockchain transactions
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
              onClick={openHashPackPortal}
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
          <Wallet className="h-5 w-5" />
          Connect HashPack Wallet
        </CardTitle>
        <CardDescription>
          Connect your HashPack wallet to enable secure blockchain transactions
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
          <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertDescription className="text-blue-800 dark:text-blue-200">
            <strong>HashPack Connection:</strong> This will attempt to connect via HashPack browser extension first, then fallback to web wallet if needed. 
            Your private keys remain secure and are never shared with this application.
          </AlertDescription>
        </Alert>

        <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">How it works:</h4>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>• Click "Connect HashPack" to open the connection modal</li>
            <li>• If no extension is found, web wallet will open automatically</li>
            <li>• Approve the connection in your HashPack wallet</li>
            <li>• Sign transactions securely through HashPack</li>
            <li>• Your private keys never leave your wallet</li>
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
                Connecting...
              </>
            ) : (
              <>
                <Wallet className="h-4 w-4 mr-2" />
                Connect HashPack
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            onClick={() => window.open('https://www.hashpack.app/download', '_blank')}
            className="flex items-center gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            Get HashPack
          </Button>
        </div>

        {/* Extension Detection Status */}
        <Alert className={isExtensionAvailable ? "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950" : "border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950"}>
          <AlertCircle className={`h-4 w-4 ${isExtensionAvailable ? "text-green-600 dark:text-green-400" : "text-orange-600 dark:text-orange-400"}`} />
          <AlertDescription className={isExtensionAvailable ? "text-green-800 dark:text-green-200" : "text-orange-800 dark:text-orange-200"}>
            <strong>Extension Status:</strong> {isExtensionAvailable ? "HashPack extension detected" : "HashPack extension not detected - will use web wallet"}
          </AlertDescription>
        </Alert>

        {/* Debug Section */}
        <div className="border-t pt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDebugInfo(!showDebugInfo)}
            className="text-xs"
          >
            {showDebugInfo ? "Hide" : "Show"} Debug Info
          </Button>
          
          {showDebugInfo && (
            <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-md">
              <div className="text-xs space-y-1">
                <div><strong>Initialized:</strong> {isInitialized ? "Yes" : "No"}</div>
                <div><strong>Extension Available:</strong> {isExtensionAvailable ? "Yes" : "No"}</div>
                <div><strong>Connection State:</strong> {connectionState}</div>
                <div><strong>Is Connecting:</strong> {isConnecting ? "Yes" : "No"}</div>
                {error && <div><strong>Error:</strong> {error}</div>}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={debug}
                className="mt-2 text-xs"
              >
                Log Debug Info to Console
              </Button>
            </div>
          )}
        </div>

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
        </div>
      </CardContent>
    </Card>
  );
}
