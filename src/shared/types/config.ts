export interface Configuration {
  globalEnabled: boolean;
  defaultThreshold: number;
  maxMatches: number;
  debounceMilliseconds: number;
  cssPrefix: string;
  minTextLength: number;
  maxTextLength: number;
  enableLogging: boolean;
}

export const DEFAULT_CONFIGURATION: Configuration = {
  globalEnabled: false,
  defaultThreshold: 0.6,
  maxMatches: 100,
  debounceMilliseconds: 300,
  cssPrefix: 'fuzzy',
  minTextLength: 2,
  maxTextLength: 500,
  enableLogging: true,
};
