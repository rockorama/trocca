/**
 * Idempotent seed script: loads the World Cup 2026 catalog into the database.
 * Run with: npm run db:seed (requires DATABASE_URL).
 */
import { getDb } from './index';
import { collections, items } from './schema';
import { buildWorldCup2026 } from './seed-data';
import { eq } from 'drizzle-orm';

async function main() {
  const db = getDb();
  const data = buildWorldCup2026();

  const existing = await db
    .select({ id: collections.id })
    .from(collections)
    .where(eq(collections.slug, data.slug))
    .limit(1);

  if (existing.length > 0) {
    console.log(`Collection "${data.slug}" already seeded — skipping.`);
    return;
  }

  const [collection] = await db
    .insert(collections)
    .values({
      slug: data.slug,
      name: data.name,
      publisher: data.publisher,
      year: data.year,
      isOfficial: true,
    })
    .returning({ id: collections.id });

  await db.insert(items).values(
    data.items.map((item) => ({
      collectionId: collection.id,
      code: item.code,
      name: item.name,
      rarity: item.rarity,
      sortOrder: item.sortOrder,
    })),
  );

  console.log(`Seeded "${data.name}" with ${data.items.length} items.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
