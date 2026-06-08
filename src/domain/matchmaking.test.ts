import { describe, it, expect } from 'vitest';
import { findMatches, type TraderProfile } from './matchmaking';

const me: TraderProfile = {
  userId: 'me',
  wants: ['1', '2', '3'],
  offers: ['10', '11', '12'],
  country: 'BR',
  region: 'SP',
  reputation: 5,
};

describe('findMatches — core mutual matching', () => {
  it('finds a two-way match and lists both directions sorted', () => {
    const others: TraderProfile[] = [
      { userId: 'b', wants: ['12', '10'], offers: ['3', '1'] },
    ];
    const [match] = findMatches(me, others);
    expect(match.userId).toBe('b');
    expect(match.theyGiveMe).toEqual(['1', '3']); // their offers ∩ my wants
    expect(match.iGiveThem).toEqual(['10', '12']); // my offers ∩ their wants
    expect(match.balancedSize).toBe(2);
    expect(match.totalOverlap).toBe(4);
  });

  it('excludes one-way overlaps by default (they want my stuff, I want nothing of theirs)', () => {
    const others: TraderProfile[] = [
      { userId: 'oneway', wants: ['10'], offers: ['99'] },
    ];
    expect(findMatches(me, others)).toEqual([]);
  });

  it('can include one-way overlaps when minBalancedSize is 0', () => {
    const others: TraderProfile[] = [
      { userId: 'oneway', wants: ['10'], offers: ['99'] },
    ];
    const matches = findMatches(me, others, { minBalancedSize: 0 });
    expect(matches).toHaveLength(1);
    expect(matches[0].balancedSize).toBe(0);
    expect(matches[0].iGiveThem).toEqual(['10']);
    expect(matches[0].theyGiveMe).toEqual([]);
  });

  it('excludes traders with zero overlap even when minBalancedSize is 0', () => {
    const others: TraderProfile[] = [
      { userId: 'unrelated', wants: ['77'], offers: ['88'] }, // touches nothing of mine
    ];
    expect(findMatches(me, others, { minBalancedSize: 0 })).toEqual([]);
  });

  it('never matches a user with themselves', () => {
    const clone: TraderProfile = { ...me, userId: 'me' };
    expect(findMatches(me, [clone])).toEqual([]);
  });

  it('returns empty for an empty pool', () => {
    expect(findMatches(me, [])).toEqual([]);
  });

  it('balancedSize is the min of the two directions (asymmetric overlap)', () => {
    const others: TraderProfile[] = [
      { userId: 'asym', wants: ['10', '11', '12'], offers: ['1'] },
    ];
    const [match] = findMatches(me, others);
    expect(match.theyGiveMe).toEqual(['1']);
    expect(match.iGiveThem).toEqual(['10', '11', '12']);
    expect(match.balancedSize).toBe(1);
    expect(match.totalOverlap).toBe(4);
  });
});

describe('findMatches — ranking policy', () => {
  it('ranks larger balanced swaps first', () => {
    const others: TraderProfile[] = [
      { userId: 'small', wants: ['10'], offers: ['1'] },
      { userId: 'big', wants: ['10', '11'], offers: ['1', '2'] },
    ];
    expect(findMatches(me, others).map((m) => m.userId)).toEqual(['big', 'small']);
  });

  it('prefers same region, then same country, when swap sizes tie', () => {
    const others: TraderProfile[] = [
      { userId: 'foreign', wants: ['10'], offers: ['1'], country: 'AR', region: 'BA' },
      { userId: 'domestic', wants: ['10'], offers: ['1'], country: 'BR', region: 'RJ' },
      { userId: 'local', wants: ['10'], offers: ['1'], country: 'BR', region: 'SP' },
    ];
    expect(findMatches(me, others).map((m) => m.userId)).toEqual([
      'local',
      'domestic',
      'foreign',
    ]);
  });

  it('prefers higher reputation when size and locality tie', () => {
    const others: TraderProfile[] = [
      { userId: 'low', wants: ['10'], offers: ['1'], reputation: 1 },
      { userId: 'high', wants: ['10'], offers: ['1'], reputation: 4 },
    ];
    expect(findMatches(me, others).map((m) => m.userId)).toEqual(['high', 'low']);
  });

  it('falls back to larger total overlap then to a stable id order', () => {
    const others: TraderProfile[] = [
      { userId: 'zeta', wants: ['10'], offers: ['1'] },
      { userId: 'alpha', wants: ['10'], offers: ['1'] },
      { userId: 'wider', wants: ['10', '11'], offers: ['1'] }, // same balanced(1), bigger overlap
    ];
    expect(findMatches(me, others).map((m) => m.userId)).toEqual(['wider', 'alpha', 'zeta']);
  });

  it('respects the limit option after sorting', () => {
    const others: TraderProfile[] = [
      { userId: 'a', wants: ['10'], offers: ['1'] },
      { userId: 'b', wants: ['10', '11'], offers: ['1', '2'] },
      { userId: 'c', wants: ['10', '11', '12'], offers: ['1', '2', '3'] },
    ];
    expect(findMatches(me, others, { limit: 2 }).map((m) => m.userId)).toEqual(['c', 'b']);
  });
});

describe('findMatches — determinism and locality edge cases', () => {
  it('does not treat undefined country/region as a shared locality', () => {
    const noLocale: TraderProfile = { userId: 'me2', wants: ['1'], offers: ['10'] };
    const others: TraderProfile[] = [
      { userId: 'x', wants: ['10'], offers: ['1'] }, // also no locale
    ];
    const [match] = findMatches(noLocale, others);
    expect(match.sameCountry).toBe(false);
    expect(match.sameRegion).toBe(false);
  });

  it('does not treat a same region string in a different country as same-region', () => {
    // me is BR/SP; this trader is also "SP" but in a different country.
    const others: TraderProfile[] = [
      { userId: 'sp-abroad', wants: ['10'], offers: ['1'], country: 'AR', region: 'SP' },
    ];
    const [match] = findMatches(me, others);
    expect(match.sameCountry).toBe(false);
    expect(match.sameRegion).toBe(false);
  });

  it('ranks a real domestic match above a same-region-string foreign one', () => {
    const others: TraderProfile[] = [
      // Same region *string* but abroad — must not outrank a true domestic match.
      { userId: 'foreign-sp', wants: ['10'], offers: ['1'], country: 'AR', region: 'SP' },
      { userId: 'domestic', wants: ['10'], offers: ['1'], country: 'BR', region: 'RJ' },
    ];
    expect(findMatches(me, others).map((m) => m.userId)).toEqual(['domestic', 'foreign-sp']);
  });

  it('produces identical output across repeated runs (determinism)', () => {
    const others: TraderProfile[] = [
      { userId: 'c', wants: ['10'], offers: ['1'] },
      { userId: 'a', wants: ['10'], offers: ['1'] },
      { userId: 'b', wants: ['10'], offers: ['1'] },
    ];
    const first = findMatches(me, others);
    const second = findMatches(me, others);
    expect(first).toEqual(second);
  });

  it('accepts Set inputs as profiles (Iterable contract)', () => {
    const setProfile: TraderProfile = {
      userId: 'sets',
      wants: new Set(['10']),
      offers: new Set(['1']),
    };
    const [match] = findMatches(me, [setProfile]);
    expect(match.balancedSize).toBe(1);
  });
});
