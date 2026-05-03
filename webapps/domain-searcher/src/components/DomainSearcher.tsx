import { useCallback, useEffect, useRef, useState } from "react";
import type { DomainResult, TldPrice } from "../lib/types";
import { batchCheck } from "../lib/batch";
import {
  getCachedSearch,
  saveSearch,
  getCachedPrices,
  fetchFreshPrices,
} from "../lib/cache";
import ResultsGrid from "./ResultsGrid";

const DOMAIN_RE = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/;

interface Props {
  tlds: string[];
  tldTypes: Record<string, string>;
  initialPrices: Record<string, TldPrice>;
}

export default function DomainSearcher({ tlds, tldTypes, initialPrices }: Props) {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<Map<string, DomainResult>>(new Map());
  const [checked, setChecked] = useState(0);
  const [error, setError] = useState("");
  const [cachedAt, setCachedAt] = useState<number | null>(null);
  const [prices, setPrices] = useState<Record<string, TldPrice>>(initialPrices);
  const [pricesCachedAt, setPricesCachedAt] = useState<number | null>(null);
  const [refreshingPrices, setRefreshingPrices] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const lastSearchRef = useRef<string>("");

  const total = tlds.length;

  // Load cached prices on mount
  useEffect(() => {
    getCachedPrices()
      .then((cached) => {
        if (cached) {
          setPrices(cached.prices);
          setPricesCachedAt(cached.timestamp);
        }
      })
      .catch(() => {});
  }, []);

  const handleRefreshPrices = useCallback(async () => {
    setRefreshingPrices(true);
    try {
      const fresh = await fetchFreshPrices();
      setPrices(fresh);
      setPricesCachedAt(Date.now());
    } catch {
      // keep existing prices
    }
    setRefreshingPrices(false);
  }, []);

  const runFreshSearch = useCallback(
    async (domainPart: string) => {
      setSearching(true);
      setChecked(0);
      setCachedAt(null);
      setResults(new Map());

      const controller = new AbortController();
      abortRef.current = controller;

      const collected: DomainResult[] = [];
      let count = 0;
      await batchCheck(
        domainPart,
        tlds,
        (result) => {
          count++;
          collected.push(result);
          setChecked(count);
          setResults((prev) => new Map(prev).set(result.tld, result));
        },
        controller.signal
      );

      if (!controller.signal.aborted) {
        await saveSearch(domainPart, collected).catch(() => {});
        setCachedAt(Date.now());
      }

      setSearching(false);
      abortRef.current = null;
    },
    [tlds]
  );

  const handleSearch = useCallback(async () => {
    const name = query.trim().toLowerCase();
    if (!name) return;

    const domainPart = name.split(".")[0];

    if (!DOMAIN_RE.test(domainPart) || domainPart.length > 63) {
      setError("Enter a valid domain name (letters, numbers, hyphens).");
      return;
    }

    setError("");
    lastSearchRef.current = domainPart;

    const cached = await getCachedSearch(domainPart).catch(() => null);
    if (cached) {
      const map = new Map<string, DomainResult>();
      for (const r of cached.results) map.set(r.tld, r);
      setResults(map);
      setChecked(cached.results.length);
      setCachedAt(cached.timestamp);
      return;
    }

    await runFreshSearch(domainPart);
  }, [query, runFreshSearch]);

  const handleRefresh = useCallback(async () => {
    if (!lastSearchRef.current) return;
    await runFreshSearch(lastSearchRef.current);
  }, [runFreshSearch]);

  const handleStop = useCallback(() => {
    abortRef.current?.abort();
    setSearching(false);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !searching) handleSearch();
  };

  const pct = total > 0 ? Math.round((checked / total) * 100) : 0;

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 space-y-6">
      {/* Header */}
      <div className="text-center">
        <p className="text-base-content/60">
          Check availability across {total.toLocaleString()} TLDs
        </p>
      </div>

      {/* Search Input */}
      <div className="flex justify-center">
        <div className="join w-full max-w-lg">
          <input
            type="text"
            placeholder="Enter domain name (e.g. mycompany)"
            className="input input-bordered join-item flex-1"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={searching}
          />
          {searching ? (
            <button className="btn btn-error join-item" onClick={handleStop}>
              Stop
            </button>
          ) : (
            <button
              className="btn btn-primary join-item"
              onClick={handleSearch}
              disabled={!query.trim()}
            >
              Search
            </button>
          )}
        </div>
      </div>

      {error && <p className="text-center text-error text-sm">{error}</p>}

      {/* Cache statuses */}
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-sm text-base-content/50">
        {cachedAt && !searching && (
          <span>
            Results cached: {new Date(cachedAt).toLocaleString()}{" "}
            <button className="btn btn-ghost btn-xs" onClick={handleRefresh}>
              Refresh
            </button>
          </span>
        )}
        <span>
          Prices:{" "}
          {pricesCachedAt
            ? new Date(pricesCachedAt).toLocaleString()
            : "build-time"}{" "}
          <button
            className="btn btn-ghost btn-xs"
            onClick={handleRefreshPrices}
            disabled={refreshingPrices}
          >
            {refreshingPrices ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              "Refresh"
            )}
          </button>
        </span>
      </div>

      {/* Progress */}
      {(searching || checked > 0) && (
        <div className="space-y-1">
          <progress
            className="progress progress-primary w-full"
            value={checked}
            max={total}
          />
          <div className="flex justify-between text-xs text-base-content/50">
            <span>
              {checked.toLocaleString()} / {total.toLocaleString()} checked
            </span>
            <span>{pct}%</span>
          </div>
        </div>
      )}

      {/* Results */}
      {results.size > 0 && <ResultsGrid results={results} prices={prices} tldTypes={tldTypes} />}

      {/* Disclaimer */}
      {results.size > 0 && (
        <p className="text-xs text-base-content/40 text-center">
          Results based on DNS lookup. Prices from Cloudflare (at-cost),
          Porkbun, and domainnameapi. Verify with a registrar before
          purchasing.
        </p>
      )}
    </div>
  );
}
