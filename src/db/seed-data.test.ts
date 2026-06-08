import { describe, it, expect } from 'vitest';
import {
  buildWorldCup2026,
  WC2026_TEAMS,
  WC2026_HOST_CITIES,
} from './seed-data';

describe('buildWorldCup2026', () => {
  const collection = buildWorldCup2026();

  it('has the expected collection metadata', () => {
    expect(collection.slug).toBe('world-cup-2026');
    expect(collection.year).toBe(2026);
    expect(collection.name).toMatch(/World Cup 2026/);
  });

  it('includes 48 teams', () => {
    expect(WC2026_TEAMS).toHaveLength(48);
  });

  it('produces the right total item count', () => {
    // 3 specials + 48 teams * (1 badge + 18 players) + host cities
    const expected = 3 + WC2026_TEAMS.length * 19 + WC2026_HOST_CITIES.length;
    expect(collection.items).toHaveLength(expected);
  });

  it('has unique, non-empty item codes', () => {
    const codes = collection.items.map((i) => i.code);
    expect(new Set(codes).size).toBe(codes.length);
    expect(codes.every((c) => c.length > 0)).toBe(true);
  });

  it('has a strictly increasing, gap-free sortOrder', () => {
    collection.items.forEach((item, idx) => {
      expect(item.sortOrder).toBe(idx);
    });
  });

  it('names every item', () => {
    expect(collection.items.every((i) => i.name.trim().length > 0)).toBe(true);
  });

  it('tags each item with a known rarity', () => {
    const rarities = new Set(['special', 'badge', 'base', 'city']);
    expect(collection.items.every((i) => rarities.has(i.rarity))).toBe(true);
  });

  it('pads player numbers to two digits for stable sorting', () => {
    expect(collection.items.some((i) => i.code === 'BRA-01')).toBe(true);
    expect(collection.items.some((i) => i.code === 'BRA-18')).toBe(true);
  });
});
