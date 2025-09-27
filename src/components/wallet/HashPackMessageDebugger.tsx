import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, MessageSquare, ExternalLink } from 'lucide-react';

export function HashPackMessageDebugger() {
  const [messages, setMessages] = useState<any[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [testPopup, setTestPopup] = useState<Window | null>(null);

  useEffect(() => {
    const messageListener = (event: MessageEvent) => {
      const message = {
        timestamp: new Date().toISOString(),
        origin: event.origin,
        data: event.data,
        isHashPack: event.origin.includes('hashpack.app')
      };
      
      console.log('📨 Message received:', message);
      setMessages(prev => [message, ...prev].slice(0, 20)); // Keep last 20 messages
    };

    if (isListening) {
      window.addEventListener('message', messageListener);
      console.log('👂 Started listening for messages...');
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

  const openTestWallet = () => {
    const topic = 'test_' + Math.random().toString(36).substring(2, 15);
    const walletUrl = `https://wallet.hashpack.app/hashconnect?` +
      `topic=${topic}` +
      `&network=testnet` +
      `&dAppName=${encodeURIComponent('Message Debug Test')}` +
      `&dAppDescription=${encodeURIComponent('Testing message flow')}` +
      `&dAppIcon=${encodeURIComponent(window.location.origin + '/favicon.ico')}` +
      `&dAppUrl=${encodeURIComponent(window.location.origin)}` +
      `&projectId=debug-test`;
    
    console.log('🌐 Opening test wallet with URL:', walletUrl);
    
    const popup = window.open(
      walletUrl,
      'hashpack-debug',
      'width=420,height=700,scrollbars=yes,resizable=yes'
    );
    
    setTestPopup(popup);
    
    if (!isListening) {
      startListening();
    }
  };

  const closeTestWallet = () => {
    if (testPopup && !testPopup.closed) {
      testPopup.close();
    }
    setTestPopup(null);
  };

  const sendTestMessage = () => {
    if (testPopup && !testPopup.closed) {
      testPopup.postMessage({
        type: 'test-message',
        data: 'Hello from parent window'
      }, 'https://wallet.hashpack.app');
      console.log('📤 Sent test message to popup');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          HashPack Message Debugger
        </CardTitle>
        <CardDescription>
          Debug postMessage communication with HashPack web wallet
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
            onClick={openTestWallet}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            Open Test Wallet
          </Button>
          
          {testPopup && !testPopup.closed && (
            <>
              <Button
                onClick={sendTestMessage}
                variant="outline"
              >
                Send Test Message
              </Button>
              
              <Button
                onClick={closeTestWallet}
                variant="outline"
              >
                Close Wallet
              </Button>
            </>
          )}
          
          <Button
            onClick={clearMessages}
            variant="ghost"
            size="sm"
          >
            Clear Messages
          </Button>
        </div>

        {/* Status */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Badge variant={isListening ? 'default' : 'secondary'}>
              {isListening ? (
                <>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Listening
                </>
              ) : (
                <>
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Not Listening
                </>
              )}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {messages.length} messages
            </Badge>
          </div>
          
          {testPopup && (
            <div className="flex items-center gap-2">
              <Badge variant={testPopup.closed ? 'destructive' : 'default'}>
                Popup: {testPopup.closed ? 'Closed' : 'Open'}
              </Badge>
            </div>
          )}
        </div>

        {/* Instructions */}
        <Alert>
          <MessageSquare className="h-4 w-4" />
          <AlertDescription>
            <strong>How to use:</strong>
            <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
              <li>Click "Start Listening" to monitor all postMessage events</li>
              <li>Click "Open Test Wallet" to open HashPack web wallet</li>
              <li>Complete the connection flow in the popup</li>
              <li>Watch for messages in the list below</li>
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
                    message.isHashPack
                      ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800'
                      : 'bg-gray-50 border-gray-200 dark:bg-gray-900 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={message.isHashPack ? 'default' : 'secondary'} className="text-xs">
                        {message.isHashPack ? 'HashPack' : 'Other'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <span className="text-xs font-mono text-muted-foreground">
                      {message.origin}
                    </span>
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
            <p className="text-sm">Open the test wallet to see message flow</p>
          </div>
        )}

        {/* Expected Messages */}
        <details className="space-y-2">
          <summary className="text-sm font-medium cursor-pointer">
            Expected Message Types
          </summary>
          <div className="text-sm space-y-2 bg-gray-50 dark:bg-gray-900 p-3 rounded-md">
            <div><strong>Connection Success:</strong></div>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li><code>hashconnect-pairing-response</code></li>
              <li><code>hashconnect-approve-response</code></li>
              <li><code>pairing-response</code></li>
              <li><code>approve-response</code></li>
            </ul>
            
            <div><strong>Connection Rejection:</strong></div>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li><code>hashconnect-pairing-reject</code></li>
              <li><code>hashconnect-reject</code></li>
              <li><code>pairing-reject</code></li>
              <li><code>reject</code></li>
            </ul>
          </div>
        </details>
      </CardContent>
    </Card>
  );
}