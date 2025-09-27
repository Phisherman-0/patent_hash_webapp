// Pino logger polyfill for browser environment
const noop = () => {};

// Create a minimal pino-compatible logger
const pino = (opts = {}) => {
  const logger = {
    trace: noop,
    debug: noop,
    info: noop,
    warn: console.warn.bind(console),
    error: console.error.bind(console),
    fatal: console.error.bind(console),
    silent: noop,
    level: opts.level || 'info',
    levels: {
      values: {
        trace: 10,
        debug: 20,
        info: 30,
        warn: 40,
        error: 50,
        fatal: 60
      }
    }
  };

  // Add child logger support
  logger.child = (bindings) => {
    return pino({ ...opts, ...bindings });
  };

  return logger;
};

// Export pino as both named and default export
export { pino };
export default pino;

// Also export other pino utilities
export const levels = {
  values: {
    trace: 10,
    debug: 20,
    info: 30,
    warn: 40,
    error: 50,
    fatal: 60
  }
};

export const stdSerializers = {
  err: (err) => err,
  req: (req) => req,
  res: (res) => res
};

export const stdTimeFunctions = {
  nullTime: () => null,
  epochTime: () => Date.now(),
  unixTime: () => Math.round(Date.now() / 1000),
  isoTime: () => new Date().toISOString()
};