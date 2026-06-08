# Trocca

**Complete any collection, trade with anyone.**

Trocca helps collectors track any album/collection, mark their spare copies, and
get matched with people who complete each other's collections — then trade safely
by mail with a built-in trust workflow. Multi-language from day one: 🇧🇷 Portuguese,
🇬🇧 English, 🇪🇸 Spanish.

> Born from the world-cup-sticker problem: trading is easy in big cities and hard
> everywhere else. The hard part isn't the mail — it's _finding the right person_.
> Trocca's matchmaking engine is the answer.

## Why it's different

- **Any collection** — stickers, trading cards, coins. If it has a checklist, you can track it.
- **Smart matchmaking** — pairs you with traders who want your spares _and_ own what you're missing, ranked by swap size, locality (cheaper shipping), and reputation.
- **Safe swaps** — a trade state machine where both parties ship, confirm receipt, and rate each other. You can't confirm receipt before your counterpart has shipped.

## Architecture

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript |
| Styling | Tailwind CSS |
| i18n | `next-intl` (PT / EN / ES, URL-prefixed) |
| Database | PostgreSQL via Drizzle ORM |
| Tests | Vitest |

### The domain core (`src/domain/`)

Framework-free, side-effect-free, exhaustively unit-tested business rules — the
part worth getting exactly right:

- **`collection.ts`** — holdings math: owned / missing / spares / completion %.
- **`matchmaking.ts`** — the mutual-match finder and ranking policy.
- **`trade.ts`** — the trade state machine (`applyTradeEvent`) with the trust rules.

### Data model (`src/db/schema.ts`)

`collections → items`, a per-user holdings ledger (`user_items.count`), `trades`
with shipping/receipt flags mirroring the state machine, `trade_items`, and
`ratings` feeding reputation.

## Getting started

```bash
npm install
npm test            # run the full unit suite
npm run dev         # http://localhost:3000  → redirects to /en

# Database (needs DATABASE_URL in .env)
npm run db:generate # generate SQL migrations from the schema
npm run db:migrate  # apply migrations
npm run db:seed     # load the FIFA World Cup 2026 catalog
```

## Roadmap

1. **MVP (in progress):** auth, collection tracking + spares, matchmaking, P2P trade flow + ratings.
2. **Next:** in-app messaging & notifications, optional escrow for high-value items, community-submitted catalogs with moderation, native mobile app.

## Trade model

Trocca uses **direct peer-to-peer trading backed by a trust layer** (ship →
confirm → rate, with reputation and dispute handling). A host-escrow/mail-hub
model — both parties ship to Trocca, which verifies and forwards — is on the
roadmap as an _optional_ upgrade for higher-value trades, since routing every
cheap-sticker swap through a hub doesn't scale.
