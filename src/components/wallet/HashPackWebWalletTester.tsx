import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, ExternalLink, RefreshCw, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function HashPackWebWalletTester() {
  const [messages, setMessages] = useState<any[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [testPopup, setTestPopup] = useState<Window | null>(null);
  const [testUrls, setTestUrls] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const messageListener = (event: MessageEvent) => {
      const message = {
        timestamp: new Date().toISOString(),
        origin: event.origin,
        data: event.data,
        isHashPack: event.origin.includes('hashpack.app') || event.origin.includes('localhost'),
        hasAccountId: false
      };

      // Check if message contains account ID
      if (event.data && typeof event.data === 'object') {
        const accountId = event.data.accountId || 
                         event.data.account || 
                         event.data.selectedAccount ||
                         (event.data.accounts && event.data.accounts[0]) ||
                         (event.data.accountIds && event.data.accountIds[0]);
        
        if (accountId && typeof accountId === 'string' && accountId.match(/^0\.0\.\d+$/)) {
          message.hasAccountId = true;
        }
      }
      
      console.log('📨 Web Wallet Tester - Message received:', message);
      setMessages(prev => [message, ...prev].slice(0, 50)); // Keep last 50 messages
    };

    if (isListening) {
      window.addEventListener('message', messageListener);
      console.log('👂 Web Wallet Tester - Started listening for messages...');
    }

    return () => {
      window.removeEventListener('message', messageListener);
    };
  }, [isListening]);

  const startListening = () => {
    setIsListening(true);
    setMessages([]);
  };

  const stopListening = () => {
    setIsListening(false);
  };

  const clearMessages = () => {
    setMessages([]);
  };

  const generateTestUrls = () => {
    const baseUrls = [
      // Basic HashPack wallet
      'https://wallet.hashpack.app/',
      
      // With network parameter
      'https://wallet.hashpack.app/?network=testnet',
      
      // With origin
      `https://wallet.hashpack.app/?network=testnet&origin=${encodeURIComponent(window.location.origin)}`,
      
      // With app name
      `https://wallet.hashpack.app/?network=testnet&origin=${encodeURIComponent(window.location.origin)}&name=${encodeURIComponent('Patent Hash')}`,
      
      // With connection ID
      `https://wallet.hashpack.app/?network=testnet&origin=${encodeURIComponent(window.location.origin)}&name=${encodeURIComponent('Patent Hash')}&id=${Date.now()}`,
      
      // HashConnect style
      `https://wallet.hashpack.app/hashconnect?topic=test_${Date.now()}&network=testnet&dAppName=${encodeURIComponent('Patent Hash')}`,
      
      // Connect endpoint
      `https://wallet.hashpack.app/connect?network=testnet&dAppName=${encodeURIComponent('Patent Hash')}&sessionId=test_${Date.now()}`,
    ];
    
    setTestUrls(baseUrls);
  };

  const openTestUrl = (url: string, index: number) => {
    console.log(`🌐 Opening test URL ${index + 1}:`, url);
    
    const popup = window.open(
      url,
      `hashpack-test-${index}`,
      'width=400,height=600,scrollbars=yes,resizable=yes'
    );
    
    if (popup) {
      setTestPopup(popup);
      if (!isListening) {
        startListening();
      }
      
      // Send a test message to the popup after it loads
      setTimeout(() => {
        if (!popup.closed) {
          popup.postMessage({ type: 'ping', from: 'parent' }, '*');
        }
      }, 2000);
    } else {
      toast({
        title: "Popup Blocked",
        description: "Please allow popups and try again",
        variant: "destructive",
      });
    }
  };

  const closeTestPopup = () => {
    if (testPopup && !testPopup.closed) {
      testPopup.close();
    }
    setTestPopup(null);
  };

  const copyMessage = (message: any) => {
    navigator.clipboard.writeText(JSON.stringify(message, null, 2));
    toast({
      title: "Copied",
      description: "Message copied to clipboard",
    });
  };

  const testDirectConnection = () => {
    // Test the actual service
    import('@/services/hashPackService').then(({ hashPackService }) => {
      hashPackService.connect('testnet')
        .then(result => {
          console.log('✅ Direct connection test successful:', result);
          toast({
            title: "Connection Successful",
            description: `Connected to ${result.accountId}`,
          });
        })
        .catch(error => {
          console.error('❌ Direct connection test failed:', error);
          toast({
            title: "Connection Failed",
            description: error.message,
            variant: "destructive",
          });
        });
    });
  };

  useEffect(() => {
    generateTestUrls();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          HashPack Web Wallet Tester
        </CardTitle>
        <CardDescription>
          Test different HashPack web wallet URLs and monitor postMessage communication
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Controls */}
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={isListening ? stopListening : startListening}
            variant={isListening ? 'destructive' : 'default'}
          >
            {isListening ? 'Stop Listening' : 'Start Listening'}
          </Button>
          
          <Button
            onClick={testDirectConnection}
            variant="outline"
          >
            Test Service Connection
          </Button>
          
          <Button
            onClick={clearMessages}
            variant="ghost"
            size="sm"
          >
            Clear Messages
          </Button>
          
          {testPopup && !testPopup.closed && (
            <Button
              onClick={closeTestPopup}
              variant="outline"
              size="sm"
            >
              Close Popup
            </Button>
          )}
        </div>

        {/* Status */}
        <div className="flex items-center gap-4">
          <Badge variant={isListening ? 'default' : 'secondary'}>
            {isListening ? 'Listening' : 'Not Listening'}
          </Badge>
          
          <Badge variant="outline">
            {messages.length} messages
          </Badge>
          
          <Badge variant="outline">
            {messages.filter(m => m.hasAccountId).length} with account ID
          </Badge>
        </div>

        {/* Test URLs */}
        <div className="space-y-2">
          <h4 className="font-medium">Test URLs:</h4>
          <div className="grid gap-2">
            {testUrls.map((url, index) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-900 rounded">
                <span className="text-xs font-mono flex-1 truncate">{url}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openTestUrl(url, index)}
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <Alert>
          <MessageSquare className="h-4 w-4" />
          <AlertDescription>
            <strong>How to test:</strong>
            <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
              <li>Click "Start Listening" to monitor messages</li>
              <li>Click any test URL to open HashPack web wallet</li>
              <li>Complete the connection flow in the popup</li>
              <li>Watch for messages in the list below</li>
              <li>Look for messages with account IDs (highlighted in green)</li>
            </ol>
          </AlertDescription>
        </Alert>

        {/* Messages */}
        {messages.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Received Messages:</h4>
            <div className="max-h-96 overflow-y-auto space-y-2">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-md border text-sm ${
                    message.hasAccountId
                      ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800'
                      : message.isHashPack
                      ? 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800'
                      : 'bg-gray-50 border-gray-200 dark:bg-gray-900 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={message.hasAccountId ? 'default' : message.isHashPack ? 'secondary' : 'outline'} 
                        className="text-xs"
                      >
                        {message.hasAccountId ? 'Account ID!' : message.isHashPack ? 'HashPack' : 'Other'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-muted-foreground truncate max-w-32">
                        {message.origin}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyMessage(message)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-800 p-2 rounded border">
                    <pre className="text-xs overflow-x-auto">
                      {JSON.stringify(message.data, null, 2)}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {messages.length === 0 && isListening && (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Listening for messages...</p>
            <p className="text-sm">Open a test URL to see message flow</p>
          </div>
        )}

        {/* Summary */}
        {messages.length > 0 && (
          <div className="border-t pt-4">
            <h4 className="font-medium mb-2">Summary:</h4>
            <div className="text-sm space-y-1">
              <div>Total messages: {messages.length}</div>
              <div>HashPack messages: {messages.filter(m => m.isHashPack).length}</div>
              <div>Messages with account ID: {messages.filter(m => m.hasAccountId).length}</div>
              <div>Unique origins: {[...new Set(messages.map(m => m.origin))].length}</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}