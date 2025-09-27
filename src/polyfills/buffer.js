// Buffer polyfill for browser environment
import { Buffer } from 'buffer';

// Export Buffer as both named and default export
export { Buffer };
export default Buffer;

// Also export other buffer-related utilities
export const constants = {
  MAX_LENGTH: 0x7fffffff,
  MAX_STRING_LENGTH: 0x7fffffff
};

// Make Buffer available globally if needed
if (typeof window !== 'undefined' && !window.Buffer) {
  window.Buffer = Buffer;
}

// If this is being used as a module replacement, also export Buffer as a named export
export { Buffer as Buffer };