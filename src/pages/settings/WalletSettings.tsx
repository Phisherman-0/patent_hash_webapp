import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useBalance, useChainId } from 'wagmi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wallet, Shield, Activity } from "lucide-react";

export default function WalletSettings() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { data: balance } = useBalance({ address });

  const networkName = chainId === 84532 ? "Base Sepolia (Testnet)" : chainId === 8453 ? "Base Mainnet" : `Chain ${chainId}`;

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Wallet Settings</h1>
        <p className="text-muted-foreground mt-2">
          Connect your Ethereum wallet to interact with Base blockchain for patent registration.
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              Wallet Connection
            </CardTitle>
            <CardDescription>
              Connect your wallet using RainbowKit. Supports MetaMask, Coinbase Wallet, WalletConnect and more.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <ConnectButton />

            {isConnected && address && (
              <div className="mt-4 p-4 bg-muted rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge variant="default" className="bg-green-500">Connected</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Address</span>
                  <span className="text-sm font-mono">{address.slice(0, 6)}...{address.slice(-4)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Network</span>
                  <span className="text-sm">{networkName}</span>
                </div>
                {balance && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Balance</span>
                    <span className="text-sm">{(balance as any)?.formatted ? parseFloat((balance as any).formatted).toFixed(4) : '0.0000'} {balance.symbol}</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              About Base Blockchain
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Patent Hash uses <strong>Base</strong>, an Ethereum Layer-2 network built by Coinbase, for patent registration.
              Transactions are fast, cheap, and secured by Ethereum's security.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-muted rounded">
                <div className="font-medium">Testnet</div>
                <div className="text-muted-foreground">Base Sepolia (Chain ID: 84532)</div>
              </div>
              <div className="p-3 bg-muted rounded">
                <div className="font-medium">Mainnet</div>
                <div className="text-muted-foreground">Base (Chain ID: 8453)</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              How Patent Registration Works
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3 text-sm text-muted-foreground list-decimal list-inside">
              <li>Upload your patent document — it's hashed (SHA-256) for uniqueness.</li>
              <li>The patent hash is registered on the Base blockchain via our smart contract.</li>
              <li>The backend verifies the registration and updates your dashboard.</li>
              <li>A transaction receipt is available as proof of registration.</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}