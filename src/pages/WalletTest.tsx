import { AccountId } from "@hashgraph/sdk";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ContractFunctionParameterBuilder } from "@/services/wallets/contractFunctionParameterBuilder";
import { useWalletInterface } from "@/services/wallets/useWalletInterface";
import { useState } from "react";
import { WalletConnection } from "@/components/wallet/WalletConnection";

export default function WalletTest() {
  const { walletInterface, accountId } = useWalletInterface();
  const [toAccountId, setToAccountId] = useState("");
  const [amount, setAmount] = useState(1);

  const handleTransferHBAR = async () => {
    if (!walletInterface || !toAccountId) {
      alert("Please connect wallet and enter recipient account ID");
      return;
    }

    try {
      const txId = await walletInterface.transferHBAR(AccountId.fromString(toAccountId), amount);
      alert(`Transaction successful! Transaction ID: ${txId}`);
    } catch (error: any) {
      alert(`Transaction failed: ${error.message}`);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">HashPack Wallet Test</h1>
          <p className="text-muted-foreground mt-2">
            Test HashPack wallet connection and transactions
          </p>
        </div>

        {/* Wallet Connection */}
        <Card>
          <CardHeader>
            <CardTitle>Wallet Connection</CardTitle>
            <CardDescription>
              Connect your HashPack wallet to start testing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WalletConnection />
            {accountId && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-800">
                  <strong>Connected Account:</strong> {accountId}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* HBAR Transfer */}
        {walletInterface && (
          <Card>
            <CardHeader>
              <CardTitle>Transfer HBAR</CardTitle>
              <CardDescription>
                Send HBAR to another account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (HBAR)</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
                    placeholder="Enter amount"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="toAccount">To Account ID</Label>
                  <Input
                    id="toAccount"
                    value={toAccountId}
                    onChange={(e) => setToAccountId(e.target.value)}
                    placeholder="0.0.123456"
                  />
                </div>
              </div>
              <Button onClick={handleTransferHBAR} className="w-full">
                Transfer HBAR
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <h4 className="font-semibold">1. Connect Wallet</h4>
              <p className="text-sm text-muted-foreground">
                Click "Connect Wallet" and select WalletConnect to connect your HashPack wallet
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">2. Test Transfer</h4>
              <p className="text-sm text-muted-foreground">
                Enter a recipient account ID (e.g., 0.0.123456) and amount to test HBAR transfer
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">3. Check Results</h4>
              <p className="text-sm text-muted-foreground">
                Transaction results will be displayed in alerts. Check HashScan for transaction details.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}