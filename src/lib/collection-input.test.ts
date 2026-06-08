import { describe, it, expect } from 'vitest';
import { validateCollectionInput, COLLECTION_LIMITS as L } from './collection-input';
import type { ParsedCatalogItem } from './csv-catalog';

const item = (over: Partial<ParsedCatalogItem> = {}): ParsedCatalogItem => ({
  code: 'A-1',
  name: 'One',
  rarity: 'base',
  sortOrder: 0,
  ...over,
});

const base = { name: 'My Album', csv: 'A-1,One' };

describe('validateCollectionInput', () => {
  it('accepts valid input', () => {
    expect(validateCollectionInput(base, [item()])).toEqual([]);
  });

  it('requires a non-empty name and caps its length', () => {
    expect(validateCollectionInput({ ...base, name: '   ' }, [item()])).toContain(
      'Album name is required.',
    );
    const long = 'x'.repeat(L.maxNameLen + 1);
    expect(validateCollectionInput({ ...base, name: long }, [item()])[0]).toMatch(/at most/);
  });

  it('rejects oversized CSV and too many items', () => {
    expect(
      validateCollectionInput({ ...base, csv: 'x'.repeat(L.maxCsvChars + 1) }, [item()]),
    ).toContainEqual(expect.stringContaining('too large'));

    const many = Array.from({ length: L.maxItems + 1 }, (_, i) => item({ code: `c${i}` }));
    expect(validateCollectionInput(base, many)).toContainEqual(
      expect.stringContaining('Too many items'),
    );
  });

  it('validates the year range and integer-ness', () => {
    expect(validateCollectionInput({ ...base, year: 1700 }, [item()])[0]).toMatch(/Year/);
    expect(validateCollectionInput({ ...base, year: 2_999 }, [item()])[0]).toMatch(/Year/);
    expect(validateCollectionInput({ ...base, year: NaN }, [item()])[0]).toMatch(/Year/);
    expect(validateCollectionInput({ ...base, year: 2026 }, [item()])).toEqual([]);
  });

  it('flags overlong item fields', () => {
    const bad = item({ name: 'n'.repeat(L.maxItemNameLen + 1) });
    expect(validateCollectionInput(base, [bad])).toContainEqual(
      expect.stringContaining('too long'),
    );
  });
});
