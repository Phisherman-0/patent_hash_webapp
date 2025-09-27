import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wallet, Shield, Download, ExternalLink, CheckCircle, AlertCircle, RefreshCw, Globe, Link, Unlink, Copy, ArrowRight, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { useHashPackWallet } from "@/contexts/HashPackWalletContext";
import { useHederaWallet } from "@/contexts/HederaWalletContext";
import { HederaWalletConnect } from "@/components/wallet/HederaWalletConnect";
import { ConnectionState } from "@/services/hashPackWalletService";

export default function WalletSettings() {
  const { toast } = useToast();
  const {
    walletInfo,
    connectionState,
    isConnecting,
    error,
    connect,
    disconnect,
    isExtensionAvailable,
    debug
  } = useHashPackWallet();

  const [selectedNetwork, setSelectedNetwork] = useState<'testnet' | 'mainnet'>('testnet');

  const isConnected = connectionState === ConnectionState.Connected && walletInfo?.isConnected && !!walletInfo?.accountId;

  const handleConnect = async () => {
    try {
      console.log(`🔗 Connecting to HashPack on ${selectedNetwork} network...`);
      await connect(selectedNetwork);
      
      toast({
        title: "HashPack Connected",
        description: `Connected to ${walletInfo?.accountId} on ${selectedNetwork}`,
      });
    } catch (error: any) {
      console.error('❌ Connection failed:', error);
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
      toast({
        title: "Wallet Disconnected",
        description: "Your wallet has been disconnected successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Disconnect Failed",
        description: error.message || "Failed to disconnect wallet. Please try again.",
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

  const getConnectionTypeDisplay = () => {
    if (!walletInfo?.sessionData) return 'Unknown';
    
    const connectionType = walletInfo.sessionData.connectionType;
    switch (connectionType) {
      case 'extension':
        return 'Browser Extension';
      case 'web':
        return 'Web Wallet';
      case 'manual':
        return 'Manual Entry';
      default:
        return 'Unknown';
    }
  };

  const getConnectionTypeIcon = () => {
    if (!walletInfo?.sessionData) return <Globe className="h-4 w-4 text-muted-foreground" />;
    
    const connectionType = walletInfo.sessionData.connectionType;
    switch (connectionType) {
      case 'extension':
        return <Shield className="h-4 w-4 text-green-600" />;
      case 'web':
        return <Globe className="h-4 w-4 text-blue-600" />;
      case 'manual':
        return <Settings className="h-4 w-4 text-orange-600" />;
      default:
        return <Globe className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Wallet Settings</h1>
          <p className="text-muted-foreground">
            Manage your HashPack wallet connection and settings
          </p>
        </div>
      </div>

      <Tabs defaultValue="hedera" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="hedera">Hedera Wallet</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="connection">Connection</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="hedera" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Hedera Wallet Connect</CardTitle>
              <CardDescription>
                Connect using the improved Hedera wallet implementation based on the hedera-wallet-template
              </CardDescription>
            </CardHeader>
            <CardContent>
              <HederaWalletConnect />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overview" className="space-y-6">
          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Connection Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Wallet Status Overview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Wallet className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Wallet Status</CardTitle>
                    <CardDescription>Current connection status and details</CardDescription>
                  </div>
                </div>
                <Badge variant={isConnected ? "default" : "secondary"} className="flex items-center space-x-1">
                  {isConnected ? (
                    <>
                      <CheckCircle className="h-3 w-3" />
                      <span>Connected</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-3 w-3" />
                      <span>{connectionState === ConnectionState.Connecting ? "Connecting" : "Disconnected"}</span>
                    </>
                  )}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isConnected && walletInfo ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Account ID</label>
                      <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
                        <code className="flex-1 text-sm">{walletInfo.accountId}</code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(walletInfo.accountId, "Account ID")}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Network</label>
                      <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm capitalize">{walletInfo.network}</span>
                        <Badge variant="outline" className="ml-auto">
                          {walletInfo.network === 'testnet' ? 'Test' : 'Live'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Connection Type</label>
                    <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
                      {getConnectionTypeIcon()}
                      <span className="text-sm">{getConnectionTypeDisplay()}</span>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium">Quick Actions</h4>
                      <p className="text-sm text-muted-foreground">Manage your wallet connection</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={debug}
                      >
                        Debug
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDisconnect}
                      >
                        <Unlink className="h-4 w-4 mr-2" />
                        Disconnect
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 space-y-4">
                  <div className="p-4 bg-muted/50 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                    <Wallet className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">No Wallet Connected</h3>
                    <p className="text-muted-foreground">
                      Connect your HashPack wallet to start using the platform
                    </p>
                  </div>
                  
                  {/* Network Selection */}
                  <div className="max-w-xs mx-auto space-y-2">
                    <label className="text-sm font-medium">Select Network</label>
                    <Select value={selectedNetwork} onValueChange={(value: 'testnet' | 'mainnet') => setSelectedNetwork(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="testnet">Testnet (Recommended)</SelectItem>
                        <SelectItem value="mainnet">Mainnet</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 justify-center mt-4">
                    <Button 
                      onClick={handleConnect}
                      disabled={isConnecting}
                      className="flex items-center"
                    >
                      {isConnecting ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Wallet className="h-4 w-4 mr-2" />
                      )}
                      Connect HashPack
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="connection" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>HashPack Wallet Connection</CardTitle>
              <CardDescription>
                Connect your HashPack wallet to interact with the Hedera network
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Network Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Network</label>
                <Select value={selectedNetwork} onValueChange={(value: 'testnet' | 'mainnet') => setSelectedNetwork(value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="testnet">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">Test</Badge>
                        <span>Testnet (Recommended for testing)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="mainnet">
                      <div className="flex items-center space-x-2">
                        <Badge variant="default">Live</Badge>
                        <span>Mainnet (Real transactions)</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {selectedNetwork === 'testnet' 
                    ? 'Testnet is recommended for development and testing. No real HBAR is used.'
                    : 'Mainnet uses real HBAR. Make sure you understand the implications.'
                  }
                </p>
              </div>

              <Separator />

              {/* Connection Methods */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Connection Methods</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Extension Method */}
                  <Card className="relative">
                    <CardHeader className="pb-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                          <Shield className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">Browser Extension</CardTitle>
                          <CardDescription>Most secure and convenient</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          <span>Most secure</span>
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          <span>Persistent connection</span>
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          <span>Transaction signing</span>
                        </div>
                      </div>
                      <div className="pt-2">
                        {isExtensionAvailable ? (
                          <Badge variant="default" className="w-full justify-center">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Extension Available
                          </Badge>
                        ) : (
                          <div className="space-y-2">
                            <Button variant="outline" className="w-full" asChild>
                              <a href="https://www.hashpack.app/download" target="_blank" rel="noopener noreferrer">
                                <Download className="h-4 w-4 mr-2" />
                                Install Extension
                                <ExternalLink className="h-3 w-3 ml-auto" />
                              </a>
                            </Button>
                            <p className="text-xs text-muted-foreground text-center">
                              Extension not detected
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Web Wallet Method */}
                  <Card className="relative">
                    <CardHeader className="pb-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                          <Globe className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">Web Wallet</CardTitle>
                          <CardDescription>Works on all devices</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                          <CheckCircle className="h-3 w-3 text-blue-600" />
                          <span>No installation required</span>
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                          <CheckCircle className="h-3 w-3 text-blue-600" />
                          <span>Works on mobile</span>
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                          <AlertCircle className="h-3 w-3 text-orange-600" />
                          <span>Requires popup permissions</span>
                        </div>
                      </div>
                      <div className="pt-2">
                        <Badge variant="outline" className="w-full justify-center">
                          <Globe className="h-3 w-3 mr-1" />
                          Always Available
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <Separator />

              {/* Connect Button */}
              <div className="text-center">
                <Button 
                  onClick={handleConnect}
                  disabled={isConnecting || (connectionState === ConnectionState.Connected && !!walletInfo?.accountId)}
                  size="lg"
                  className="w-full max-w-md"
                >
                  {isConnecting ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Connecting to {selectedNetwork}...
                    </>
                  ) : connectionState === ConnectionState.Connected && !!walletInfo?.accountId ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Connected to {walletInfo?.network}
                    </>
                  ) : (
                    <>
                      <Wallet className="h-4 w-4 mr-2" />
                      Connect to {selectedNetwork}
                    </>
                  )}
                </Button>
              </div>

              {isConnected && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>Wallet Connected Successfully</AlertTitle>
                  <AlertDescription>
                    Your HashPack wallet is connected and ready to use. You can now interact with the Hedera network.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>Manage wallet security and permissions</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertTitle>Security Best Practices</AlertTitle>
                <AlertDescription>
                  Always verify transaction details before signing. Never share your private keys or seed phrase.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium">Transaction Signing</h4>
                    <p className="text-sm text-muted-foreground">
                      All transactions require your approval in HashPack
                    </p>
                  </div>
                  <Badge variant="outline">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Enabled
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium">Connection Persistence</h4>
                    <p className="text-sm text-muted-foreground">
                      Your wallet connection is saved securely
                    </p>
                  </div>
                  <Badge variant="outline">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="text-sm font-medium">External Links</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button variant="outline" className="justify-start" asChild>
                    <a href="https://www.hashpack.app/" target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4 mr-2" />
                      Download HashPack
                      <ExternalLink className="h-3 w-3 ml-auto" />
                    </a>
                  </Button>
                  <Button variant="outline" className="justify-start" asChild>
                    <a href="https://portal.hedera.com/" target="_blank" rel="noopener noreferrer">
                      <Globe className="h-4 w-4 mr-2" />
                      Hedera Portal
                      <ExternalLink className="h-3 w-3 ml-auto" />
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}