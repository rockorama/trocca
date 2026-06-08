/**
 * Database schema (PostgreSQL via Drizzle ORM).
 *
 * Design notes:
 *  - A `collection` is a generic catalog of `item`s, so the platform works for
 *    ANY album/collectible, not just one specific World Cup.
 *  - `user_item` is the user's holdings ledger: one row per (user, item) with a
 *    `count`. count 0 = wanted, count >= 2 = has spares to trade.
 *  - A `trade` references the two parties and carries the shipping/receipt flags
 *    that back the trust state machine in src/domain/trade.ts.
 *  - `trade_item` lists what flows in each direction.
 *  - `rating` powers the reputation used by the matchmaking ranking.
 */

import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  uniqueIndex,
  index,
  primaryKey,
} from 'drizzle-orm/pg-core';

export const localeEnum = pgEnum('locale', ['en', 'pt', 'es']);

export const tradeStatusEnum = pgEnum('trade_status', [
  'proposed',
  'accepted',
  'completed',
  'declined',
  'cancelled',
  'disputed',
]);

/** Which side of a trade an item flows from. */
export const tradeDirectionEnum = pgEnum('trade_direction', [
  'proposer_gives',
  'responder_gives',
]);

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  locale: localeEnum('locale').notNull().default('en'),
  country: text('country'), // ISO 3166-1 alpha-2, e.g. "BR"
  region: text('region'), // free-form locality within a country, e.g. "SP"
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const collections = pgTable('collections', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  publisher: text('publisher'),
  year: integer('year'),
  /** Official/verified catalog vs. community-submitted. */
  isOfficial: boolean('is_official').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const items = pgTable(
  'items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    collectionId: uuid('collection_id')
      .notNull()
      .references(() => collections.id, { onDelete: 'cascade' }),
    /** Human-facing code within the album, e.g. "1", "FWC", "MESSI-10". */
    code: text('code').notNull(),
    name: text('name').notNull(),
    rarity: text('rarity'), // e.g. "base", "shiny", "legend"
    sortOrder: integer('sort_order').notNull().default(0),
  },
  (t) => [uniqueIndex('items_collection_code_idx').on(t.collectionId, t.code)],
);

export const userItems = pgTable(
  'user_items',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    itemId: uuid('item_id')
      .notNull()
      .references(() => items.id, { onDelete: 'cascade' }),
    count: integer('count').notNull().default(0),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.itemId] }),
    index('user_items_item_idx').on(t.itemId),
  ],
);

export const trades = pgTable(
  'trades',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    proposerId: uuid('proposer_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    responderId: uuid('responder_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    status: tradeStatusEnum('status').notNull().default('proposed'),
    proposerShipped: boolean('proposer_shipped').notNull().default(false),
    responderShipped: boolean('responder_shipped').notNull().default(false),
    proposerReceived: boolean('proposer_received').notNull().default(false),
    responderReceived: boolean('responder_received').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('trades_proposer_idx').on(t.proposerId),
    index('trades_responder_idx').on(t.responderId),
  ],
);

export const tradeItems = pgTable(
  'trade_items',
  {
    tradeId: uuid('trade_id')
      .notNull()
      .references(() => trades.id, { onDelete: 'cascade' }),
    itemId: uuid('item_id')
      .notNull()
      .references(() => items.id, { onDelete: 'cascade' }),
    direction: tradeDirectionEnum('direction').notNull(),
  },
  (t) => [primaryKey({ columns: [t.tradeId, t.itemId, t.direction] })],
);

export const ratings = pgTable(
  'ratings',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tradeId: uuid('trade_id')
      .notNull()
      .references(() => trades.id, { onDelete: 'cascade' }),
    raterId: uuid('rater_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    rateeId: uuid('ratee_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    /** 1..5 stars. */
    score: integer('score').notNull(),
    comment: text('comment'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // One rating per rater per trade.
    uniqueIndex('ratings_trade_rater_idx').on(t.tradeId, t.raterId),
    index('ratings_ratee_idx').on(t.rateeId),
  ],
);

export type User = typeof users.$inferSelect;
export type Collection = typeof collections.$inferSelect;
export type Item = typeof items.$inferSelect;
export type UserItem = typeof userItems.$inferSelect;
export type Trade = typeof trades.$inferSelect;
