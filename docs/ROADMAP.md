# Trocca — Roadmap & Phases

This is a living document. It records what's built, the phased plan toward the
custody-based exchange, the decisions we've made, and the open risks.

> **Context:** the product started as a P2P-direct trading tracker and **pivoted** to a
> central-custody "sticker bank" exchange (see [PRODUCT.md](./PRODUCT.md)). Some
> already-built pieces (the bilateral trade state machine) are now *secondary*; the
> matching engine is *repurposable* for pool draws.

## Status legend
✅ done · 🟡 in progress / in review · ⬜ not started

---

## Phase 0 — Tracker & catalog foundation  (✅ largely done)
The usable base: track any album, in three languages, with accounts.

- ✅ Generic catalog model (`collections` → `items`), generic enough for any collectible
- ✅ Offline-first collection tracker (localStorage), live progress/extras math
- ✅ i18n (en / pt / es), key-parity enforced by tests
- ✅ Clerk auth + server-side holdings persistence (Neon); offline→account merge on
  sign-in (per-item `max`, never sum)
- ✅ Matching engine (pure, tested) and trade state machine (pure, tested) — **not yet
  wired to UI**
- ✅ DB invariants (CHECK constraints), schema hardening
- 🟡 **Album templates**: create-your-own albums via CSV import + preview; ownership &
  visibility model (PR #1)

## Phase 1 — Concierge pilot  (⬜ next big bet)
**Goal: validate the operation before building the warehouse software.** One album, one
Brazilian city/community. Humans (you) do check-in, matching, and shipping by hand; the
app just tracks inventory + credits.

- ⬜ Deposit orders (declare contents, pay inbound shipping, get a label)
- ⬜ Minimal vault/inventory + credit ledger (manual check-in crediting)
- ⬜ Manual matching + manual outbound shipping
- **Prove:** envelope cost, minutes-per-check-in, shipping margin, fraud rate, and —
  most importantly — **liquidity** (do deposits and draws actually flow?).

## Phase 2 — Core exchange software  (⬜)
Automate what the pilot proved.

- ⬜ QR-coded prepaid deposit intake (scan-to-reconcile declared vs. actual)
- ⬜ Vault/inventory with reservations
- ⬜ Double-entry credit ledger (auditable)
- ⬜ **Tiered-by-rarity valuation** (architected so dynamic pricing can drop in later)
- ⬜ Matching with **Auto / Confirm** modes + a clear allocation policy for contested
  scarce items (e.g. FIFO vs. credit-priority)
- ⬜ Pulls/vault holding + **batched outbound** (≥10, or pay-the-10-rate to pull fewer)
- ⬜ **Wallet + payments** for shipping/handling fees (BR provider — see decisions)

## Phase 3 — Scale & depth  (⬜)
- ⬜ **Dynamic / market valuation** (supply & demand)
- ⬜ **Cross-collection trading** (trade across collectible types via shared value)
- ⬜ Reputation surfacing (ratings already in schema)
- ⬜ Notifications (email; e.g. Resend) for async trade events
- ⬜ More albums & Pokémon cards; additional cities

## Phase 4 — Expansion  (⬜)
- ⬜ Admin tooling: verify/curate albums (`isOfficial`), moderation
- ⬜ Community album submissions
- ⬜ PWA polish, image support for items
- ⬜ Beyond Brazil

---

## Decisions log
| Decision | Choice |
|---|---|
| Fulfillment model | **Central custody** ("sticker bank"), not P2P-direct mailing |
| Settlement | **Credits** for trades; real money only for shipping + wallet |
| Valuation (MVP) | **Tiered by rarity**; dynamic/market later (needed for cross-collection) |
| Outbound shipping | **Batch ≥10**; pull fewer at the 10-item flat rate |
| Trade modes | **Auto** (market) and **Confirm** (limit/approve) |
| Intake | **QR-coded prepaid envelope**, pre-declared; incentivize organized deposits |
| Album creation | Any signed-in user; `isOfficial` = admin-verified/global (no admin UI yet) |
| Auth / Hosting / Stack | Clerk · Vercel + Neon · Next.js 16 + Drizzle + next-intl |

## Risks & open questions
- **Logistics labor economics.** Custody of low-value, high-volume items (penny
  stickers) is the reason no one else does this. The pilot must prove the unit economics.
- **Liquidity cold-start.** An empty pool trades nothing. Mitigation: **launch deep, not
  wide** — one popular album, one city, build density first.
- **Cross-collection valuation.** Tiered rarity works *within* an album but breaks
  *across* collections; needs dynamic or external price feeds. Highest-stakes design.
- **Brazilian regulation & tax.** A points/stored-value ledger may trigger
  payment-institution / stored-value rules (BCB), and barter may have income-tax / nota
  fiscal implications. **Get a legal read before the credit ledger ships.**
- **PII & custody liability (LGPD).** Storing shipping addresses and holding others'
  property (consignment) → consent, minimization, deletion, insurance/loss handling.
- **Auto-mode allocation fairness.** Define who gets a contested scarce item.
- **Working capital.** Prepaid envelopes are mailed before payment clears.

## Known competitors to study
- **TrocarCromos (PT)** — closest prior art: cross-collection auto-matching + rarity
  reference values (no custody, no credits currency).
- **TrocaFigurinhas (BR)** — largest Brazilian sticker platform; tracker + P2P incumbent.

Full landscape with sources: [MARKET-RESEARCH.md](./MARKET-RESEARCH.md).
