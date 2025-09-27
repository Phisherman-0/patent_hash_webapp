// WalletConnect polyfills and workarounds
// This file handles common issues with WalletConnect dependencies in Vite

// Polyfill for missing exports from @walletconnect/time
const FIVE_SECONDS = 5000;
const ONE_SECOND = 1000;
const THIRTY_SECONDS = 30000;
const ONE_MINUTE = 60000;
const FIVE_MINUTES = 300000;
const ONE_HOUR = 3600000;
const ONE_DAY = 86400000;

// Functions that might be needed
const toMiliseconds = (seconds) => seconds * 1000;
const toSeconds = (miliseconds) => miliseconds / 1000;

// Export the constants and functions to match what WalletConnect expects
export { 
  FIVE_SECONDS, 
  ONE_SECOND, 
  THIRTY_SECONDS, 
  ONE_MINUTE, 
  FIVE_MINUTES, 
  ONE_HOUR, 
  ONE_DAY,
  toMiliseconds,
  toSeconds
};

// Default export for compatibility
export default {
  FIVE_SECONDS,
  ONE_SECOND,
  THIRTY_SECONDS,
  ONE_MINUTE,
  FIVE_MINUTES,
  ONE_HOUR,
  ONE_DAY,
  toMiliseconds,
  toSeconds
};