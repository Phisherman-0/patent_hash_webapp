import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { HashPackWalletConnectionEnhanced } from "@/components/wallet/HashPackWalletConnectionEnhanced";
import { useHashPackWallet } from "@/contexts/HashPackWalletContext";
import { hashPackTroubleshooter } from "@/utils/hashPackTroubleshooter";
import { RefreshCw, Copy, CheckCircle, AlertCircle, Bug } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function HashPackTest() {
  const { walletInfo, connectionState, error, debug } = useHashPackWallet();
  const [testResults, setTestResults] = useState<string>("");
  const [isRunningTests, setIsRunningTests] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Auto-run basic tests on page load
    runBasicTests();
  }, []);

  const runBasicTests = async () => {
    setIsRunningTests(true);
    let results = "HashPack Connection Test Results\n";
    results += "=====================================\n\n";
    results += `Timestamp: ${new Date().toISOString()}\n\n`;

    try {
      // Test 1: Browser Detection
      results += "1. Browser Detection:\n";
      results += `   User Agent: ${navigator.userAgent}\n`;
      results += `   Browser: ${getBrowserName()}\n\n`;

      // Test 2: Extension Detection
      results += "2. Extension Detection:\n";
      const extensionLocations = [
        { name: 'window.hashpack', obj: (window as any).hashpack },
        { name: 'window.HashPack', obj: (window as any).HashPack },
        { name: 'window.hashConnect', obj: (window as any).hashConnect },
        { name: 'window.hedera', obj: (window as any).hedera }
      ];

      extensionLocations.forEach(loc => {
        results += `   ${loc.name}: ${loc.obj ? '✅ Found' : '❌ Not found'}\n`;
        if (loc.obj) {
          const methods = Object.getOwnPropertyNames(loc.obj);
          results += `     Methods: ${methods.join(', ')}\n`;
        }
      });
      results += "\n";

      // Test 3: LocalStorage
      results += "3. LocalStorage Test:\n";
      try {
        const testKey = 'hashpack-test';
        localStorage.setItem(testKey, 'test');
        localStorage.removeItem(testKey);
        results += "   ✅ LocalStorage available\n";
        
        const savedData = localStorage.getItem('hashpack-connection');
        if (savedData) {
          results += "   ✅ Found saved connection data\n";
          try {
            const parsed = JSON.parse(savedData);
            results += `   Account: ${parsed.accountId || 'Unknown'}\n`;
            results += `   Network: ${parsed.network || 'Unknown'}\n`;
          } catch (e) {
            results += "   ⚠️ Saved data is corrupted\n";
          }
        } else {
          results += "   ℹ️ No saved connection data\n";
        }
      } catch (error) {
        results += `   ❌ LocalStorage error: ${error}\n`;
      }
      results += "\n";

      // Test 4: Network Connectivity
      results += "4. Network Connectivity:\n";
      try {
        const testUrls = [
          'https://testnet.mirrornode.hedera.com/api/v1/network/nodes',
          'https://mainnet-public.mirrornode.hedera.com/api/v1/network/nodes'
        ];

        for (const url of testUrls) {
          try {
            const response = await fetch(url, { 
              method: 'HEAD',
              mode: 'no-cors',
              signal: AbortSignal.timeout(5000)
            });
            results += `   ✅ ${url.includes('testnet') ? 'Testnet' : 'Mainnet'} reachable\n`;
          } catch (error) {
            results += `   ⚠️ ${url.includes('testnet') ? 'Testnet' : 'Mainnet'} connection issue\n`;
          }
        }
      } catch (error) {
        results += `   ❌ Network test failed: ${error}\n`;
      }
      results += "\n";

      // Test 5: Current State
      results += "5. Current Application State:\n";
      results += `   Connection State: ${connectionState}\n`;
      results += `   Wallet Info: ${walletInfo ? 'Available' : 'None'}\n`;
      if (walletInfo) {
        results += `   Account ID: ${walletInfo.accountId}\n`;
        results += `   Network: ${walletInfo.network}\n`;
      }
      results += `   Error: ${error || 'None'}\n\n`;

      // Test 6: Extension Method Test
      results += "6. Extension Method Test:\n";
      const extension = (window as any).hashpack || (window as any).HashPack;
      if (extension) {
        const testMethods = [
          'requestAccountInfo',
          'connect',
          'getAccountInfo',
          'request',
          'enable'
        ];

        for (const method of testMethods) {
          if (typeof extension[method] === 'function') {
            results += `   ✅ ${method} method available\n`;
          } else {
            results += `   ❌ ${method} method not available\n`;
          }
        }
      } else {
        results += "   ❌ No extension found for method testing\n";
      }
      results += "\n";

      results += "Test completed successfully!\n";
      
    } catch (error) {
      results += `\nTest failed with error: ${error}\n`;
    }

    setTestResults(results);
    setIsRunningTests(false);
  };

  const runDiagnostics = async () => {
    setIsRunningTests(true);
    try {
      const diagnosticResults = await hashPackTroubleshooter.runDiagnostics();
      const report = hashPackTroubleshooter.generateReport();
      setTestResults(report);
      
      toast({
        title: "Diagnostics Complete",
        description: `Found ${diagnosticResults.filter(r => r.status === 'fail').length} issues`,
      });
    } catch (error) {
      toast({
        title: "Diagnostics Failed",
        description: "Unable to run diagnostics",
        variant: "destructive",
      });
    } finally {
      setIsRunningTests(false);
    }
  };

  const copyResults = () => {
    navigator.clipboard.writeText(testResults);
    toast({
      title: "Copied",
      description: "Test results copied to clipboard",
    });
  };

  const clearSavedData = () => {
    localStorage.removeItem('hashpack-connection');
    toast({
      title: "Cleared",
      description: "Saved connection data cleared",
    });
    runBasicTests();
  };

  const getBrowserName = () => {
    const userAgent = navigator.userAgent;
    if (/Chrome/.test(userAgent) && /Google Inc/.test(navigator.vendor)) return 'Chrome';
    if (/Firefox/.test(userAgent)) return 'Firefox';
    if (/Edg/.test(userAgent)) return 'Edge';
    if (/Safari/.test(userAgent) && !/Chrome/.test(userAgent)) return 'Safari';
    return 'Unknown';
  };

  const getStatusIcon = () => {
    if (walletInfo) return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (error) return <AlertCircle className="h-5 w-5 text-red-600" />;
    return <RefreshCw className="h-5 w-5 text-yellow-600" />;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">HashPack Connection Test</h1>
        <p className="text-muted-foreground mt-2">
          Comprehensive testing and debugging for HashPack wallet connection
        </p>
      </div>

      {/* Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon()}
            Connection Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">State</label>
              <div className="text-lg font-semibold">{connectionState}</div>
            </div>
            <div>
              <label className="text-sm font-medium">Account</label>
              <div className="text-lg font-semibold font-mono">
                {walletInfo?.accountId || 'Not connected'}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Network</label>
              <div className="text-lg font-semibold capitalize">
                {walletInfo?.network || 'None'}
              </div>
            </div>
          </div>
          
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Connection Component */}
      <HashPackWalletConnectionEnhanced />

      {/* Test Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Test Controls</CardTitle>
          <CardDescription>
            Run various tests to diagnose HashPack connection issues
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={runBasicTests}
              disabled={isRunningTests}
              variant="outline"
            >
              {isRunningTests ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Run Basic Tests
            </Button>
            
            <Button
              onClick={runDiagnostics}
              disabled={isRunningTests}
              variant="outline"
            >
              <Bug className="h-4 w-4 mr-2" />
              Run Full Diagnostics
            </Button>
            
            <Button
              onClick={debug}
              variant="outline"
            >
              <Bug className="h-4 w-4 mr-2" />
              Debug to Console
            </Button>
            
            <Button
              onClick={clearSavedData}
              variant="outline"
            >
              Clear Saved Data
            </Button>
            
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
            >
              Reload Page
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Test Results
            <Button
              onClick={copyResults}
              variant="outline"
              size="sm"
              disabled={!testResults}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Results
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={testResults}
            readOnly
            className="min-h-[400px] font-mono text-sm"
            placeholder="Test results will appear here..."
          />
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={() => window.open('https://www.hashpack.app/download', '_blank')}
              variant="outline"
              className="justify-start"
            >
              Download HashPack Extension
            </Button>
            
            <Button
              onClick={() => window.open('chrome://extensions/', '_blank')}
              variant="outline"
              className="justify-start"
            >
              Manage Browser Extensions
            </Button>
            
            <Button
              onClick={() => window.open('https://portal.hedera.com', '_blank')}
              variant="outline"
              className="justify-start"
            >
              Hedera Network Portal
            </Button>
            
            <Button
              onClick={() => window.open('https://docs.hashpack.app/', '_blank')}
              variant="outline"
              className="justify-start"
            >
              HashPack Documentation
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}