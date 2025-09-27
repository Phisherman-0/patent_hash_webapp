import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Wallet, CheckCircle, AlertCircle, Unlink, ExternalLink, Copy, RefreshCw, Settings, ChevronDown, Bug, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useHashPackWallet } from "@/contexts/HashPackWalletContext";
import { ConnectionState } from "@/services/hashPackService";
import { hashPackTroubleshooter, type DiagnosticResult } from "@/utils/hashPackTroubleshooter";

interface HashPackWalletConnectionEnhancedProps {
  onWalletConnect?: (walletInfo: any) => void;
  onWalletDisconnect?: () => void;
}

export function HashPackWalletConnectionEnhanced({ onWalletConnect, onWalletDisconnect }: HashPackWalletConnectionEnhancedProps) {
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
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);
  const [diagnosticResults, setDiagnosticResults] = useState<DiagnosticResult[]>([]);
  const [isRunningDiagnostics, setIsRunningDiagnostics] = useState(false);
  const [isAutoFixing, setIsAutoFixing] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const { toast } = useToast();

  // Auto-run diagnostics if there's an error
  useEffect(() => {
    if (error && !isRunningDiagnostics && diagnosticResults.length === 0) {
      runDiagnostics();
    }
  }, [error]);

  // Reset connection attempts on successful connection
  useEffect(() => {
    if (connectionState === ConnectionState.Connected) {
      setConnectionAttempts(0);
    }
  }, [connectionState]);

  const handleConnect = async () => {
    try {
      setConnectionAttempts(prev => prev + 1);
      
      // If multiple failed attempts, suggest troubleshooting
      if (connectionAttempts >= 2) {
        setShowTroubleshooting(true);
        await runDiagnostics();
      }

      await connect(selectedNetwork);
      if (walletInfo) {
        onWalletConnect?.(walletInfo);
        toast({
          title: "HashPack Connected",
          description: `Successfully connected to HashPack on ${selectedNetwork}`,
        });
      }
    } catch (error: any) {
      console.error('Connection failed:', error);
      toast({
        title: "Connection Failed",
        description: error.message || 'Failed to connect to HashPack',
        variant: "destructive",
      });
      
      // Auto-show troubleshooting after failed attempts
      if (connectionAttempts >= 1) {
        setShowTroubleshooting(true);
        await runDiagnostics();
      }
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

  const runDiagnostics = async () => {
    setIsRunningDiagnostics(true);
    try {
      const results = await hashPackTroubleshooter.runDiagnostics();
      setDiagnosticResults(results);
      
      const failCount = results.filter(r => r.status === 'fail').length;
      const warningCount = results.filter(r => r.status === 'warning').length;
      
      if (failCount > 0) {
        toast({
          title: "Issues Detected",
          description: `Found ${failCount} critical issues and ${warningCount} warnings`,
          variant: "destructive",
        });
      } else if (warningCount > 0) {
        toast({
          title: "Warnings Found",
          description: `Found ${warningCount} potential issues`,
        });
      } else {
        toast({
          title: "Diagnostics Complete",
          description: "No issues detected",
        });
      }
    } catch (error) {
      console.error('Diagnostics failed:', error);
      toast({
        title: "Diagnostics Failed",
        description: "Unable to run diagnostics",
        variant: "destructive",
      });
    } finally {
      setIsRunningDiagnostics(false);
    }
  };

  const runAutoFix = async () => {
    setIsAutoFixing(true);
    try {
      await hashPackTroubleshooter.autoFix();
      toast({
        title: "Auto-fix Complete",
        description: "Attempted to fix common issues. Try connecting again.",
      });
      
      // Re-run diagnostics to see if issues were resolved
      await runDiagnostics();
    } catch (error) {
      console.error('Auto-fix failed:', error);
      toast({
        title: "Auto-fix Failed",
        description: "Unable to automatically fix issues",
        variant: "destructive",
      });
    } finally {
      setIsAutoFixing(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: `${label} copied to clipboard`,
    });
  };

  const copyDiagnosticReport = () => {
    const report = hashPackTroubleshooter.generateReport();
    copyToClipboard(report, "Diagnostic report");
  };

  const getConnectionStateDisplay = () => {
    switch (connectionState) {
      case ConnectionState.Connected:
        return { text: "Connected", color: "bg-green-500", icon: CheckCircle };
      case ConnectionState.Connecting:
        return { text: "Connecting", color: "bg-yellow-500", icon: RefreshCw };
      case ConnectionState.Disconnected:
        return { text: "Disconnected", color: "bg-gray-500", icon: AlertCircle };
      default:
        return { text: "Unknown", color: "bg-gray-500", icon: AlertCircle };
    }
  };

  const getDiagnosticIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'pass': return '✅';
      case 'warning': return '⚠️';
      case 'fail': return '❌';
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
              onClick={() => window.open('https://portal.hedera.com', '_blank')}
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
          {connectionAttempts > 0 && (
            <Badge variant="outline" className="text-xs">
              Attempt {connectionAttempts}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Connect your HashPack wallet to enable secure blockchain transactions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <div>{error}</div>
                {connectionAttempts >= 2 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowTroubleshooting(true)}
                    className="mt-2"
                  >
                    <Bug className="h-4 w-4 mr-2" />
                    Show Troubleshooting
                  </Button>
                )}
              </div>
            </AlertDescription>
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

        {/* Troubleshooting Section */}
        <Collapsible open={showTroubleshooting} onOpenChange={setShowTroubleshooting}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              <span className="flex items-center gap-2">
                <Bug className="h-4 w-4" />
                Troubleshooting & Diagnostics
              </span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 mt-4">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={runDiagnostics}
                disabled={isRunningDiagnostics}
                className="flex-1"
              >
                {isRunningDiagnostics ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Running Diagnostics...
                  </>
                ) : (
                  <>
                    <Bug className="h-4 w-4 mr-2" />
                    Run Diagnostics
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                onClick={runAutoFix}
                disabled={isAutoFixing}
                className="flex-1"
              >
                {isAutoFixing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Auto-fixing...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Auto-fix Issues
                  </>
                )}
              </Button>
            </div>

            {diagnosticResults.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm">Diagnostic Results</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyDiagnosticReport}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Report
                  </Button>
                </div>
                
                <div className="max-h-60 overflow-y-auto space-y-2 border rounded-md p-3">
                  {diagnosticResults.map((result, index) => (
                    <div key={index} className="text-sm">
                      <div className="flex items-start gap-2">
                        <span className="text-lg leading-none">{getDiagnosticIcon(result.status)}</span>
                        <div className="flex-1">
                          <div className="font-medium">{result.category}</div>
                          <div className="text-muted-foreground">{result.message}</div>
                          {result.solution && (
                            <div className="text-blue-600 dark:text-blue-400 mt-1">
                              ��� {result.solution}
                            </div>
                          )}
                          {result.action && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={result.action}
                              className="mt-1 h-auto p-1 text-xs"
                            >
                              Apply Fix
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">Common Solutions:</h4>
              <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
                <li>• Ensure HashPack extension is installed and enabled</li>
                <li>• Try refreshing the page and connecting again</li>
                <li>• Check if HashPack is unlocked in your browser</li>
                <li>• Disable other wallet extensions temporarily</li>
                <li>• Clear browser cache and cookies</li>
                <li>• Try connecting in an incognito/private window</li>
              </ul>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Debug Section */}
        <Collapsible open={showDebugInfo} onOpenChange={setShowDebugInfo}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between text-xs">
              <span className="flex items-center gap-2">
                <Settings className="h-3 w-3" />
                Debug Information
              </span>
              <ChevronDown className="h-3 w-3" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-md">
            <div className="text-xs space-y-1">
              <div><strong>Initialized:</strong> {isInitialized ? "Yes" : "No"}</div>
              <div><strong>Extension Available:</strong> {isExtensionAvailable ? "Yes" : "No"}</div>
              <div><strong>Connection State:</strong> {connectionState}</div>
              <div><strong>Is Connecting:</strong> {isConnecting ? "Yes" : "No"}</div>
              <div><strong>Connection Attempts:</strong> {connectionAttempts}</div>
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
          </CollapsibleContent>
        </Collapsible>

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