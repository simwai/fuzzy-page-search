import type { Configuration } from '../types/config';

export class Logger {
  constructor(private config: Configuration) {}

  log(...args: any[]) {
    if (this.config.enableLogging) console.log('[FUZZY]', ...args);
  }

  warn(...args: any[]) {
    if (this.config.enableLogging) console.warn('[FUZZY]', ...args);
  }

  error(...args: any[]) {
    if (this.config.enableLogging) console.error('[FUZZY]', ...args);
  }
}
