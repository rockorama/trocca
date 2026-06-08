<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Trocca — agent & contributor guide

Trocca is a multilingual platform to **track any collection and trade your extras**,
evolving toward a **custody-based trading exchange** (a "sticker bank"). Read the product
context before designing features:

- [docs/PRODUCT.md](./docs/PRODUCT.md) — vision & the custody/credit model
- [docs/ROADMAP.md](./docs/ROADMAP.md) — phases, decisions log, risks
- [docs/MARKET-RESEARCH.md](./docs/MARKET-RESEARCH.md) — competitive landscape (cited)

## Stack
- **Next.js 16** (App Router, Turbopack) — ⚠️ see the warning above; **Middleware is
  renamed "Proxy"** (`src/proxy.ts`).
- **TypeScript** (strict) · **Tailwind CSS v4**
- **Drizzle ORM + PostgreSQL** (Neon in production)
- **Clerk** for auth · **next-intl** for i18n (en / pt / es)
- **Vitest** (+ Testing Library / happy-dom) for tests

## Commands
```bash
npm run dev        # local dev (uses .env)
npm test           # vitest run — keep green
npm run lint       # eslint — keep clean
npm run build      # production build — must pass WITH and WITHOUT secrets
npm run db:generate  # generate a migration from schema changes
npm run db:migrate   # apply migrations (drizzle-kit reads .env)
npm run db:seed      # seed demo data — NOTE: load env explicitly:
                     # node --env-file=.env ./node_modules/.bin/tsx src/db/seed.ts
```

## Repository layout & layering
```
src/
  app/[locale]/        # routes (App Router); locale-prefixed
  components/          # React components (client where needed)
  domain/              # PURE business logic — no I/O, fully unit-tested
  db/                  # schema + repositories (Drizzle); I/O only
  lib/                 # helpers, hooks, server actions (lib/actions/*)
  i18n/                # next-intl routing/navigation/request config
  proxy.ts            # the "middleware" (Next 16 name) — intl + Clerk
messages/              # en.json / pt.json / es.json (key-parity enforced)
drizzle/               # generated SQL migrations (committed)
docs/                  # product, roadmap, research
```
**Dependency direction:** `app`/`components` → `lib`/`db` → `domain`. Keep `domain` pure
and dependency-free so rules stay exhaustively testable.

## Conventions (please follow)
- **Test the logic.** Business rules live in `src/domain/*` as pure functions with
  thorough Vitest coverage. Add tests with every change; `npm test`, `lint`, `build`
  must all pass before a PR.
- **Progressive enhancement / graceful degradation.** Features gate on env via flags in
  `src/lib/auth.ts` (`clerkEnabled`, and the same pattern for the DB). **The app must
  build and run with NO secrets** (offline tracker, localStorage) so CI and previews work
  without credentials. Don't break that property.
- **i18n parity.** Every user-facing string is a message key present in **all three**
  locales with matching ICU placeholders (a test enforces this). Don't hardcode copy.
- **Catalog content is data, not string-parsing.** Group items by the explicit `section`
  field — never by parsing the item `name` (it must work for arbitrary, localized
  catalogs).
- **Holdings are snapshots, not deltas.** When merging holdings (e.g. offline → account
  on sign-in), take the per-item **`max`**, never the sum.
- **Enforce authorization at the source.** Visibility/ownership checks belong in the
  shared query path (so a known slug/id can't bypass list-level rules), not only in the
  UI. Validate and **cap server-action inputs** — actions are callable directly.
- **DB invariants in the DB.** Express basic guarantees as CHECK constraints / unique
  indexes in `schema.ts`, in addition to app logic.

## Environment
Copy `.env.example` → `.env` and fill in. Keys: `DATABASE_URL` (Neon — use the **pooled**
host; the client sets `prepare:false` for PgBouncer), `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`,
`CLERK_SECRET_KEY`. **Never commit `.env`** (it's gitignored).

## Working agreement
- The default branch is `main`. **Branch for changes**, open a PR, don't commit secrets.
- Commit messages and PR descriptions are plain and authored — **no tool/agent
  attribution footers**, no `Co-Authored-By` trailers.
- Changes are reviewed before merge (Claude + Codex collaborate in the task channel).
- Don't touch `.uai/` — it's task scaffolding, not part of the project.
