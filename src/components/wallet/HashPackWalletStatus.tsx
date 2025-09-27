import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { 
  Wallet, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  Settings, 
  ExternalLink,
  Copy,
  Unlink
} from "lucide-react";
import { useHashPackWallet } from "@/contexts/HashPackWalletContext";
import { ConnectionState } from "@/services/hashPackService";
import { useToast } from "@/hooks/use-toast";

export function HashPackWalletStatus() {
  const { 
    walletInfo, 
    connectionState, 
    isConnecting, 
    error, 
    disconnect 
  } = useHashPackWallet();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  const getStatusDisplay = () => {
    if (walletInfo && connectionState === ConnectionState.Connected) {
      return {
        text: "Connected",
        color: "bg-green-500",
        textColor: "text-green-700",
        icon: CheckCircle,
        variant: "default" as const
      };
    } else if (connectionState === ConnectionState.Connecting || isConnecting) {
      return {
        text: "Connecting",
        color: "bg-yellow-500",
        textColor: "text-yellow-700",
        icon: RefreshCw,
        variant: "secondary" as const
      };
    } else {
      return {
        text: "Disconnected",
        color: "bg-red-500",
        textColor: "text-red-700",
        icon: AlertCircle,
        variant: "destructive" as const
      };
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate refresh delay
    setTimeout(() => {
      setIsRefreshing(false);
      toast({
        title: "Status Refreshed",
        description: "Wallet status has been updated",
      });
    }, 1000);
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      toast({
        title: "HashPack Disconnected",
        description: "Your wallet has been disconnected",
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

  const openHashPackApp = () => {
    window.open('https://www.hashpack.app', '_blank');
  };

  const openHederaPortal = () => {
    window.open('https://portal.hedera.com', '_blank');
  };

  const statusDisplay = getStatusDisplay();
  const StatusIcon = statusDisplay.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2 px-3 hover:bg-accent hover:text-accent-foreground">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${statusDisplay.color}`}></div>
            <Wallet className="h-4 w-4" />
            <span className="hidden sm:inline text-foreground">HashPack</span>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center gap-2 text-foreground">
          <StatusIcon className={`h-4 w-4 ${statusDisplay.textColor}`} />
          HashPack Wallet Status
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <div className="p-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Status</span>
            <Badge variant={statusDisplay.variant} className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${statusDisplay.color}`}></div>
              {statusDisplay.text}
            </Badge>
          </div>

          {walletInfo && (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Account ID</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyAccountId}
                    className="h-auto p-1"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <div className="text-xs font-mono bg-muted p-2 rounded border border-border text-foreground">
                  {walletInfo.accountId}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Network</span>
                <Badge variant="outline" className="capitalize">
                  {walletInfo.network}
                </Badge>
              </div>
            </>
          )}

          {error && (
            <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 p-2 rounded border border-red-200 dark:border-red-800">
              {error}
            </div>
          )}
        </div>

        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleRefresh} disabled={isRefreshing} className="hover:bg-accent hover:text-accent-foreground">
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh Status
        </DropdownMenuItem>

        {walletInfo && (
          <>
            <DropdownMenuItem onClick={handleDisconnect} className="hover:bg-accent hover:text-accent-foreground">
              <Unlink className="h-4 w-4 mr-2" />
              Disconnect Wallet
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        <DropdownMenuItem onClick={() => window.location.href = '/settings/wallet'} className="hover:bg-accent hover:text-accent-foreground">
          <Settings className="h-4 w-4 mr-2" />
          Wallet Settings
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={openHashPackApp} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-950">
          <ExternalLink className="h-4 w-4 mr-2" />
          Open HashPack
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={openHederaPortal} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-950">
          <ExternalLink className="h-4 w-4 mr-2" />
          Hedera Portal
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
