import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Wallet, Globe } from 'lucide-react';

export function DirectHashPackTest() {
  const [testResults, setTestResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runDirectTest = async () => {
    setIsLoading(true);
    const results: any = {
      timestamp: new Date().toISOString(),
      extensionDetected: false,
      extensionMethods: [],
      directConnectionTest: false,
      webWalletTest: false,
      error: null
    };

    try {
      // Test 1: Check for HashPack extension
      console.log('🧪 Testing HashPack extension detection...');
      results.extensionDetected = !!(window as any).hashpack;
      
      if (results.extensionDetected) {
        console.log('✅ HashPack extension detected');
        const hashpack = (window as any).hashpack;
        results.extensionMethods = Object.getOwnPropertyNames(hashpack).filter(
          prop => typeof hashpack[prop] === 'function'
        );
        console.log('📋 Available methods:', results.extensionMethods);
      } else {
        console.log('❌ HashPack extension not detected');
      }

      // Test 2: Test direct connection (if extension available)
      if (results.extensionDetected) {
        console.log('🧪 Testing direct extension connection...');
        try {
          const hashpack = (window as any).hashpack;
          
          // Try different connection methods
          let connectionResult = null;
          
          if (hashpack.requestAccountInfo) {
            console.log('📞 Trying requestAccountInfo...');
            connectionResult = await hashpack.requestAccountInfo({ network: 'testnet' });
          } else if (hashpack.connect) {
            console.log('📞 Trying connect...');
            connectionResult = await hashpack.connect({ network: 'testnet' });
          } else if (hashpack.getAccountInfo) {
            console.log('📞 Trying getAccountInfo...');
            connectionResult = await hashpack.getAccountInfo();
          }
          
          if (connectionResult) {
            results.directConnectionTest = true;
            results.connectionResult = connectionResult;
            console.log('✅ Direct connection test successful:', connectionResult);
          }
        } catch (error: any) {
          console.log('❌ Direct connection test failed:', error.message);
          results.directConnectionError = error.message;
        }
      }

      // Test 3: Test web wallet URL generation
      console.log('🧪 Testing web wallet URL generation...');
      const sessionId = 'test-' + Math.random().toString(36).substring(2, 15);
      const walletUrl = `https://wallet.hashpack.app/connect?` +
        `network=testnet` +
        `&dAppName=${encodeURIComponent('Patent Hash Test')}` +
        `&dAppDescription=${encodeURIComponent('Test application')}` +
        `&dAppIcon=${encodeURIComponent(window.location.origin + '/favicon.ico')}` +
        `&dAppUrl=${encodeURIComponent(window.location.origin)}` +
        `&sessionId=${sessionId}`;
      
      results.webWalletTest = true;
      results.webWalletUrl = walletUrl;
      console.log('✅ Web wallet URL generated:', walletUrl);

    } catch (error: any) {
      results.error = error.message;
      console.error('❌ Direct test failed:', error);
    }

    setTestResults(results);
    setIsLoading(false);
  };

  const testWebWallet = () => {
    if (testResults?.webWalletUrl) {
      console.log('🌐 Opening test web wallet...');
      window.open(testResults.webWalletUrl, 'hashpack-test', 'width=420,height=700');
    }
  };

  useEffect(() => {
    // Auto-run test on component mount
    runDirectTest();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Direct HashPack Integration Test</CardTitle>
        <CardDescription>
          Testing direct HashPack integration without HashConnect library
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={runDirectTest} 
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? 'Running Test...' : 'Run Direct Test'}
          </Button>
          
          {testResults?.webWalletUrl && (
            <Button 
              variant="outline"
              onClick={testWebWallet}
              className="flex items-center gap-2"
            >
              <Globe className="h-4 w-4" />
              Test Web Wallet
            </Button>
          )}
        </div>

        {testResults && (
          <div className="space-y-4">
            {/* Test Results Summary */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Extension Detected</label>
                <Badge variant={testResults.extensionDetected ? 'default' : 'destructive'}>
                  {testResults.extensionDetected ? (
                    <>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Detected
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Not Found
                    </>
                  )}
                </Badge>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Direct Connection</label>
                <Badge variant={testResults.directConnectionTest ? 'default' : 'secondary'}>
                  {testResults.directConnectionTest ? (
                    <>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Success
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Not Tested
                    </>
                  )}
                </Badge>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Web Wallet URL</label>
                <Badge variant={testResults.webWalletTest ? 'default' : 'destructive'}>
                  {testResults.webWalletTest ? (
                    <>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Generated
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Failed
                    </>
                  )}
                </Badge>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Available Methods</label>
                <Badge variant="outline">
                  {testResults.extensionMethods?.length || 0} methods
                </Badge>
              </div>
            </div>

            {/* Error Display */}
            {testResults.error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Error:</strong> {testResults.error}
                </AlertDescription>
              </Alert>
            )}

            {/* Connection Result */}
            {testResults.connectionResult && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Connection Result:</strong> Account {testResults.connectionResult.accountId} on {testResults.connectionResult.network}
                </AlertDescription>
              </Alert>
            )}

            {/* Direct Connection Error */}
            {testResults.directConnectionError && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Connection Error:</strong> {testResults.directConnectionError}
                </AlertDescription>
              </Alert>
            )}

            {/* Extension Methods */}
            {testResults.extensionMethods && testResults.extensionMethods.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Extension Methods</label>
                <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {testResults.extensionMethods.map((method: string) => (
                      <div key={method} className="font-mono">
                        {method}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Web Wallet URL */}
            {testResults.webWalletUrl && (
              <details className="space-y-2">
                <summary className="text-sm font-medium cursor-pointer">
                  Web Wallet URL
                </summary>
                <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md">
                  <code className="text-xs break-all">
                    {testResults.webWalletUrl}
                  </code>
                </div>
              </details>
            )}

            {/* Instructions */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Next Steps</label>
              <div className="text-sm space-y-1">
                {!testResults.extensionDetected && (
                  <div className="flex items-center gap-2 text-orange-600">
                    <AlertCircle className="h-4 w-4" />
                    <span>Install HashPack browser extension for best experience</span>
                  </div>
                )}
                {testResults.webWalletTest && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span>Web wallet fallback is available</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-blue-600">
                  <Wallet className="h-4 w-4" />
                  <span>Direct integration bypasses HashConnect library issues</span>
                </div>
              </div>
            </div>

            {/* Raw Results */}
            <details className="space-y-2">
              <summary className="text-sm font-medium cursor-pointer">
                Raw Test Results
              </summary>
              <pre className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md text-xs overflow-auto">
                {JSON.stringify(testResults, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </CardContent>
    </Card>
  );
}