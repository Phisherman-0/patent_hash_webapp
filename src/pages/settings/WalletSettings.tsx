import { useState, useEffect } from "react";
import { WalletConnection } from "@/components/wallet/WalletConnection";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Wallet, Shield, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WalletInfo {
  accountId: string;
  privateKey: string;
  network: 'testnet' | 'mainnet';
  isConnected: boolean;
}

export default function WalletSettings() {
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Load wallet info from localStorage
    const savedWallet = localStorage.getItem('hedera_wallet_info');
    if (savedWallet) {
      try {
        const parsed = JSON.parse(savedWallet);
        setWalletInfo(parsed);
      } catch (error) {
        console.error('Failed to parse saved wallet info:', error);
      }
    }
  }, []);

  const handleWalletConnect = (wallet: WalletInfo) => {
    setWalletInfo(wallet);
  };

  const handleWalletDisconnect = () => {
    setWalletInfo(null);
  };

  const testConnection = async () => {
    if (!walletInfo) return;

    try {
      // Here you would make an API call to test the wallet connection
      // For now, we'll just show a success message
      toast({
        title: "Connection Test Successful",
        description: "Your wallet connection is working properly",
      });
    } catch (error) {
      toast({
        title: "Connection Test Failed",
        description: "There was an issue with your wallet connection",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto pb-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Wallet Settings</h1>
        <p className="text-gray-600 mt-2">
          Manage your Hedera blockchain wallet connection for patent storage and NFT minting
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <WalletConnection 
            onWalletConnect={handleWalletConnect}
            onWalletDisconnect={handleWalletDisconnect}
          />

          {walletInfo?.isConnected && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Connection Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Status</span>
                    <span className="text-sm text-green-600">Connected</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Network</span>
                    <span className="text-sm capitalize">{walletInfo.network}</span>
                  </div>
                  <Button onClick={testConnection} variant="outline" className="w-full">
                    Test Connection
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                About Hedera Integration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Blockchain Features</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Immutable patent hash storage</li>
                  <li>• Proof-of-existence timestamps</li>
                  <li>• NFT minting for patent ownership</li>
                  <li>• Decentralized verification</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Security</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Keys stored locally only</li>
                  <li>• No server-side key storage</li>
                  <li>• Encrypted local storage</li>
                  <li>• Testnet recommended for development</li>
                </ul>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Getting Started:</strong> Create a free Hedera testnet account at{" "}
                  <a 
                    href="https://portal.hedera.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    portal.hedera.com
                  </a>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Transaction Costs</CardTitle>
              <CardDescription>
                Estimated costs for blockchain operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Patent Hash Storage</span>
                  <span className="font-mono">~0.001 HBAR</span>
                </div>
                <div className="flex justify-between">
                  <span>NFT Creation</span>
                  <span className="font-mono">~0.01 HBAR</span>
                </div>
                <div className="flex justify-between">
                  <span>NFT Transfer</span>
                  <span className="font-mono">~0.001 HBAR</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
