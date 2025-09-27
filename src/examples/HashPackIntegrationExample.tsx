import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useHashPackWallet } from '@/contexts/HashPackWalletContext';
import { HashPackDebugger } from '@/components/wallet/HashPackDebugger';

/**
 * Complete example of HashPack integration with proper error handling,
 * event management, and best practices for maintaining wallet connections.
 */
export function HashPackIntegrationExample() {
  const {
    walletInfo,
    connectionState,
    isConnecting,
    error,
    connect,
    disconnect,
    sendTransaction,
    isInitialized,
    isExtensionAvailable,
    debug
  } = useHashPackWallet();

  const [selectedNetwork, setSelectedNetwork] = useState<'testnet' | 'mainnet'>('testnet');
  const [transactionStatus, setTransactionStatus] = useState<string>('');
  const [showDebugger, setShowDebugger] = useState(false);
  const { toast } = useToast();

  // Example: Listen for wallet events
  useEffect(() => {
    const handleWalletConnected = (event: CustomEvent) => {
      console.log('✅ Wallet connected:', event.detail);
      toast({
        title: "Wallet Connected",
        description: `Connected to account ${event.detail.accountId}`,
      });
    };

    const handleWalletDisconnected = () => {
      console.log('❌ Wallet disconnected');
      toast({
        title: "Wallet Disconnected",
        description: "Your wallet has been disconnected",
      });
    };

    const handleConnectionStatusChange = (event: CustomEvent) => {
      console.log('🔄 Connection status changed:', event.detail);
    };

    // Add event listeners
    window.addEventListener('hashpack-connected', handleWalletConnected as EventListener);
    window.addEventListener('hashpack-disconnected', handleWalletDisconnected);
    window.addEventListener('hashpack-statusChanged', handleConnectionStatusChange as EventListener);

    return () => {
      // Cleanup
      window.removeEventListener('hashpack-connected', handleWalletConnected as EventListener);
      window.removeEventListener('hashpack-disconnected', handleWalletDisconnected);
      window.removeEventListener('hashpack-statusChanged', handleConnectionStatusChange as EventListener);
    };
  }, [toast]);

  // Example: Handle wallet connection with proper error handling
  const handleConnect = async () => {
    try {
      console.log(`🔗 Attempting to connect to ${selectedNetwork}...`);
      await connect(selectedNetwork);
      
      if (walletInfo) {
        console.log('✅ Connection successful:', walletInfo);
        toast({
          title: "Connection Successful",
          description: `Connected to HashPack on ${selectedNetwork}`,
        });
      }
    } catch (error: any) {
      console.error('❌ Connection failed:', error);
      
      // Handle specific error types
      if (error.message.includes('timeout')) {
        toast({
          title: "Connection Timeout",
          description: "The connection attempt timed out. Please try again.",
          variant: "destructive",
        });
      } else if (error.message.includes('rejected')) {
        toast({
          title: "Connection Rejected",
          description: "The connection was rejected by the user.",
          variant: "destructive",
        });
      } else if (error.message.includes('extension')) {
        toast({
          title: "Extension Not Found",
          description: "HashPack extension not detected. Please install it or use web wallet.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Connection Failed",
          description: error.message || 'An unknown error occurred',
          variant: "destructive",
        });
      }
    }
  };

  // Example: Handle wallet disconnection
  const handleDisconnect = async () => {
    try {
      console.log('🔌 Disconnecting wallet...');
      await disconnect();
      toast({
        title: "Disconnected",
        description: "Your wallet has been disconnected successfully",
      });
    } catch (error: any) {
      console.error('❌ Disconnection failed:', error);
      toast({
        title: "Disconnection Failed",
        description: error.message || 'Failed to disconnect wallet',
        variant: "destructive",
      });
    }
  };

  // Example: Send a test transaction
  const handleSendTestTransaction = async () => {
    if (!walletInfo) {
      toast({
        title: "No Wallet Connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    try {
      setTransactionStatus('Preparing transaction...');
      
      // Example: Create a simple HBAR transfer transaction
      // In a real app, you would use the Hedera SDK to create the transaction
      const exampleTransactionBytes = new Uint8Array([
        // This would be actual transaction bytes from Hedera SDK
        0x0a, 0x0c, 0x08, 0x80, 0x92, 0xb8, 0xc3, 0x98, 0x01, 0x10, 0x80, 0x92
      ]);

      setTransactionStatus('Waiting for signature...');
      
      const result = await sendTransaction(exampleTransactionBytes);
      
      console.log('✅ Transaction successful:', result);
      setTransactionStatus('Transaction completed successfully!');
      
      toast({
        title: "Transaction Successful",
        description: "Your transaction has been signed and submitted",
      });
    } catch (error: any) {
      console.error('❌ Transaction failed:', error);
      setTransactionStatus('Transaction failed');
      
      if (error.message.includes('rejected')) {
        toast({
          title: "Transaction Rejected",
          description: "The transaction was rejected by the user",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Transaction Failed",
          description: error.message || 'Transaction failed',
          variant: "destructive",
        });
      }
    }
  };

  // Example: Check connection status and restore session
  const checkConnectionStatus = () => {
    console.log('🔍 Current connection status:');
    console.log('- Initialized:', isInitialized);
    console.log('- Extension Available:', isExtensionAvailable);
    console.log('- Connection State:', connectionState);
    console.log('- Wallet Info:', walletInfo);
    console.log('- Error:', error);
    
    debug(); // Call the debug method to log detailed info
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>HashPack Integration Example</CardTitle>
          <CardDescription>
            Complete example showing proper HashPack wallet integration with error handling and best practices
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Connection Status */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Initialized</label>
              <Badge variant={isInitialized ? 'default' : 'secondary'}>
                {isInitialized ? 'Yes' : 'No'}
              </Badge>
            </div>
            <div>
              <label className="text-sm font-medium">Extension</label>
              <Badge variant={isExtensionAvailable ? 'default' : 'destructive'}>
                {isExtensionAvailable ? 'Available' : 'Not Found'}
              </Badge>
            </div>
            <div>
              <label className="text-sm font-medium">Status</label>
              <Badge variant={connectionState === 'Connected' ? 'default' : 'secondary'}>
                {connectionState}
              </Badge>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>
                <strong>Error:</strong> {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Connected State */}
          {walletInfo && connectionState === 'Connected' && (
            <Alert>
              <AlertDescription>
                <strong>Connected:</strong> Account {walletInfo.accountId} on {walletInfo.network}
              </AlertDescription>
            </Alert>
          )}

          {/* Network Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Network</label>
            <select
              value={selectedNetwork}
              onChange={(e) => setSelectedNetwork(e.target.value as 'testnet' | 'mainnet')}
              className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md"
              disabled={isConnecting || connectionState === 'Connected'}
            >
              <option value="testnet">Testnet</option>
              <option value="mainnet">Mainnet</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            {connectionState !== 'Connected' ? (
              <Button
                onClick={handleConnect}
                disabled={isConnecting || !isInitialized}
              >
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </Button>
            ) : (
              <Button
                variant="destructive"
                onClick={handleDisconnect}
              >
                Disconnect
              </Button>
            )}

            <Button
              variant="outline"
              onClick={handleSendTestTransaction}
              disabled={!walletInfo || connectionState !== 'Connected'}
            >
              Send Test Transaction
            </Button>

            <Button
              variant="outline"
              onClick={checkConnectionStatus}
            >
              Check Status
            </Button>

            <Button
              variant="outline"
              onClick={() => setShowDebugger(!showDebugger)}
            >
              {showDebugger ? 'Hide' : 'Show'} Debugger
            </Button>
          </div>

          {/* Transaction Status */}
          {transactionStatus && (
            <Alert>
              <AlertDescription>
                <strong>Transaction Status:</strong> {transactionStatus}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Debugger */}
      {showDebugger && <HashPackDebugger />}

      {/* Best Practices Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Best Practices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-semibold">1. Initialization</h4>
              <p>Always call <code>init()</code> before attempting to connect. This sets up HashConnect and checks for existing connections.</p>
            </div>
            
            <div>
              <h4 className="font-semibold">2. Extension Detection</h4>
              <p>Use <code>isExtensionAvailable</code> to check if HashPack extension is installed. Provide fallback to web wallet.</p>
            </div>
            
            <div>
              <h4 className="font-semibold">3. Error Handling</h4>
              <p>Handle different error types (timeout, rejection, extension not found) with appropriate user messages.</p>
            </div>
            
            <div>
              <h4 className="font-semibold">4. Event Listeners</h4>
              <p>Listen for HashConnect events to handle connection changes, account switches, and network changes.</p>
            </div>
            
            <div>
              <h4 className="font-semibold">5. Session Restoration</h4>
              <p>HashConnect automatically restores saved pairings on initialization. Check connection state after init.</p>
            </div>
            
            <div>
              <h4 className="font-semibold">6. Transaction Handling</h4>
              <p>Always handle transaction rejections gracefully and provide clear feedback to users.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}