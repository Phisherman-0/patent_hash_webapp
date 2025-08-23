import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Wallet, Lock, Mail, Eye, EyeOff, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/contexts/WalletContext";
import { walletAPI } from "@/lib/apiService";

interface WalletConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWalletConnected: () => void;
  title?: string;
  description?: string;
}

export function WalletConnectionModal({ 
  isOpen, 
  onClose, 
  onWalletConnected,
  title = "Connect Wallet to Continue",
  description = "A wallet connection is required to file patents on the blockchain. Please configure your Hedera wallet to proceed."
}: WalletConnectionModalProps) {
  const [walletInfo, setWalletInfo] = useState({
    accountId: '',
    privateKey: '',
    network: 'testnet' as 'testnet' | 'mainnet'
  });
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { updateStatus } = useWallet();

  const validateAccountId = (accountId: string): boolean => {
    const accountIdRegex = /^0\.0\.\d+$/;
    return accountIdRegex.test(accountId);
  };

  const validatePrivateKey = (privateKey: string): boolean => {
    const hexRegex = /^(0x)?[a-fA-F0-9]{64}$/;
    return hexRegex.test(privateKey);
  };

  const handleConnect = async () => {
    setError(null);
    setIsConnecting(true);

    try {
      if (!walletInfo.accountId || !walletInfo.privateKey) {
        throw new Error('Please fill in all required fields');
      }

      if (!validateAccountId(walletInfo.accountId)) {
        throw new Error('Invalid Account ID format. Expected format: 0.0.XXXXXX');
      }

      if (!validatePrivateKey(walletInfo.privateKey)) {
        throw new Error('Invalid Private Key format. Expected 64-character hex string');
      }

      // First validate wallet credentials with Hedera network
      const validationResult = await walletAPI.validate({
        accountId: walletInfo.accountId,
        privateKey: walletInfo.privateKey,
        network: walletInfo.network
      });

      if (!validationResult.isValid) {
        throw new Error(validationResult.error || 'Wallet validation failed');
      }

      // Save wallet configuration via API (validation happens server-side too)
      const configResult = await walletAPI.configure({
        accountId: walletInfo.accountId,
        privateKey: walletInfo.privateKey,
        network: walletInfo.network
      });

      // Update global wallet status
      updateStatus({
        isConfigured: true,
        accountId: walletInfo.accountId,
        network: walletInfo.network,
        configuredAt: new Date().toISOString()
      });

      toast({
        title: "Wallet Connected & Verified",
        description: `Successfully connected to Hedera ${walletInfo.network}. Balance: ${validationResult.balance} HBAR`,
      });

      // Reset form
      setWalletInfo({
        accountId: '',
        privateKey: '',
        network: 'testnet'
      });

      onWalletConnected();
      onClose();

    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || error?.response?.data?.message || error.message || 'Failed to connect wallet';
      setError(errorMessage);
      toast({
        title: "Connection Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setWalletInfo({
      accountId: '',
      privateKey: '',
      network: 'testnet'
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Wallet className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <DialogTitle className="text-xl">{title}</DialogTitle>
              <DialogDescription className="text-sm text-gray-600 mt-1">
                {description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            <div>
              <Label htmlFor="accountId" className="text-sm font-medium">
                Account ID
              </Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="accountId"
                  placeholder="0.0.123456"
                  value={walletInfo.accountId}
                  onChange={(e) => setWalletInfo(prev => ({ ...prev, accountId: e.target.value }))}
                  className="pl-10 h-10 border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="privateKey" className="text-sm font-medium">
                Private Key
              </Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="privateKey"
                  type={showPrivateKey ? "text" : "password"}
                  placeholder="Enter your private key"
                  value={walletInfo.privateKey}
                  onChange={(e) => setWalletInfo(prev => ({ ...prev, privateKey: e.target.value }))}
                  className="pl-10 pr-10 h-10 border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
                <button
                  type="button"
                  className="absolute right-3 top-3 h-4 w-4 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPrivateKey(!showPrivateKey)}
                >
                  {showPrivateKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <Label htmlFor="network" className="text-sm font-medium">
                Network
              </Label>
              <Select 
                value={walletInfo.network} 
                onValueChange={(value: 'testnet' | 'mainnet') => 
                  setWalletInfo(prev => ({ ...prev, network: value }))
                }
              >
                <SelectTrigger className="mt-1 h-10 border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="testnet">Testnet</SelectItem>
                  <SelectItem value="mainnet">Mainnet</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={isConnecting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConnect}
              disabled={isConnecting}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
            >
              {isConnecting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Connecting...
                </div>
              ) : (
                "Connect Wallet"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
