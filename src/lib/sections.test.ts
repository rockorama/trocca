import { describe, it, expect } from 'vitest';
import { groupBySection, type CatalogItem } from './sections';
import { buildWorldCup2026 } from '@/db/seed-data';

function item(partial: Partial<CatalogItem>): CatalogItem {
  return { code: 'X', name: 'X', rarity: 'base', sortOrder: 0, ...partial };
}

describe('groupBySection', () => {
  it('separates specials, teams and host cities', () => {
    const sections = groupBySection([
      item({ rarity: 'special', name: 'Official Emblem' }),
      item({ rarity: 'badge', name: 'Brazil — Team Badge' }),
      item({ rarity: 'base', name: 'Brazil — Player 1' }),
      item({ rarity: 'base', name: 'Argentina — Player 1' }),
      item({ rarity: 'city', name: 'Host City — Miami' }),
    ]);

    expect(sections.map((s) => [s.kind, s.id])).toEqual([
      ['specials', 'specials'],
      ['team', 'Brazil'],
      ['team', 'Argentina'],
      ['cities', 'cities'],
    ]);
    expect(sections[1].items).toHaveLength(2); // badge + player both under Brazil
  });

  it('groups by the explicit section field when present, ignoring the name', () => {
    const sections = groupBySection([
      item({ name: 'Lionel Messi', section: 'Argentina' }),
      item({ name: 'Ángel Di María', section: 'Argentina' }),
      item({ name: 'Neymar Jr', section: 'Brasil' }),
    ]);
    expect(sections.map((s) => s.id)).toEqual(['Argentina', 'Brasil']);
    expect(sections[0].items).toHaveLength(2);
  });

  it('preserves first-seen order of sections and items', () => {
    const sections = groupBySection([
      item({ name: 'Zeta — A' }),
      item({ name: 'Alpha — B' }),
      item({ name: 'Zeta — C' }),
    ]);
    expect(sections.map((s) => s.id)).toEqual(['Zeta', 'Alpha']);
    expect(sections[0].items.map((i) => i.name)).toEqual(['Zeta — A', 'Zeta — C']);
  });

  it('covers every World Cup item exactly once', () => {
    const { items } = buildWorldCup2026();
    const sections = groupBySection(items);
    const regrouped = sections.flatMap((s) => s.items);
    expect(regrouped).toHaveLength(items.length);
    // 1 specials + 48 teams + 1 cities
    expect(sections).toHaveLength(50);
  });
});
