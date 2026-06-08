import { describe, it, expect } from 'vitest';
import en from '../../messages/en.json';
import pt from '../../messages/pt.json';
import es from '../../messages/es.json';

/** Recursively collect the dot-paths of every leaf string in a messages tree. */
function leafKeys(obj: unknown, prefix = ''): string[] {
  if (obj === null || typeof obj !== 'object') return [prefix];
  return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) =>
    leafKeys(v, prefix ? `${prefix}.${k}` : k),
  );
}

/** Extract ICU placeholder names like {percent} or {count, plural, ...}. */
function placeholders(value: string): Set<string> {
  const names = new Set<string>();
  const re = /\{(\w+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(value)) !== null) names.add(m[1]);
  return names;
}

function flatEntries(obj: unknown, prefix = ''): Array<[string, string]> {
  if (typeof obj === 'string') return [[prefix, obj]];
  if (obj === null || typeof obj !== 'object') return [];
  return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) =>
    flatEntries(v, prefix ? `${prefix}.${k}` : k),
  );
}

const catalogs = { en, pt, es };
const reference = leafKeys(en).sort();

describe('i18n catalog parity', () => {
  for (const [locale, catalog] of Object.entries(catalogs)) {
    it(`${locale} has exactly the same keys as en`, () => {
      expect(leafKeys(catalog).sort()).toEqual(reference);
    });
  }

  it('every locale uses the same ICU placeholders per key', () => {
    const enMap = new Map(flatEntries(en));
    for (const [locale, catalog] of Object.entries(catalogs)) {
      for (const [key, value] of flatEntries(catalog)) {
        expect(placeholders(value), `${locale}.${key} placeholders`).toEqual(
          placeholders(enMap.get(key) ?? ''),
        );
      }
    }
  });

  it('has no empty translations', () => {
    for (const [locale, catalog] of Object.entries(catalogs)) {
      for (const [key, value] of flatEntries(catalog)) {
        expect(value.trim(), `${locale}.${key} should not be empty`).not.toBe('');
      }
    }
  });
});
