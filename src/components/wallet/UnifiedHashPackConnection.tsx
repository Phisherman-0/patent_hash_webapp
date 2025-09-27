import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Wallet, 
  Smartphone, 
  Monitor, 
  Zap, 
  Info,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { HashPackWalletConnectionEnhanced } from "./HashPackWalletConnectionEnhanced";
import { WalletConnectHashPackConnection } from "./WalletConnectHashPackConnection";
import { useHashPackWallet } from "@/contexts/HashPackWalletContext";
import { useWalletConnectHashPack } from "@/contexts/WalletConnectHashPackContext";

interface UnifiedHashPackConnectionProps {
  onWalletConnect?: (walletInfo: any, connectionType: 'extension' | 'walletconnect') => void;
  onWalletDisconnect?: () => void;
}

export function UnifiedHashPackConnection({ onWalletConnect, onWalletDisconnect }: UnifiedHashPackConnectionProps) {
  const [activeTab, setActiveTab] = useState<'extension' | 'walletconnect'>('extension');
  
  // Extension connection state
  const extensionWallet = useHashPackWallet();
  
  // WalletConnect connection state
  const walletConnectWallet = useWalletConnectHashPack();

  const handleExtensionConnect = (walletInfo: any) => {
    onWalletConnect?.(walletInfo, 'extension');
  };

  const handleWalletConnectConnect = (walletInfo: any) => {
    onWalletConnect?.(walletInfo, 'walletconnect');
  };

  const getConnectionStatus = () => {
    const extensionConnected = extensionWallet.walletInfo && extensionWallet.connectionState === 'Connected';
    const walletConnectConnected = walletConnectWallet.walletInfo && walletConnectWallet.connectionState === 'Connected';
    
    if (extensionConnected && walletConnectConnected) {
      return { status: 'both', message: 'Both extension and WalletConnect are connected' };
    } else if (extensionConnected) {
      return { status: 'extension', message: 'Connected via browser extension' };
    } else if (walletConnectConnected) {
      return { status: 'walletconnect', message: 'Connected via WalletConnect' };
    } else {
      return { status: 'none', message: 'No wallet connected' };
    }
  };

  const connectionStatus = getConnectionStatus();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          HashPack Wallet Connection
          {connectionStatus.status !== 'none' && (
            <Badge variant="outline" className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-600" />
              Connected
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Choose your preferred method to connect your HashPack wallet
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Status */}
        {connectionStatus.status !== 'none' && (
          <Alert className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              <strong>Status:</strong> {connectionStatus.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Connection Methods */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'extension' | 'walletconnect')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="extension" className="flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              Browser Extension
            </TabsTrigger>
            <TabsTrigger value="walletconnect" className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              WalletConnect
            </TabsTrigger>
          </TabsList>

          <TabsContent value="extension" className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
              <Monitor className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900 dark:text-blue-100">Browser Extension Method</h4>
                <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                  Connect directly through the HashPack browser extension. Best for desktop users with the extension installed.
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="outline" className="text-xs">Fast Connection</Badge>
                  <Badge variant="outline" className="text-xs">Desktop Optimized</Badge>
                  <Badge variant="outline" className="text-xs">Direct Access</Badge>
                </div>
              </div>
            </div>

            <HashPackWalletConnectionEnhanced 
              onWalletConnect={handleExtensionConnect}
              onWalletDisconnect={onWalletDisconnect}
            />
          </TabsContent>

          <TabsContent value="walletconnect" className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
              <Smartphone className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
              <div>
                <h4 className="font-semibold text-green-900 dark:text-green-100">WalletConnect Method</h4>
                <p className="text-sm text-green-800 dark:text-green-200 mt-1">
                  Connect via WalletConnect protocol using QR code or web wallet. Perfect for mobile users and web wallet access.
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="outline" className="text-xs">Mobile Friendly</Badge>
                  <Badge variant="outline" className="text-xs">QR Code</Badge>
                  <Badge variant="outline" className="text-xs">Web Wallet</Badge>
                </div>
              </div>
            </div>

            <WalletConnectHashPackConnection 
              onWalletConnect={handleWalletConnectConnect}
              onWalletDisconnect={onWalletDisconnect}
            />
          </TabsContent>
        </Tabs>

        {/* Method Comparison */}
        <div className="border-t pt-4">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Info className="h-4 w-4" />
            Connection Method Comparison
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h5 className="font-medium flex items-center gap-2">
                <Monitor className="h-4 w-4 text-blue-600" />
                Browser Extension
              </h5>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>✅ Fastest connection</li>
                <li>✅ Direct browser integration</li>
                <li>✅ No QR code needed</li>
                <li>❌ Requires extension installation</li>
                <li>❌ Desktop/laptop only</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h5 className="font-medium flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-green-600" />
                WalletConnect
              </h5>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>✅ Works on mobile devices</li>
                <li>✅ No extension required</li>
                <li>✅ QR code scanning</li>
                <li>✅ Web wallet support</li>
                <li>❌ Slightly slower connection</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <Alert>
          <Zap className="h-4 w-4" />
          <AlertDescription>
            <strong>Recommendation:</strong> Use the <strong>Browser Extension</strong> method if you have HashPack extension installed for the fastest experience. 
            Use <strong>WalletConnect</strong> for mobile devices or if you prefer using the web wallet at wallet.hashpack.app.
          </AlertDescription>
        </Alert>

        {/* Help Links */}
        <div className="flex flex-wrap gap-2 pt-2 text-xs text-muted-foreground">
          <a 
            href="https://www.hashpack.app/download" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            Download HashPack Extension
          </a>
          <span>•</span>
          <a 
            href="https://wallet.hashpack.app" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            HashPack Web Wallet
          </a>
          <span>•</span>
          <a 
            href="https://docs.hashpack.app/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            HashPack Documentation
          </a>
        </div>
      </CardContent>
    </Card>
  );
}