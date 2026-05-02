import { describe, expect, it } from 'vitest';
import { damerauLevenshteinSimilarity, smartSimilarity } from './algorithms';

describe('damerauLevenshteinSimilarity', () => {
  it('should return 1.0 for identical strings', () => {
    expect(damerauLevenshteinSimilarity('hello', 'hello')).toBe(1.0);
  });

  it('should return 0.0 for completely different strings', () => {
    expect(damerauLevenshteinSimilarity('abc', 'xyz')).toBe(0.0);
  });

  it('should handle transpositions', () => {
    const sim = damerauLevenshteinSimilarity('taht', 'that');
    expect(sim).toBeGreaterThan(0.7);
  });

  it('should handle deletions', () => {
    const sim = damerauLevenshteinSimilarity('hello', 'hell');
    expect(sim).toBe(0.8);
  });
});

describe('smartSimilarity', () => {
  it('should give high score for substring match', () => {
    const sim = smartSimilarity('test', 'this is a test string');
    expect(sim).toBeGreaterThanOrEqual(0.7);
  });

  it('should handle typos via fuzzy matching', () => {
    const sim = smartSimilarity('fuzzy', 'fuzy search');
    expect(sim).toBeGreaterThan(0.6);
  });
});
