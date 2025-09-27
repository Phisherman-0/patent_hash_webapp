import { HashConnect } from 'hashconnect';

/**
 * Test utility to check HashConnect API availability
 * Run this in browser console to see what's available
 */
export function testHashConnectAPI() {
  console.log('🧪 Testing HashConnect API...');
  
  try {
    const hashConnect = new HashConnect(true);
    
    console.log('✅ HashConnect instance created');
    console.log('📋 HashConnect properties:', Object.getOwnPropertyNames(hashConnect));
    console.log('📋 HashConnect prototype:', Object.getOwnPropertyNames(Object.getPrototypeOf(hashConnect)));
    
    // Check for event properties
    const eventProperties = [
      'foundExtensionEvent',
      'pairingEvent', 
      'connectionStatusChangeEvent',
      'additionalAccountResponseEvent',
      'transactionEvent'
    ];
    
    console.log('🔍 Event availability:');
    eventProperties.forEach(prop => {
      const exists = prop in hashConnect;
      const value = (hashConnect as any)[prop];
      console.log(`- ${prop}: ${exists ? '✅' : '❌'} ${exists ? typeof value : 'undefined'}`);
      
      if (exists && value) {
        console.log(`  - Has 'on' method: ${typeof value.on === 'function' ? '✅' : '❌'}`);
        console.log(`  - Has 'once' method: ${typeof value.once === 'function' ? '✅' : '❌'}`);
      }
    });
    
    // Check methods
    const methods = [
      'init',
      'findLocalWallets',
      'connectToLocalWallet',
      'openPairingModal',
      'getSavedPairings',
      'clearConnectionsAndData',
      'sendTransaction'
    ];
    
    console.log('🔧 Method availability:');
    methods.forEach(method => {
      const exists = typeof (hashConnect as any)[method] === 'function';
      console.log(`- ${method}: ${exists ? '✅' : '❌'}`);
    });
    
    return hashConnect;
  } catch (error) {
    console.error('❌ Failed to create HashConnect instance:', error);
    return null;
  }
}

// Auto-run test if in browser
if (typeof window !== 'undefined') {
  (window as any).testHashConnectAPI = testHashConnectAPI;
  console.log('💡 Run testHashConnectAPI() in console to test HashConnect API');
}