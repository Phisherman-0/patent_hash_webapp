import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Bug, CheckCircle, AlertCircle, RefreshCw, Copy, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useHashPackWallet } from "@/contexts/HashPackWalletContext";
import { hashPackService } from "@/services/hashPackService";

interface DebugInfo {
  userAgent: string;
  isExtensionInstalled: boolean;
  hashConnectVersion: string;
  availableExtensions: any[];
  savedPairings: any[];
  windowHashConnect: boolean;
  windowHashPack: boolean;
  localStorageKeys: string[];
  sessionStorageKeys: string[];
}

export function HashPackDebugger() {
  const { 
    walletInfo, 
    connectionState, 
    isConnecting, 
    error, 
    isInitialized,
    isExtensionAvailable,
    debug
  } = useHashPackWallet();
  
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  const collectDebugInfo = async (): Promise<DebugInfo> => {
    const info: DebugInfo = {
      userAgent: navigator.userAgent,
      isExtensionInstalled: false,
      hashConnectVersion: '',
      availableExtensions: [],
      savedPairings: [],
      windowHashConnect: false,
      windowHashPack: false,
      localStorageKeys: [],
      sessionStorageKeys: []
    };

    // Check for HashConnect in window
    info.windowHashConnect = !!(window as any).HashConnect;
    info.windowHashPack = !!(window as any).hashpack;

    // Get HashConnect version
    try {
      const { HashConnect } = await import('hashconnect');
      info.hashConnectVersion = '3.0.13'; // From package.json
    } catch (error) {
      console.error('Failed to import HashConnect:', error);
    }

    // Check for available extensions
    try {
      info.availableExtensions = hashPackService.getAvailableExtensions();
      info.isExtensionInstalled = info.availableExtensions.some(
        ext => ext.name.toLowerCase().includes('hashpack')
      );
    } catch (error) {
      console.error('Failed to get available extensions:', error);
    }

    // Get saved pairings (if accessible)
    try {
      // This might not be accessible depending on HashConnect implementation
      info.savedPairings = [];
    } catch (error) {
      console.error('Failed to get saved pairings:', error);
    }

    // Check localStorage keys
    try {
      info.localStorageKeys = Object.keys(localStorage).filter(key => 
        key.includes('hashconnect') || key.includes('hashpack')
      );
    } catch (error) {
      console.error('Failed to access localStorage:', error);
    }

    // Check sessionStorage keys
    try {
      info.sessionStorageKeys = Object.keys(sessionStorage).filter(key => 
        key.includes('hashconnect') || key.includes('hashpack')
      );
    } catch (error) {
      console.error('Failed to access sessionStorage:', error);
    }

    return info;
  };

  const refreshDebugInfo = async () => {
    setIsRefreshing(true);
    try {
      const info = await collectDebugInfo();
      setDebugInfo(info);
      debug(); // Also call the service debug method
    } catch (error) {
      console.error('Failed to collect debug info:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    refreshDebugInfo();
  }, []);

  const copyDebugInfo = () => {
    const debugData = {
      timestamp: new Date().toISOString(),
      walletInfo,
      connectionState,
      isConnecting,
      error,
      isInitialized,
      isExtensionAvailable,
      debugInfo,
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    navigator.clipboard.writeText(JSON.stringify(debugData, null, 2));
    toast({
      title: "Debug Info Copied",
      description: "Debug information has been copied to clipboard",
    });
  };

  const clearStorageData = () => {
    try {
      // Clear HashConnect related data
      Object.keys(localStorage).forEach(key => {
        if (key.includes('hashconnect') || key.includes('hashpack')) {
          localStorage.removeItem(key);
        }
      });
      
      Object.keys(sessionStorage).forEach(key => {
        if (key.includes('hashconnect') || key.includes('hashpack')) {
          sessionStorage.removeItem(key);
        }
      });

      toast({
        title: "Storage Cleared",
        description: "HashConnect storage data has been cleared",
      });

      // Refresh debug info
      refreshDebugInfo();
    } catch (error) {
      toast({
        title: "Clear Failed",
        description: "Failed to clear storage data",
        variant: "destructive",
      });
    }
  };

  const testExtensionDetection = () => {
    console.log('🔍 Testing extension detection...');
    
    // Check various ways extensions might be detected
    const checks = {
      'window.hashpack': !!(window as any).hashpack,
      'window.HashConnect': !!(window as any).HashConnect,
      'document.querySelector hashpack': !!document.querySelector('[data-hashpack]'),
      'navigator.userAgent includes': navigator.userAgent.toLowerCase().includes('hashpack'),
    };

    console.log('Extension detection checks:', checks);
    
    // Try to detect HashPack extension events
    window.addEventListener('hashpack-loaded', () => {
      console.log('✅ HashPack loaded event detected');
    });

    // Dispatch a test event to see if extension responds
    window.dispatchEvent(new CustomEvent('hashpack-test', { detail: { test: true } }));

    toast({
      title: "Extension Test",
      description: "Check console for extension detection results",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug className="h-5 w-5" />
          HashPack Connection Debugger
        </CardTitle>
        <CardDescription>
          Diagnostic tools to troubleshoot HashPack connection issues
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Status */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Connection State</label>
            <Badge variant={connectionState === 'Connected' ? 'default' : 'secondary'}>
              {connectionState}
            </Badge>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Extension Available</label>
            <Badge variant={isExtensionAvailable ? 'default' : 'destructive'}>
              {isExtensionAvailable ? 'Yes' : 'No'}
            </Badge>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Current Error:</strong> {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Debug Actions */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshDebugInfo}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh Info
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={copyDebugInfo}
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy Debug Info
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={testExtensionDetection}
          >
            <Bug className="h-4 w-4 mr-2" />
            Test Extension
          </Button>
          
          <Button
            variant="destructive"
            size="sm"
            onClick={clearStorageData}
          >
            Clear Storage
          </Button>
        </div>

        {/* Debug Information */}
        {debugInfo && (
          <div className="space-y-4">
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">System Information</h4>
              <div className="text-sm space-y-1 bg-gray-50 dark:bg-gray-900 p-3 rounded">
                <div><strong>Browser:</strong> {debugInfo.userAgent.split(' ').slice(-2).join(' ')}</div>
                <div><strong>HashConnect Version:</strong> {debugInfo.hashConnectVersion}</div>
                <div><strong>Extension Installed:</strong> {debugInfo.isExtensionInstalled ? 'Yes' : 'No'}</div>
                <div><strong>Available Extensions:</strong> {debugInfo.availableExtensions.length}</div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Window Objects</h4>
              <div className="text-sm space-y-1 bg-gray-50 dark:bg-gray-900 p-3 rounded">
                <div><strong>window.HashConnect:</strong> {debugInfo.windowHashConnect ? 'Present' : 'Missing'}</div>
                <div><strong>window.hashpack:</strong> {debugInfo.windowHashPack ? 'Present' : 'Missing'}</div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Storage Data</h4>
              <div className="text-sm space-y-1 bg-gray-50 dark:bg-gray-900 p-3 rounded">
                <div><strong>localStorage keys:</strong> {debugInfo.localStorageKeys.length > 0 ? debugInfo.localStorageKeys.join(', ') : 'None'}</div>
                <div><strong>sessionStorage keys:</strong> {debugInfo.sessionStorageKeys.length > 0 ? debugInfo.sessionStorageKeys.join(', ') : 'None'}</div>
              </div>
            </div>

            {debugInfo.availableExtensions.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Available Extensions</h4>
                <div className="space-y-2">
                  {debugInfo.availableExtensions.map((ext, index) => (
                    <div key={index} className="text-sm bg-gray-50 dark:bg-gray-900 p-3 rounded">
                      <div><strong>Name:</strong> {ext.name}</div>
                      <div><strong>Description:</strong> {ext.description}</div>
                      <div><strong>Icon:</strong> {ext.icon}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Troubleshooting Guide */}
        <div className="border-t pt-4">
          <h4 className="font-semibold mb-2">Troubleshooting Steps</h4>
          <div className="space-y-2 text-sm">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Step 1:</strong> Ensure HashPack extension is installed and enabled in your browser
              </AlertDescription>
            </Alert>
            
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Step 2:</strong> Refresh the page and check if extension is detected
              </AlertDescription>
            </Alert>
            
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Step 3:</strong> Clear browser storage data and try reconnecting
              </AlertDescription>
            </Alert>
            
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Step 4:</strong> If extension fails, try web wallet connection
              </AlertDescription>
            </Alert>
          </div>
        </div>

        {/* Useful Links */}
        <div className="border-t pt-4">
          <h4 className="font-semibold mb-2">Useful Links</h4>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('https://www.hashpack.app/download', '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Download HashPack
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('https://docs.hashpack.app/', '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              HashPack Docs
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('https://github.com/Hashpack/hashconnect', '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              HashConnect GitHub
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}