// WalletConnect time module polyfill
// This provides all the exports that WalletConnect expects

// Constants
export const FIVE_SECONDS = 5000;
export const ONE_SECOND = 1000;
export const THIRTY_SECONDS = 30000;
export const ONE_MINUTE = 60000;
export const FIVE_MINUTES = 300000;
export const ONE_HOUR = 3600000;
export const ONE_DAY = 86400000;

// Functions
export const toMiliseconds = (seconds) => seconds * 1000;
export const toSeconds = (miliseconds) => Math.floor(miliseconds / 1000);
export const formatTime = (timestamp) => new Date(timestamp).toISOString();

// Default export
const timeModule = {
  FIVE_SECONDS,
  ONE_SECOND,
  THIRTY_SECONDS,
  ONE_MINUTE,
  FIVE_MINUTES,
  ONE_HOUR,
  ONE_DAY,
  toMiliseconds,
  toSeconds,
  formatTime
};

export default timeModule;