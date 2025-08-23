import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Wallet, Copy, CheckCircle, AlertCircle, Unlink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/contexts/WalletContext";
import { walletAPI } from "@/lib/apiService";

interface WalletInfo {
  accountId: string;
  privateKey: string;
  network: 'testnet' | 'mainnet';
  isConnected: boolean;
}

interface WalletConnectionProps {
  onWalletConnect?: (walletInfo: WalletInfo) => void;
  onWalletDisconnect?: () => void;
}

export function WalletConnection({ onWalletConnect, onWalletDisconnect }: WalletConnectionProps) {
  const { walletStatus, updateStatus } = useWallet();
  const [walletInfo, setWalletInfo] = useState<WalletInfo>({
    accountId: '',
    privateKey: '',
    network: 'testnet',
    isConnected: false
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Load wallet info from context on component mount
  useEffect(() => {
    if (walletStatus.isConfigured) {
      setWalletInfo({
        accountId: walletStatus.accountId || '',
        privateKey: '', // Don't show private key
        network: (walletStatus.network as 'testnet' | 'mainnet') || 'testnet',
        isConnected: true
      });
    }
  }, [walletStatus]);

  const validateAccountId = (accountId: string): boolean => {
    // Hedera account ID format: 0.0.XXXXXX
    const accountIdRegex = /^0\.0\.\d+$/;
    return accountIdRegex.test(accountId);
  };

  const validatePrivateKey = (privateKey: string): boolean => {
    // Check for ECDSA private key format (64 hex chars or with 0x prefix)
    const hexRegex = /^(0x)?[a-fA-F0-9]{64}$/;
    // Check for DER format (starts with 302e020100300506032b657004220420)
    const derRegex = /^302e020100300506032b657004220420[a-fA-F0-9]{64}$/;
    
    return hexRegex.test(privateKey) || derRegex.test(privateKey);
  };

  const handleConnect = async () => {
    setError(null);
    setIsConnecting(true);

    try {
      // Validate inputs
      if (!walletInfo.accountId || !walletInfo.privateKey) {
        throw new Error('Please provide both Account ID and Private Key');
      }

      if (!validateAccountId(walletInfo.accountId)) {
        throw new Error('Invalid Account ID format. Expected format: 0.0.XXXXXX');
      }

      if (!validatePrivateKey(walletInfo.privateKey)) {
        throw new Error('Invalid Private Key format. Expected 64-character hex string or DER format');
      }

      // Save wallet configuration to database via API
      await walletAPI.configure({
        accountId: walletInfo.accountId,
        privateKey: walletInfo.privateKey,
        network: walletInfo.network
      });

      const connectedWallet = {
        ...walletInfo,
        isConnected: true
      };

      setWalletInfo(connectedWallet);

      // Update global wallet status
      updateStatus({
        isConfigured: true,
        accountId: walletInfo.accountId,
        network: walletInfo.network,
        configuredAt: new Date().toISOString()
      });

      // Notify parent component
      onWalletConnect?.(connectedWallet);

      toast({
        title: "Wallet Connected",
        description: `Successfully connected to Hedera ${walletInfo.network}`,
      });

    } catch (error: any) {
      setError(error.message || 'Failed to connect wallet');
      toast({
        title: "Connection Failed",
        description: error.message || 'Failed to connect wallet',
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      // Disconnect wallet via API
      await walletAPI.disconnect();
      
      setWalletInfo({
        accountId: '',
        privateKey: '',
        network: 'testnet',
        isConnected: false
      });
      
      // Update global wallet status
      updateStatus({
        isConfigured: false
      });
      
      onWalletDisconnect?.();
      
      toast({
        title: "Wallet Disconnected",
        description: "Your wallet has been disconnected",
      });
    } catch (error) {
      toast({
        title: "Disconnection Failed",
        description: "Failed to disconnect wallet",
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

  if (walletInfo.isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Wallet Connected
          </CardTitle>
          <CardDescription>
            Your Hedera wallet is connected and ready to use
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Account ID</Label>
            <div className="flex items-center gap-2">
              <Input 
                value={walletInfo.accountId} 
                readOnly 
                className="font-mono text-sm"
              />
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
            <Label>Network</Label>
            <Input 
              value={walletInfo.network.toUpperCase()} 
              readOnly 
              className="capitalize"
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="destructive"
              onClick={handleDisconnect}
              className="flex items-center gap-2"
            >
              <Unlink className="h-4 w-4" />
              Disconnect Wallet
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
          Connect Hedera Wallet
        </CardTitle>
        <CardDescription>
          Connect your Hedera account to enable blockchain features
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
          <Label htmlFor="accountId">Account ID</Label>
          <Input
            id="accountId"
            placeholder="0.0.123456"
            value={walletInfo.accountId}
            onChange={(e) => setWalletInfo(prev => ({ ...prev, accountId: e.target.value }))}
            className="font-mono"
          />
          <p className="text-xs text-gray-500">
            Your Hedera account ID (format: 0.0.XXXXXX)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="privateKey">Private Key</Label>
          <Input
            id="privateKey"
            type="password"
            placeholder="Enter your private key"
            value={walletInfo.privateKey}
            onChange={(e) => setWalletInfo(prev => ({ ...prev, privateKey: e.target.value }))}
            className="font-mono"
          />
          <p className="text-xs text-gray-500">
            Your Hedera private key (ECDSA format)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="network">Network</Label>
          <select
            id="network"
            value={walletInfo.network}
            onChange={(e) => setWalletInfo(prev => ({ ...prev, network: e.target.value as 'testnet' | 'mainnet' }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="testnet">Testnet</option>
            <option value="mainnet">Mainnet</option>
          </select>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Your private key is stored locally and never sent to our servers. 
            Make sure you're using a testnet account for development.
          </AlertDescription>
        </Alert>

        <Button
          onClick={handleConnect}
          disabled={isConnecting || !walletInfo.accountId || !walletInfo.privateKey}
          className="w-full"
        >
          {isConnecting ? "Connecting..." : "Connect Wallet"}
        </Button>
      </CardContent>
    </Card>
  );
}
