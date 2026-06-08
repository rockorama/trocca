/**
 * Collection (album template) persistence: create user/official albums, load one
 * with its catalog, and list the ones a user may see.
 *
 * Visibility model (matches the product decision: verified/global albums plus
 * user-created ones): a user sees official albums, system/global albums
 * (no owner) and their own albums.
 */

import { asc, eq, isNull, or, sql } from 'drizzle-orm';
import type { Db } from './index';
import { collections, items } from './schema';
import type { CatalogItem } from '@/lib/sections';

export interface NewCollectionInput {
  ownerId: string;
  name: string;
  publisher?: string;
  year?: number;
  items: Array<{ code: string; name: string; section?: string; rarity: string; sortOrder: number }>;
}

export interface CollectionSummary {
  slug: string;
  name: string;
  publisher: string | null;
  year: number | null;
  isOfficial: boolean;
  itemCount: number;
  mine: boolean;
}

/** Turn a name into a URL-safe slug base. */
export function slugify(name: string): string {
  return name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // strip combining diacritical marks
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'album';
}

/** Find an unused slug derived from `name` (appends -2, -3, … on collision). */
async function uniqueSlug(db: Db, name: string): Promise<string> {
  const base = slugify(name);
  for (let n = 1; ; n++) {
    const slug = n === 1 ? base : `${base}-${n}`;
    const [hit] = await db
      .select({ id: collections.id })
      .from(collections)
      .where(eq(collections.slug, slug))
      .limit(1);
    if (!hit) return slug;
  }
}

/** Create a user-owned album with its items. Returns the new slug. */
export async function createCollection(db: Db, input: NewCollectionInput): Promise<string> {
  const slug = await uniqueSlug(db, input.name);

  return db.transaction(async (tx) => {
    const [collection] = await tx
      .insert(collections)
      .values({
        slug,
        name: input.name,
        publisher: input.publisher,
        year: input.year,
        isOfficial: false, // verification is an admin action, never self-assigned
        createdById: input.ownerId,
      })
      .returning({ id: collections.id });

    if (input.items.length > 0) {
      await tx.insert(items).values(
        input.items.map((it) => ({
          collectionId: collection.id,
          code: it.code,
          name: it.name,
          rarity: it.rarity,
          section: it.section,
          sortOrder: it.sortOrder,
        })),
      );
    }
    return slug;
  });
}

export interface LoadedCollection {
  slug: string;
  name: string;
  items: CatalogItem[];
}

/** Load a collection and its catalog by slug, ordered for display. */
export async function getCollectionWithItems(
  db: Db,
  slug: string,
): Promise<LoadedCollection | null> {
  const [collection] = await db
    .select({ id: collections.id, slug: collections.slug, name: collections.name })
    .from(collections)
    .where(eq(collections.slug, slug))
    .limit(1);
  if (!collection) return null;

  const rows = await db
    .select({
      code: items.code,
      name: items.name,
      rarity: items.rarity,
      section: items.section,
      sortOrder: items.sortOrder,
    })
    .from(items)
    .where(eq(items.collectionId, collection.id))
    .orderBy(asc(items.sortOrder));

  return {
    slug: collection.slug,
    name: collection.name,
    items: rows.map((r) => ({
      code: r.code,
      name: r.name,
      rarity: r.rarity ?? 'base',
      section: r.section ?? undefined,
      sortOrder: r.sortOrder,
    })),
  };
}

/** Albums visible to a user: official, system/global (no owner), or their own. */
export async function listVisibleCollections(
  db: Db,
  userId: string | null,
): Promise<CollectionSummary[]> {
  const visibility = userId
    ? or(eq(collections.isOfficial, true), isNull(collections.createdById), eq(collections.createdById, userId))
    : or(eq(collections.isOfficial, true), isNull(collections.createdById));

  const rows = await db
    .select({
      slug: collections.slug,
      name: collections.name,
      publisher: collections.publisher,
      year: collections.year,
      isOfficial: collections.isOfficial,
      createdById: collections.createdById,
      itemCount: sql<number>`count(${items.id})::int`,
    })
    .from(collections)
    .leftJoin(items, eq(items.collectionId, collections.id))
    .where(visibility)
    .groupBy(collections.id)
    .orderBy(asc(collections.name));

  return rows.map((r) => ({
    slug: r.slug,
    name: r.name,
    publisher: r.publisher,
    year: r.year,
    isOfficial: r.isOfficial,
    itemCount: r.itemCount,
    mine: Boolean(userId && r.createdById === userId),
  }));
}
