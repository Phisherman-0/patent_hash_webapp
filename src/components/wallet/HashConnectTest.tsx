import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function HashConnectTest() {
  const [testResults, setTestResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runHashConnectTest = async () => {
    setIsLoading(true);
    const results: any = {
      timestamp: new Date().toISOString(),
      importSuccess: false,
      instanceCreated: false,
      initSuccess: false,
      error: null,
      properties: [],
      methods: []
    };

    try {
      // Test 1: Import HashConnect
      console.log('🧪 Testing HashConnect import...');
      const hashConnectModule = await import('hashconnect');
      results.importSuccess = true;
      console.log('✅ HashConnect import successful');

      // Test 2: Create instance
      console.log('🧪 Testing HashConnect instance creation...');
      const HashConnect = hashConnectModule.HashConnect;
      const hashConnect = new HashConnect(true);
      results.instanceCreated = true;
      console.log('✅ HashConnect instance created');

      // Test 3: Check properties and methods
      results.properties = Object.getOwnPropertyNames(hashConnect);
      results.methods = results.properties.filter((prop: string) => 
        typeof (hashConnect as any)[prop] === 'function'
      );

      // Test 4: Try initialization
      console.log('🧪 Testing HashConnect initialization...');
      const appMetadata = {
        name: 'Patent Hash Test',
        description: 'Test app for HashConnect',
        icons: [`${window.location.origin}/favicon.ico`],
        url: window.location.origin,
      };

      try {
        const initData = await hashConnect.init(appMetadata);
        results.initSuccess = true;
        results.initData = initData;
        console.log('✅ HashConnect initialization successful');
      } catch (initError) {
        results.initError = initError.message;
        console.log('❌ HashConnect initialization failed:', initError);
      }

    } catch (error: any) {
      results.error = error.message;
      console.error('❌ HashConnect test failed:', error);
    }

    setTestResults(results);
    setIsLoading(false);
  };

  useEffect(() => {
    // Auto-run test on component mount
    runHashConnectTest();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>HashConnect Compatibility Test</CardTitle>
        <CardDescription>
          Testing HashConnect library compatibility and functionality
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runHashConnectTest} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Running Test...' : 'Run HashConnect Test'}
        </Button>

        {testResults && (
          <div className="space-y-4">
            {/* Test Results Summary */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Import Success</label>
                <div className={`px-3 py-2 rounded-md text-sm ${
                  testResults.importSuccess 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}>
                  {testResults.importSuccess ? '✅ Success' : '❌ Failed'}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Instance Created</label>
                <div className={`px-3 py-2 rounded-md text-sm ${
                  testResults.instanceCreated 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}>
                  {testResults.instanceCreated ? '✅ Success' : '❌ Failed'}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Initialization</label>
                <div className={`px-3 py-2 rounded-md text-sm ${
                  testResults.initSuccess 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                    : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                }`}>
                  {testResults.initSuccess ? '✅ Success' : '⚠️ Failed'}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Methods Found</label>
                <div className="px-3 py-2 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-md text-sm">
                  {testResults.methods?.length || 0} methods
                </div>
              </div>
            </div>

            {/* Error Display */}
            {testResults.error && (
              <Alert variant="destructive">
                <AlertDescription>
                  <strong>Error:</strong> {testResults.error}
                </AlertDescription>
              </Alert>
            )}

            {testResults.initError && (
              <Alert>
                <AlertDescription>
                  <strong>Init Error:</strong> {testResults.initError}
                </AlertDescription>
              </Alert>
            )}

            {/* Available Methods */}
            {testResults.methods && testResults.methods.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Available Methods</label>
                <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {testResults.methods.map((method: string) => (
                      <div key={method} className="font-mono">
                        {method}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* All Properties */}
            {testResults.properties && testResults.properties.length > 0 && (
              <details className="space-y-2">
                <summary className="text-sm font-medium cursor-pointer">
                  All Properties ({testResults.properties.length})
                </summary>
                <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md">
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {testResults.properties.map((prop: string) => (
                      <div key={prop} className="font-mono">
                        {prop}
                      </div>
                    ))}
                  </div>
                </div>
              </details>
            )}

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