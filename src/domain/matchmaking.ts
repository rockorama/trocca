/**
 * Matchmaking engine — the headline feature.
 *
 * Given the current user's trading profile (what they need and what spare copies
 * they can offer) and a pool of other users' profiles, find mutually-beneficial
 * trade partners and rank them so the best swaps surface first.
 *
 * A *mutual* match exists between me and another trader when:
 *   - they hold spare copies of items I need   (they give me), AND
 *   - I hold spare copies of items they need    (I give them).
 *
 * One-way overlaps (they want my stuff but have nothing I need, or vice-versa)
 * are not real trades and are excluded by default.
 *
 * Pure and deterministic: identical inputs always produce identical output,
 * including a stable tie-break on user id so ordering never flickers.
 */

export interface TraderProfile {
  userId: string;
  /** Item ids this trader is missing and wants. */
  wants: Iterable<string>;
  /** Item ids this trader has spare copies of and can give away. */
  offers: Iterable<string>;
  /** Country code, used to prefer cheaper/faster domestic shipping. */
  country?: string;
  /** Finer-grained locality (state/city) within a country. */
  region?: string;
  /** Reputation score, higher is better (e.g. 0..5). Defaults to 0. */
  reputation?: number;
}

export interface Match {
  userId: string;
  /** Items the counterpart can give me (their offers ∩ my wants), sorted. */
  theyGiveMe: string[];
  /** Items I can give the counterpart (my offers ∩ their wants), sorted. */
  iGiveThem: string[];
  /** Size of a fair 1:1 swap = min(theyGiveMe, iGiveThem). */
  balancedSize: number;
  /** Total tradeable items across both directions. */
  totalOverlap: number;
  sameCountry: boolean;
  sameRegion: boolean;
  reputation: number;
}

export interface MatchOptions {
  /**
   * Minimum balanced swap size to qualify as a match. Default 1 (require a real
   * two-way trade). Set to 0 to also surface one-directional overlaps.
   */
  minBalancedSize?: number;
  /** Cap the number of returned matches. */
  limit?: number;
}

function intersectionSorted(a: Set<string>, b: ReadonlySet<string>): string[] {
  // Iterate the smaller set for efficiency.
  const [small, large] = a.size <= b.size ? [a, b] : [b, a];
  const out: string[] = [];
  for (const id of small) {
    if (large.has(id)) out.push(id);
  }
  return out.sort();
}

/**
 * Comparator implementing the ranking policy. Returns <0 if `a` should rank
 * before `b`. Priority order:
 *   1. larger balanced (fair) swap
 *   2. same region (cheapest shipping)
 *   3. same country
 *   4. higher reputation
 *   5. larger total overlap
 *   6. user id ascending (deterministic tie-break)
 */
function compareMatches(a: Match, b: Match): number {
  if (a.balancedSize !== b.balancedSize) return b.balancedSize - a.balancedSize;
  if (a.sameRegion !== b.sameRegion) return a.sameRegion ? -1 : 1;
  if (a.sameCountry !== b.sameCountry) return a.sameCountry ? -1 : 1;
  if (a.reputation !== b.reputation) return b.reputation - a.reputation;
  if (a.totalOverlap !== b.totalOverlap) return b.totalOverlap - a.totalOverlap;
  return a.userId < b.userId ? -1 : a.userId > b.userId ? 1 : 0;
}

/** Find and rank mutual trade matches for `me` among `others`. */
export function findMatches(
  me: TraderProfile,
  others: Iterable<TraderProfile>,
  options: MatchOptions = {},
): Match[] {
  const minBalancedSize = options.minBalancedSize ?? 1;
  const myWants = new Set(me.wants);
  const myOffers = new Set(me.offers);

  const matches: Match[] = [];

  for (const other of others) {
    if (other.userId === me.userId) continue; // never match with self

    const otherOffers = new Set(other.offers);
    const otherWants = new Set(other.wants);

    const theyGiveMe = intersectionSorted(myWants, otherOffers);
    const iGiveThem = intersectionSorted(myOffers, otherWants);

    const balancedSize = Math.min(theyGiveMe.length, iGiveThem.length);
    if (balancedSize < minBalancedSize) continue;

    matches.push({
      userId: other.userId,
      theyGiveMe,
      iGiveThem,
      balancedSize,
      totalOverlap: theyGiveMe.length + iGiveThem.length,
      sameCountry: me.country !== undefined && me.country === other.country,
      sameRegion: me.region !== undefined && me.region === other.region,
      reputation: other.reputation ?? 0,
    });
  }

  matches.sort(compareMatches);
  return options.limit !== undefined ? matches.slice(0, options.limit) : matches;
}
