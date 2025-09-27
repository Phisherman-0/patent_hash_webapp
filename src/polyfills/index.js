// src/polyfills/index.js
// Comprehensive polyfills for WalletConnect and other problematic modules

// Buffer polyfill
import { Buffer } from 'buffer';

// Setup global polyfills
if (typeof global === 'undefined') {
  globalThis.global = globalThis;
}

if (typeof globalThis.Buffer === 'undefined') {
  globalThis.Buffer = Buffer;
}

// Setup process polyfill
if (typeof globalThis.process === 'undefined') {
  globalThis.process = {
    env: {
      NODE_ENV: typeof process !== 'undefined' ? process.env.NODE_ENV : 'development'
    },
    platform: 'browser',
    cwd: () => '/',
    nextTick: (callback) => setTimeout(callback, 0),
  };
}

// Export for module usage
export { Buffer };
export default { Buffer };