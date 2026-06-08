# Trocca — Market Research

**Question:** Does any existing service combine **central custody** (users mail
collectibles in; the company stores them) + **credits/points barter** (not cash) +
**automated matching**, for cards/stickers — globally and in Brazil/LatAm?

**Method:** multi-source web research (2026-06-08), 22 sources fetched, 25 falsifiable
claims extracted and adversarially fact-checked (3-vote; 25/25 confirmed, 0 refuted).

## Verdict — it's a genuine gap
**No service combines all three features.** The market splits into two non-overlapping
camps; the required halves never co-occur.

| Player | Type | Custody | Settlement | Auto-match | Region |
|---|---|:---:|---|:---:|---|
| StockX Vault | Marketplace | ✅ | 💵 cash | — | Global |
| eBay Vault | Marketplace | ✅ | 💵 cash | — | US |
| Alt (alt.xyz) | Marketplace | ✅ | 💵 cash | — | US |
| PWCC / Fanatics Collect | Marketplace/auction | ✅ | 💵 cash | — | US |
| LastSticker | Swap community | ❌ | 🔁 barter | ✅ | Global |
| Stickermanager | Swap community | ❌ | 🔁 barter | ✅ | Global |
| Pokéchange | Swap community | ❌ | 🔁 barter | ✅ | EU |
| **TrocaFigurinhas** | Swap (stickers) | ❌ | 🔁 barter | ✅ | **Brazil** |
| **TradePanini** | Swap (stickers) | ❌ | 🔁 barter | ✅ | **Brazil** |
| **TrocarCromos** | Swap (stickers) | ❌ | 🔁 barter | ✅ | Portugal |

- **Custody platforms are cash-only.** StockX/eBay/Alt/PWCC physically hold inventory
  but settle in money; custody economics only pencil out for **high-value graded cards**
  (eBay Vault has \$250/\$750 thresholds) — which is *why no one takes custody of penny
  stickers*.
- **Barter/matching platforms are pure P2P self-mail.** They match collectors then show
  each other's address; users mail directly. No custody, no tradable credits.

## Closest prior art (study these)
- **TrocarCromos (Portugal)** — conceptually nearest: an algorithm auto-matches
  collectors **within or across all active collections**, supports **cross-collection
  trades in one request**, and assigns each item a **rarity-based reference value**.
  *But* still no custody (users mail trades themselves) and the value is a fairness hint,
  not a spendable currency.
- **TrocaFigurinhas (Brazil)** — the **largest Brazilian sticker platform**, already has
  the **2026 World Cup album**, CEP/location-based matching, reputation points
  (+1 / −5, *not* a tradable currency), correios self-mail. This is the incumbent for the
  tracker + P2P layer.

Also noted: crypto "tokenized card" custody exists (e.g. Collector Crypt), but it's
token/cash, not sticker barter.

## Why the gap exists (analyst inference — medium confidence)
Not a sourced statement of intent, but the market structure strongly implies:
1. **Logistics/labor** of custody for low-value, high-volume items is prohibitive — the
   reason every sticker service is P2P self-mail.
2. **Cross-collection valuation** is hard (TrocarCromos' rarity value is the only attempt
   seen).
3. **Liquidity cold-start** — free P2P sites avoid it by never holding inventory or
   pricing.

These are exactly Trocca's hard problems; the opportunity *is* the hard part.

## Implications for Trocca
- **Don't compete on tracking** — it's already served in Brazil. Compete on
  **custody → instant trades + credits**.
- **Borrow** TrocarCromos' cross-collection matching + rarity-value approach.
- **De-risk operations first** (concierge pilot) before building the warehouse software.
- **Check Brazilian stored-value/barter regulation early** — flagged as an open question.

## Caveats
- Some primary sites (laststicker.com, trocarcromos.com) returned HTTP 403 to automated
  fetches; those claims rest on search-indexed snippets + corroborating sources —
  adequate for "how the site works," not independently audited.
- Several feature claims rely partly on companies' own marketing copy (appropriate for
  low-stakes descriptive claims, but self-reported).
- The "reasons for the gap" finding is inference from market structure, not a sourced
  quote (medium confidence).
- Broad but not exhaustive; niche/new LatAm apps may exist outside the searched set.
- Time-sensitivity: PWCC rebranded to **Fanatics Collect** (Jul 2024); StockX's Vault-NFT
  program was curtailed amid the Nike lawsuit (the custody mechanic as launched was real).

## Open questions worth following up
- Has anyone attempted custody **specifically for low-value stickers** (vs. graded cards)
  and failed — is the gap *unattempted* or *attempted-and-abandoned*?
- Could **aggregated/hub custody** (bulk-shipping matched lots) make sticker custody
  economical?
- What Brazilian regulatory/tax treatment would a points/credit barter ledger trigger?
- Is TrocarCromos' rarity reference value evolving toward a true credits ledger?

## Sources
- StockX Vault — https://stockx.com/about/stockx-launches-vault-nfts/
- eBay Vault (fees) — https://pages.ebay.com/vault/fees/
- eBay Vault (launch) — https://www.ebayinc.com/stories/news/ebay-launches-its-vault-for-trading-cards/
- Alt — https://alt.xyz/
- PWCC / Fanatics Collect — https://www.pwccmarketplace.com/vault-marketplace
- LastSticker — https://www.laststicker.com/
- Stickermanager — https://www.stickermanager.com/en/faq
- Pokéchange — https://en.pokechange.net/matching
- TrocaFigurinhas — https://trocafigurinhas.com/
- TradePanini — https://www.tradepanini.com.br/
- TrocarCromos — https://www.trocarcromos.com/
