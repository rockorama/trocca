import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

/**
 * Lazily-initialized singleton DB. The connection is only opened on first real
 * use, so importing this module (e.g. from a Server Component tree or a test)
 * never requires a live database or DATABASE_URL to be set.
 */
type Db = PostgresJsDatabase<typeof schema>;

const globalForDb = globalThis as unknown as { __troccaDb?: Db };

function createDb(): Db {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is not set');
  const client = postgres(connectionString, { prepare: false });
  return drizzle(client, { schema });
}

export function getDb(): Db {
  if (!globalForDb.__troccaDb) {
    globalForDb.__troccaDb = createDb();
  }
  return globalForDb.__troccaDb;
}

/** Proxy that defers connection until a property is actually accessed. */
export const db: Db = new Proxy({} as Db, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb(), prop, receiver);
  },
});

export { schema };
