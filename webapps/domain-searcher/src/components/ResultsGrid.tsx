import { useMemo, useState } from "react";
import type { DomainResult, DomainStatus, TldPrice, TldType } from "../lib/types";
import DomainCard from "./DomainCard";

type Filter = "all" | "available" | "taken" | "error";
type PriceFilter = "all" | "priced" | "unpriced";
type TypeFilter = TldType | "all";
type Sort = "alpha" | "status" | "price-asc" | "price-desc";

interface Props {
  results: Map<string, DomainResult>;
  prices: Record<string, TldPrice>;
  tldTypes: Record<string, string>;
}

export default function ResultsGrid({ results, prices, tldTypes }: Props) {
  const [filter, setFilter] = useState<Filter>("all");
  const [priceFilter, setPriceFilter] = useState<PriceFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<Sort>("status");
  const [maxLen, setMaxLen] = useState(2);

  const maxTldLen = useMemo(() => {
    let max = 0;
    for (const r of results.values()) {
      if (r.tld.length > max) max = r.tld.length;
    }
    return max;
  }, [results]);

  const filtered = useMemo(() => {
    let items = Array.from(results.values());

    items = items.filter((r) => r.tld.length <= maxLen);

    if (filter !== "all") {
      items = items.filter((r) => r.status === (filter as DomainStatus));
    }

    if (priceFilter === "priced") {
      items = items.filter((r) => r.tld in prices);
    } else if (priceFilter === "unpriced") {
      items = items.filter((r) => !(r.tld in prices));
    }

    if (typeFilter !== "all") {
      items = items.filter((r) => (tldTypes[r.tld] ?? "generic") === typeFilter);
    }

    if (search) {
      const q = search.toLowerCase();
      items = items.filter((r) => r.tld.includes(q));
    }

    items.sort((a, b) => {
      if (sort === "status") {
        const order: Record<string, number> = {
          available: 0,
          pending: 1,
          error: 2,
          taken: 3,
        };
        const diff = order[a.status] - order[b.status];
        if (diff !== 0) return diff;
        return a.tld.localeCompare(b.tld);
      }
      if (sort === "price-asc" || sort === "price-desc") {
        const pa = prices[a.tld]?.registration ?? Infinity;
        const pb = prices[b.tld]?.registration ?? Infinity;
        const diff = sort === "price-asc" ? pa - pb : pb - pa;
        if (diff !== 0) return diff;
        return a.tld.localeCompare(b.tld);
      }
      return a.tld.localeCompare(b.tld);
    });

    return items;
  }, [results, prices, tldTypes, filter, priceFilter, typeFilter, search, sort, maxLen]);

  const counts = useMemo(() => {
    let available = 0,
      taken = 0,
      error = 0;
    for (const r of results.values()) {
      if (r.tld.length > maxLen) continue;
      if (r.status === "available") available++;
      else if (r.status === "taken") taken++;
      else if (r.status === "error") error++;
    }
    return { available, taken, error };
  }, [results, maxLen]);

  const tabs: { key: Filter; label: string; count?: number }[] = [
    { key: "all", label: "All" },
    { key: "available", label: "Available", count: counts.available },
    { key: "taken", label: "Taken", count: counts.taken },
    { key: "error", label: "Errors", count: counts.error },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div role="tablist" className="tabs tabs-boxed">
          {tabs.map((t) => (
            <button
              key={t.key}
              role="tab"
              className={`tab ${filter === t.key ? "tab-active" : ""}`}
              onClick={() => setFilter(t.key)}
            >
              {t.label}
              {t.count !== undefined && t.count > 0 && (
                <span className="badge badge-sm ml-1">{t.count}</span>
              )}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Filter TLDs..."
          className="input input-bordered input-sm w-40"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="select select-bordered select-sm"
          value={sort}
          onChange={(e) => setSort(e.target.value as Sort)}
        >
          <option value="status">Sort: Status</option>
          <option value="alpha">Sort: A-Z</option>
          <option value="price-asc">Sort: Price (low)</option>
          <option value="price-desc">Sort: Price (high)</option>
        </select>
        <select
          className="select select-bordered select-sm"
          value={priceFilter}
          onChange={(e) => setPriceFilter(e.target.value as PriceFilter)}
        >
          <option value="all">Pricing: All</option>
          <option value="priced">With Price</option>
          <option value="unpriced">Without Price</option>
        </select>
        <select
          className="select select-bordered select-sm"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
        >
          <option value="all">Type: All</option>
          <option value="generic">Generic</option>
          <option value="country">Country</option>
          <option value="sponsored">Sponsored</option>
          <option value="brand">Brand</option>
        </select>
      </div>

      {/* TLD Length Filter */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-base-content/60 whitespace-nowrap">
          Max TLD length: {maxLen}
        </span>
        <input
          type="range"
          min={1}
          max={maxTldLen || 20}
          value={maxLen}
          onChange={(e) => setMaxLen(Number(e.target.value))}
          className="range range-sm range-primary flex-1 max-w-xs"
        />
        <span className="text-xs text-base-content/40">{maxTldLen}</span>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2">
        {filtered.map((r) => (
          <DomainCard key={r.tld} result={r} price={prices[r.tld]} />
        ))}
      </div>

      {filtered.length === 0 && results.size > 0 && (
        <p className="text-center text-base-content/50 py-8">
          No results match your filter.
        </p>
      )}
    </div>
  );
}
