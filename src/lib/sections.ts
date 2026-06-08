/**
 * Display grouping for a catalog: split a flat item list into ordered sections
 * (specials, per-team groups, host cities) for a scannable tracker UI. Pure so
 * the grouping is unit-testable independent of React.
 */

export interface CatalogItem {
  code: string;
  name: string;
  rarity: string;
  /**
   * Explicit grouping key (e.g. a team name). When present it drives sectioning
   * directly; otherwise we fall back to the legacy heuristic of reading the text
   * before an en-dash in `name`. Prefer setting this so grouping survives
   * arbitrary and localized catalogs.
   */
  section?: string;
  sortOrder: number;
}

export type SectionKind = 'specials' | 'team' | 'cities';

export interface Section {
  /** Stable identifier for the group (e.g. "specials", "Brazil"). */
  id: string;
  kind: SectionKind;
  /** Team name for team sections; empty for specials/cities (UI translates). */
  label: string;
  items: CatalogItem[];
}

/**
 * Legacy fallback when an item carries no explicit `section`: derive the group
 * from the text before an en-dash in the name. Catalogs should set `section`
 * instead so grouping doesn't depend on name formatting or language.
 */
function teamLabel(name: string): string {
  const idx = name.indexOf('—');
  return idx === -1 ? name.trim() : name.slice(0, idx).trim();
}

/**
 * Group items into ordered sections, preserving first-seen order both for the
 * sections themselves and the items within them.
 */
export function groupBySection(items: CatalogItem[]): Section[] {
  const order: string[] = [];
  const byId = new Map<string, Section>();

  const ensure = (id: string, kind: SectionKind, label: string): Section => {
    let section = byId.get(id);
    if (!section) {
      section = { id, kind, label, items: [] };
      byId.set(id, section);
      order.push(id);
    }
    return section;
  };

  for (const item of items) {
    if (item.rarity === 'special') {
      ensure('specials', 'specials', '').items.push(item);
    } else if (item.rarity === 'city') {
      ensure('cities', 'cities', '').items.push(item);
    } else {
      const label = item.section ?? teamLabel(item.name);
      ensure(label, 'team', label).items.push(item);
    }
  }

  return order.map((id) => byId.get(id)!);
}
