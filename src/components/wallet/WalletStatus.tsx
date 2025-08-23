import { useState } from "react";
import { Wallet, WifiOff, AlertCircle, ChevronDown, Settings, ExternalLink, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { useWallet } from "@/contexts/WalletContext";

export function WalletStatus() {
  const { walletStatus, isLoading, error, refreshStatus } = useWallet();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshStatus();
    setIsRefreshing(false);
  };

  const getStatusInfo = () => {
    if (isLoading) {
      return {
        text: "Checking...",
        color: "bg-gray-500",
        icon: <Wallet className="h-4 w-4" />,
        isConnected: false
      };
    }

    if (error) {
      return {
        text: "Error",
        color: "bg-red-500",
        icon: <AlertCircle className="h-4 w-4" />,
        isConnected: false
      };
    }

    if (!walletStatus.isConfigured) {
      return {
        text: "Disconnected",
        color: "bg-red-500",
        icon: <WifiOff className="h-4 w-4" />,
        isConnected: false
      };
    }

    return {
      text: "Connected",
      color: "bg-green-500",
      icon: <Wallet className="h-4 w-4" />,
      isConnected: true
    };
  };

  const statusInfo = getStatusInfo();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-2 h-2 rounded-full animate-pulse",
              statusInfo.color
            )} />
            {statusInfo.icon}
            <span className="text-sm font-medium text-gray-700">
              {statusInfo.text}
            </span>
            <ChevronDown className="h-3 w-3 text-gray-500" />
          </div>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-900">Wallet Status</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className={cn(
                "h-4 w-4",
                isRefreshing && "animate-spin"
              )} />
            </Button>
          </div>
          
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-3 h-3 rounded-full",
              statusInfo.color,
              statusInfo.isConnected && "animate-pulse"
            )} />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                {statusInfo.isConnected ? 'Connected' : 'Disconnected'}
              </p>
              {statusInfo.isConnected && walletStatus.accountId && (
                <p className="text-xs text-gray-500 font-mono">
                  {walletStatus.accountId}
                </p>
              )}
            </div>
          </div>
          
          {statusInfo.isConnected && (
            <div className="mt-3 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Network:</span>
                <span className="font-medium text-gray-700 uppercase">
                  {walletStatus.network || 'Unknown'}
                </span>
              </div>
              {walletStatus.configuredAt && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Connected:</span>
                  <span className="font-medium text-gray-700">
                    {new Date(walletStatus.configuredAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="p-2">
          <Link href="/wallet">
            <DropdownMenuItem className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              Wallet Settings
            </DropdownMenuItem>
          </Link>
          
          {statusInfo.isConnected && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="cursor-pointer text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                onClick={() => window.open('https://portal.hedera.com', '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Hedera Portal
              </DropdownMenuItem>
            </>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
