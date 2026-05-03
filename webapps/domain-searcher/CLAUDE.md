# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `bun install` — install dependencies
- `bun dev` — start dev server at localhost:4321
- `bun build` — production build to `./dist/`
- `bun preview` — preview production build locally

## Architecture

Pure frontend Astro app with React for interactivity. No backend — DNS queries run client-side via public DoH APIs.

**Build-time data loading** via Astro Content Collections (`src/content.config.ts`):
- TLD list fetched from IANA (excludes IDN/XN-- entries)
- Domain pricing fetched from multiple registrars and merged (Cloudflare at-cost as primary, Porkbun and domainnameapi as supplementary)

**Client-side search flow** (`src/components/DomainSearcher.tsx`):
1. User enters domain name → validates input
2. Checks IndexedDB cache for previous results
3. If miss, runs batch DNS lookup across all TLDs
4. Results stream in via callback as each check completes

**DNS checking** (`src/lib/dns.ts` + `src/lib/batch.ts`):
- DNS-over-HTTPS (DoH) with NS record queries
- Primary: Cloudflare DNS, fallback: Google DNS
- 10 concurrent workers, alternating between providers
- NXDOMAIN (Status 3) = available, otherwise taken
- Popular TLDs (.com, .io, .dev, etc.) checked first

**Caching** (`src/lib/cache.ts`):
- IndexedDB v2 with `searches` and `prices` object stores
- Client-side price refresh via `fetchFreshPrices()` (cfdomainpricing.com only — it's the only CORS-friendly source)

**Results UI** (`src/components/ResultsGrid.tsx` + `DomainCard.tsx`):
- Filter by status (available/taken/error), pricing availability, TLD length, TLD name
- Sort by status, alphabetical, price
- Click card to copy domain to clipboard

## Pricing Data Sources

Build-time sources (fetched in `content.config.ts`, no CORS needed):
- **cfdomainpricing.com** — Cloudflare at-cost pricing (~407 TLDs), preferred when available
- **Porkbun API** — `POST https://api.porkbun.com/api/json/v3/pricing/get` with `{}` body (~899 TLDs)
- **domainnameapi.com** — `GET https://rest-api.domainnameapi.com/tld/list` (~844 TLDs)

Client-side refresh (`cache.ts`): cfdomainpricing.com only (CORS `*` header).

Merge priority: Cloudflare > Porkbun > domainnameapi (Cloudflare has lowest at-cost prices).

## Stack

Astro 5 + React 19 + TailwindCSS 4 + DaisyUI 5. Vite bundler. Bun package manager.
