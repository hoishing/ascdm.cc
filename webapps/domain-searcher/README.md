# Domain Searcher

Check domain name availability across all IANA-registered TLDs instantly. Enter a name, see which TLDs are available, and compare registrar pricing.

## Features

- Checks 1500+ TLDs in parallel using DNS-over-HTTPS
- Cloudflare and Google DNS with automatic fallback
- Pricing from multiple registrars (Cloudflare, Porkbun, domainnameapi)
- Filter by availability, price, TLD length, and name
- Sort by status, alphabetical, or price
- Click to copy domain name
- IndexedDB caching for instant repeat searches
- Dark/light theme toggle

## Tech Stack

Astro 5 | React 19 | TailwindCSS 4 | DaisyUI 5 | Bun

## Getting Started

```sh
bun install
bun dev
```

Open http://localhost:4321

## Build

```sh
bun build
bun preview
```

## How It Works

1. **Build time**: TLD list from [IANA](https://data.iana.org/TLD/tlds-alpha-by-domain.txt), pricing merged from Cloudflare/Porkbun/domainnameapi via Astro Content Collections
2. **Runtime**: Batch DNS-over-HTTPS queries (NS records) against Cloudflare and Google DNS — NXDOMAIN means available
3. **Caching**: Results stored in IndexedDB for instant repeat lookups
