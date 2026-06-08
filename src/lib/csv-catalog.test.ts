import { describe, it, expect } from 'vitest';
import { parseCatalogCsv } from './csv-catalog';

describe('parseCatalogCsv', () => {
  it('parses code,name with optional section and rarity', () => {
    const { items, errors } = parseCatalogCsv(
      ['BRA-01,Brazil — Player 1,Brazil,base', 'FWC-LOGO,Official Emblem,,special'].join('\n'),
    );
    expect(errors).toEqual([]);
    expect(items).toEqual([
      { code: 'BRA-01', name: 'Brazil — Player 1', section: 'Brazil', rarity: 'base', sortOrder: 0 },
      { code: 'FWC-LOGO', name: 'Official Emblem', section: undefined, rarity: 'special', sortOrder: 1 },
    ]);
  });

  it('defaults rarity to "base" and leaves section undefined when omitted', () => {
    const { items } = parseCatalogCsv('A-1,Sticker One');
    expect(items[0]).toMatchObject({ code: 'A-1', name: 'Sticker One', rarity: 'base' });
    expect(items[0].section).toBeUndefined();
  });

  it('skips a header row and blank lines', () => {
    const { items } = parseCatalogCsv('code,name,section,rarity\n\nA-1,One\n\nA-2,Two\n');
    expect(items.map((i) => i.code)).toEqual(['A-1', 'A-2']);
    expect(items.map((i) => i.sortOrder)).toEqual([0, 1]);
  });

  it('honors quoted fields containing commas and escaped quotes', () => {
    const { items } = parseCatalogCsv('A-1,"Messi, Lionel","Team ""Albiceleste""",legend');
    expect(items[0]).toMatchObject({
      code: 'A-1',
      name: 'Messi, Lionel',
      section: 'Team "Albiceleste"',
      rarity: 'legend',
    });
  });

  it('reports missing code/name with line numbers and keeps the rest', () => {
    const { items, errors } = parseCatalogCsv('A-1,One\n,Missing code\nA-3,Three');
    expect(items.map((i) => i.code)).toEqual(['A-1', 'A-3']);
    expect(errors).toEqual(['Line 2: both "code" and "name" are required']);
  });

  it('reports duplicate codes', () => {
    const { items, errors } = parseCatalogCsv('A-1,One\nA-1,Dup');
    expect(items).toHaveLength(1);
    expect(errors).toEqual(['Line 2: duplicate code "A-1"']);
  });

  it('errors on empty input', () => {
    expect(parseCatalogCsv('   \n  ').errors).toEqual([
      'No items found — add at least one "code,name" row.',
    ]);
  });
});
