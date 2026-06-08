/**
 * Seed catalog generator for the FIFA World Cup 2026 album.
 *
 * This produces a *plausible, well-structured* catalog so the platform is usable
 * on day one. It is intentionally generated (not a hand-transcribed official
 * checklist) — production catalogs are expected to be imported via the admin CSV
 * importer. Keeping it pure makes the shape easy to unit-test.
 */

export interface SeedItem {
  code: string;
  name: string;
  rarity: string;
  /** Explicit grouping key for the tracker UI (e.g. the team name). */
  section?: string;
  sortOrder: number;
}

export interface SeedCollection {
  slug: string;
  name: string;
  publisher: string;
  year: number;
  items: SeedItem[];
}

/** 48 participating nations (3 hosts auto-qualified; rest are representative). */
export const WC2026_TEAMS: ReadonlyArray<{ code: string; name: string }> = [
  { code: 'CAN', name: 'Canada' },
  { code: 'MEX', name: 'Mexico' },
  { code: 'USA', name: 'United States' },
  { code: 'ARG', name: 'Argentina' },
  { code: 'BRA', name: 'Brazil' },
  { code: 'URU', name: 'Uruguay' },
  { code: 'COL', name: 'Colombia' },
  { code: 'ECU', name: 'Ecuador' },
  { code: 'PAR', name: 'Paraguay' },
  { code: 'FRA', name: 'France' },
  { code: 'ENG', name: 'England' },
  { code: 'ESP', name: 'Spain' },
  { code: 'GER', name: 'Germany' },
  { code: 'POR', name: 'Portugal' },
  { code: 'NED', name: 'Netherlands' },
  { code: 'ITA', name: 'Italy' },
  { code: 'BEL', name: 'Belgium' },
  { code: 'CRO', name: 'Croatia' },
  { code: 'SUI', name: 'Switzerland' },
  { code: 'DEN', name: 'Denmark' },
  { code: 'AUT', name: 'Austria' },
  { code: 'POL', name: 'Poland' },
  { code: 'SRB', name: 'Serbia' },
  { code: 'TUR', name: 'Türkiye' },
  { code: 'UKR', name: 'Ukraine' },
  { code: 'SWE', name: 'Sweden' },
  { code: 'WAL', name: 'Wales' },
  { code: 'SCO', name: 'Scotland' },
  { code: 'JPN', name: 'Japan' },
  { code: 'KOR', name: 'South Korea' },
  { code: 'AUS', name: 'Australia' },
  { code: 'IRN', name: 'Iran' },
  { code: 'KSA', name: 'Saudi Arabia' },
  { code: 'QAT', name: 'Qatar' },
  { code: 'JOR', name: 'Jordan' },
  { code: 'UZB', name: 'Uzbekistan' },
  { code: 'MAR', name: 'Morocco' },
  { code: 'SEN', name: 'Senegal' },
  { code: 'TUN', name: 'Tunisia' },
  { code: 'ALG', name: 'Algeria' },
  { code: 'EGY', name: 'Egypt' },
  { code: 'NGA', name: 'Nigeria' },
  { code: 'GHA', name: 'Ghana' },
  { code: 'CIV', name: "Côte d'Ivoire" },
  { code: 'CMR', name: 'Cameroon' },
  { code: 'RSA', name: 'South Africa' },
  { code: 'NZL', name: 'New Zealand' },
  { code: 'CRC', name: 'Costa Rica' },
];

/** Host cities get a commemorative sticker each. */
export const WC2026_HOST_CITIES: readonly string[] = [
  'Atlanta',
  'Boston',
  'Dallas',
  'Guadalajara',
  'Houston',
  'Kansas City',
  'Los Angeles',
  'Mexico City',
  'Miami',
  'Monterrey',
  'New York New Jersey',
  'Philadelphia',
  'San Francisco Bay Area',
  'Seattle',
  'Toronto',
  'Vancouver',
];

const PLAYERS_PER_TEAM = 18;

/**
 * Build the full WC 2026 seed collection. Layout:
 *   - intro specials (logo, trophy, mascot)
 *   - per team: 1 badge sticker + 18 player slots
 *   - host-city commemoratives
 * Codes are stable and album-like, e.g. "BRA-01", "CITY-Miami", "FWC-LOGO".
 */
export function buildWorldCup2026(): SeedCollection {
  const items: SeedItem[] = [];
  let order = 0;

  const push = (code: string, name: string, rarity: string, section?: string) => {
    items.push({ code, name, rarity, section, sortOrder: order++ });
  };

  push('FWC-LOGO', 'Official Emblem', 'special');
  push('FWC-TROPHY', 'FIFA World Cup Trophy', 'special');
  push('FWC-MASCOT', 'Official Mascots', 'special');

  for (const team of WC2026_TEAMS) {
    push(`${team.code}-BADGE`, `${team.name} — Team Badge`, 'badge', team.name);
    for (let n = 1; n <= PLAYERS_PER_TEAM; n++) {
      const num = String(n).padStart(2, '0');
      push(`${team.code}-${num}`, `${team.name} — Player ${n}`, 'base', team.name);
    }
  }

  for (const city of WC2026_HOST_CITIES) {
    const slug = city.replace(/\s+/g, '-');
    push(`CITY-${slug}`, `Host City — ${city}`, 'city');
  }

  return {
    slug: 'world-cup-2026',
    name: 'FIFA World Cup 2026',
    publisher: 'Trocca Community',
    year: 2026,
    items,
  };
}
