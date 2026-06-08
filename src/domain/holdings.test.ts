import { describe, it, expect } from 'vitest';
import { mergeHoldings } from './holdings';

describe('mergeHoldings', () => {
  it('takes the per-item maximum, never the sum (snapshots, not deltas)', () => {
    // Same physical stickers tracked on two devices must not double-count.
    expect(mergeHoldings({ 'BRA-01': 2 }, { 'BRA-01': 2 })).toEqual({ 'BRA-01': 2 });
    expect(mergeHoldings({ 'BRA-01': 3 }, { 'BRA-01': 1 })).toEqual({ 'BRA-01': 3 });
    expect(mergeHoldings({ 'BRA-01': 1 }, { 'BRA-01': 4 })).toEqual({ 'BRA-01': 4 });
  });

  it('unions items present on only one side', () => {
    expect(mergeHoldings({ A: 1 }, { B: 2 })).toEqual({ A: 1, B: 2 });
  });

  it('drops zero/negative/invalid counts from the result', () => {
    expect(mergeHoldings({ A: 0 }, { A: 0 })).toEqual({});
    expect(mergeHoldings({ A: -3 }, { B: NaN })).toEqual({});
    expect(mergeHoldings({ A: 0 }, { A: 2 })).toEqual({ A: 2 });
  });

  it('floors fractional counts', () => {
    expect(mergeHoldings({ A: 2.9 }, { A: 1 })).toEqual({ A: 2 });
  });

  it('returns an empty object for two empty inputs and does not mutate inputs', () => {
    const server = { A: 1 };
    const local = { B: 2 };
    const merged = mergeHoldings(server, local);
    expect(merged).not.toBe(server);
    expect(server).toEqual({ A: 1 });
    expect(local).toEqual({ B: 2 });
    expect(mergeHoldings({}, {})).toEqual({});
  });
});
