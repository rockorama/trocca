# Trocca — Product Vision

> Complete any collection; trade your extras with the whole community at once.

## The problem
Collecting sticker albums (Panini World Cup) and trading cards (Pokémon) is huge —
especially in Brazil — but **completing an album is hard if you're not in a big
city**. Finding someone with the sticker you need *and* who wants one of yours, then
trusting them to mail it, is slow and full of friction.

## The core idea: a custody-based trading exchange ("StockX, but for barter")
Instead of peer-to-peer mailing between strangers, Trocca acts as a **central hub**:

1. **Deposit** — a collector mails their extras to Trocca in a prepaid, **QR-coded**
   envelope (the QR ties the physical package to their declared order). They pay the
   inbound shipping.
2. **Check-in** — Trocca validates the contents and **credits** the collector's
   account; the stickers enter the shared **pool/vault**.
3. **Trade instantly** — because the goods are already in the pool, trades are
   **digital and immediate**. No coordinating with a stranger, no "did they really
   ship?" risk. Collectors **draw** what they're missing from the pool.
4. **Batch ship** — pulled items accumulate in the collector's vault and ship out in
   **batches of ~10** (you can pull fewer, but pay the 10-item shipping rate). Return
   shipping is paid by the collector.
5. **Claim back** — anything you deposited that hasn't been traded can be reclaimed.

This collapses the bilateral-match constraint: you trade with the **entire community
at once**, not one matched counterpart.

### Why it works as a business
Trocca **monetizes the logistics, not the goods** — it gets paid to *sort, ship, and
store*. Revenue is the shipping spread plus handling/storage. The trades themselves are
**credit-based barter**; real money only enters for **shipping and the wallet**.

## Key concepts
- **Pool / Vault** — the central inventory of deposited items Trocca holds.
- **Credit ledger** — every item has a **value**; depositing earns credits, drawing
  spends them. A double-entry, auditable ledger.
- **Valuation** — starts **tiered by rarity** (MVP), evolves toward **dynamic,
  supply/demand pricing** (the StockX-style endgame). Valuation is *load-bearing*
  because it must be credible **across collections**.
- **Cross-collection trading** — because every item has a credit value, a Pokémon card
  can ultimately be traded for World Cup stickers. The data model is already generic
  (`collections` → `items`), so this is structurally cheap; the hard part is fair value.
- **Auto vs. Confirm mode** — like a market order vs. a limit order:
  - **Auto** — the system finds and executes trades on the collector's behalf
    (max liquidity).
  - **Confirm** — when someone wants the collector's card, the owner approves first
    (max control).

## Differentiation (validated by market research)
The combination of **central custody + points/credit barter + automated matching** does
**not exist** as a product today (see [MARKET-RESEARCH.md](./MARKET-RESEARCH.md)). The
market splits into custody-but-cash marketplaces (StockX/eBay Vault) and
barter-but-self-mail communities (LastSticker, TrocaFigurinhas). Trocca's wedge is the
unoccupied middle: **custody → instant, trust-free trades + a credit economy**.

Tracking alone is *not* a differentiator — Brazil's tracker/P2P layer is already served
(TrocaFigurinhas). The custody/instant experience is the moat.

## Non-goals (for now)
- Not a cash marketplace; no buying/selling stickers for money (only shipping is paid).
- No triangular/multi-party trade routing in the MVP (bilateral/pool draws first).
- No cross-border shipping initially (single-country economics first).

## Principles
- **Works for any collection.** The catalog model is generic from day one.
- **Multilingual.** Portuguese (pt-BR), English, Spanish — UI and catalog content.
- **Offline-first tracking.** The collection tracker works without an account; signing
  in adds sync + trading.
- **Validate operations before automating them.** The logistics are the hard part — see
  the concierge pilot in [ROADMAP.md](./ROADMAP.md).

## Open product decisions
See the decisions log and open questions in [ROADMAP.md](./ROADMAP.md#decisions-log) and
the risks section there. The biggest unresolved items: **cross-collection valuation**,
**liquidity cold-start**, and **Brazilian stored-value / barter-tax regulation**.
