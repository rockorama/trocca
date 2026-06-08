import { describe, it, expect } from 'vitest';
import { slugify } from './collections-repo';

describe('slugify', () => {
  it('lowercases and hyphenates', () => {
    expect(slugify('FIFA World Cup 2026')).toBe('fifa-world-cup-2026');
  });

  it('strips accents/diacritics', () => {
    expect(slugify('Coração & Seleção')).toBe('coracao-selecao');
    expect(slugify('Türkiye Álbum')).toBe('turkiye-album');
  });

  it('trims leading/trailing separators and collapses runs', () => {
    expect(slugify('  --Hello,, World!!  ')).toBe('hello-world');
  });

  it('falls back to "album" for empty/symbol-only names', () => {
    expect(slugify('!!!')).toBe('album');
    expect(slugify('')).toBe('album');
  });
});
