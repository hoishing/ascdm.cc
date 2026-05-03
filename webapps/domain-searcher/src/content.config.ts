import { defineCollection, z } from "astro:content";
import type { PriceSource, TldType } from "./lib/types";

async function fetchIanaTypes(): Promise<Record<string, string>> {
  const res = await fetch("https://www.iana.org/domains/root/db");
  const html = await res.text();
  const types: Record<string, string> = {};
  // Parse table rows: <td><a href="...">.<tld></a></td><td><type></td>
  const rowRe = /<tr[^>]*>[\s\S]*?<a[^>]*>\.([^<]+)<\/a>[\s\S]*?<td>\s*([\w-]+)\s*<\/td>/g;
  let match;
  while ((match = rowRe.exec(html)) !== null) {
    types[match[1].toLowerCase()] = match[2].toLowerCase();
  }
  return types;
}

async function fetchBrandTlds(): Promise<Set<string>> {
  const res = await fetch(
    "https://www.icann.org/resources/registries/gtlds/v2/gtlds.json"
  );
  const data: {
    gTLDs: Array<{
      gTLD: string;
      specification13: boolean | null;
      contractTerminated: boolean;
    }>;
  } = await res.json();
  const brands = new Set<string>();
  for (const entry of data.gTLDs) {
    if (entry.specification13 === true && !entry.contractTerminated) {
      brands.add(entry.gTLD.toLowerCase());
    }
  }
  return brands;
}

function classifyTld(
  tld: string,
  ianaTypes: Record<string, string>,
  brandTlds: Set<string>
): TldType {
  if (brandTlds.has(tld)) return "brand";
  const ianaType = ianaTypes[tld];
  if (ianaType === "country-code") return "country";
  if (ianaType === "sponsored" || ianaType === "infrastructure") return "sponsored";
  return "generic";
}

const tlds = defineCollection({
  loader: async () => {
    const [tldListRes, ianaTypes, brandTlds] = await Promise.all([
      fetch("https://data.iana.org/TLD/tlds-alpha-by-domain.txt").then((r) =>
        r.text()
      ),
      fetchIanaTypes(),
      fetchBrandTlds(),
    ]);

    const entries = tldListRes
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("#") && !l.startsWith("XN--"))
      .map((tld) => tld.toLowerCase());

    return entries.map((tld) => ({
      id: tld,
      tld,
      type: classifyTld(tld, ianaTypes, brandTlds),
    }));
  },
  schema: z.object({
    tld: z.string(),
    type: z.enum(["generic", "country", "sponsored", "brand"]),
  }),
});

interface RawPrice {
  registration: number;
  renewal: number;
  source: PriceSource;
}

async function fetchCloudflare(): Promise<Record<string, RawPrice>> {
  const res = await fetch("https://cfdomainpricing.com/prices.json");
  const data: Record<string, { registration: number; renewal: number }> =
    await res.json();
  const prices: Record<string, RawPrice> = {};
  for (const [tld, price] of Object.entries(data)) {
    prices[tld.toLowerCase()] = {
      registration: price.registration,
      renewal: price.renewal,
      source: "cloudflare",
    };
  }
  return prices;
}

async function fetchPorkbun(): Promise<Record<string, RawPrice>> {
  const res = await fetch(
    "https://api.porkbun.com/api/json/v3/pricing/get",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    }
  );
  const data: {
    status: string;
    pricing: Record<
      string,
      { registration: string; renewal: string }
    >;
  } = await res.json();
  const prices: Record<string, RawPrice> = {};
  if (data.status === "SUCCESS" && data.pricing) {
    for (const [tld, price] of Object.entries(data.pricing)) {
      const reg = parseFloat(price.registration);
      const ren = parseFloat(price.renewal);
      if (!isNaN(reg) && !isNaN(ren)) {
        prices[tld.toLowerCase()] = {
          registration: reg,
          renewal: ren,
          source: "porkbun",
        };
      }
    }
  }
  return prices;
}

async function fetchDomainnameapi(): Promise<Record<string, RawPrice>> {
  const res = await fetch("https://rest-api.domainnameapi.com/tld/list");
  const data: {
    tlds: Array<{
      tld: string;
      pricing: {
        registration: Record<string, string>;
        renew: Record<string, string>;
      };
    }>;
  } = await res.json();
  const prices: Record<string, RawPrice> = {};
  if (data.tlds) {
    for (const entry of data.tlds) {
      const tld = entry.tld.replace(/^\./, "").toLowerCase();
      const reg = parseFloat(entry.pricing?.registration?.["1"]);
      const ren = parseFloat(entry.pricing?.renew?.["1"]);
      if (!isNaN(reg) && !isNaN(ren) && tld) {
        prices[tld] = {
          registration: reg,
          renewal: ren,
          source: "domainnameapi",
        };
      }
    }
  }
  return prices;
}

const prices = defineCollection({
  loader: async () => {
    const results = await Promise.allSettled([
      fetchCloudflare(),
      fetchPorkbun(),
      fetchDomainnameapi(),
    ]);

    // Merge with priority: domainnameapi < porkbun < cloudflare
    const merged: Record<string, RawPrice> = {};

    // Apply in reverse priority order so higher priority overwrites
    for (const idx of [2, 1, 0] as const) {
      const result = results[idx];
      if (result.status === "fulfilled") {
        Object.assign(merged, result.value);
      }
    }

    return Object.entries(merged).map(([tld, price]) => ({
      id: tld,
      registration: price.registration,
      renewal: price.renewal,
      source: price.source,
    }));
  },
  schema: z.object({
    registration: z.number(),
    renewal: z.number(),
    source: z.enum(["cloudflare", "porkbun", "domainnameapi"]),
  }),
});

export const collections = { tlds, prices };
