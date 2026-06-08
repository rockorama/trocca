import { describe, it, expect } from 'vitest';
import {
  collectionStats,
  neededItems,
  extraItems,
  totalExtras,
  type Holdings,
} from './collection';

const catalog = ['a', 'b', 'c', 'd'];

describe('neededItems', () => {
  it('returns catalog items with count 0 or absent, sorted', () => {
    const holdings: Holdings = { a: 1, b: 0, c: 3 };
    expect(neededItems(catalog, holdings)).toEqual(['b', 'd']);
  });

  it('treats negative or non-finite counts as needed', () => {
    const holdings: Holdings = { a: -2, b: NaN, c: 1, d: 1 };
    expect(neededItems(catalog, holdings)).toEqual(['a', 'b']);
  });

  it('returns empty when everything is owned', () => {
    expect(neededItems(catalog, { a: 1, b: 1, c: 1, d: 1 })).toEqual([]);
  });

  it('ignores held items that are not in the catalog', () => {
    expect(neededItems(catalog, { z: 5 })).toEqual(['a', 'b', 'c', 'd']);
  });

  it('deduplicates a catalog with repeated ids', () => {
    expect(neededItems(['a', 'a', 'b'], { a: 1 })).toEqual(['b']);
  });
});

describe('extraItems', () => {
  it('returns items with 2+ copies, sorted', () => {
    const holdings: Holdings = { c: 3, a: 2, b: 1, d: 0 };
    expect(extraItems(holdings)).toEqual(['a', 'c']);
  });

  it('includes off-catalog extras (holdings are catalog-independent)', () => {
    expect(extraItems({ z: 4, a: 2 })).toEqual(['a', 'z']);
  });

  it('floors fractional counts before comparing', () => {
    expect(extraItems({ a: 1.9, b: 2.1 })).toEqual(['b']);
  });

  it('returns empty when no duplicates', () => {
    expect(extraItems({ a: 1, b: 1 })).toEqual([]);
  });
});

describe('totalExtras', () => {
  it('sums spare copies across items', () => {
    expect(totalExtras({ a: 3, b: 2, c: 1, d: 0 })).toBe(3); // (3-1)+(2-1)
  });

  it('ignores negative and fractional noise', () => {
    expect(totalExtras({ a: -5, b: 2.7, c: 4 })).toBe(4); // floor(2.7)-1 + 4-1 = 1+3
  });

  it('is zero with no duplicates', () => {
    expect(totalExtras({ a: 1, b: 0 })).toBe(0);
  });
});

describe('collectionStats', () => {
  it('computes totals, owned, missing, extras and completion', () => {
    const holdings: Holdings = { a: 1, b: 2, c: 0 }; // d absent
    expect(collectionStats(catalog, holdings)).toEqual({
      total: 4,
      owned: 2, // a, b
      missing: 2, // c, d
      extras: 1, // b has one spare
      completion: 0.5,
    });
  });

  it('reports full completion for an empty catalog', () => {
    expect(collectionStats([], { a: 5 })).toEqual({
      total: 0,
      owned: 0,
      missing: 0,
      extras: 4,
      completion: 1,
    });
  });

  it('does not count off-catalog holdings towards owned', () => {
    const stats = collectionStats(catalog, { z: 9 });
    expect(stats.owned).toBe(0);
    expect(stats.missing).toBe(4);
    expect(stats.extras).toBe(8); // z spare copies still counted as tradeable
  });

  it('deduplicates the catalog before counting', () => {
    const stats = collectionStats(['a', 'a', 'b'], { a: 1 });
    expect(stats.total).toBe(2);
    expect(stats.owned).toBe(1);
    expect(stats.completion).toBe(0.5);
  });
});
