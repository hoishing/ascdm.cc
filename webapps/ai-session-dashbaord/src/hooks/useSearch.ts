import { useState, useCallback, useRef } from "react";
import { useClaudeDir } from "./useClaudeDir";
import { localSearchSessions, localListAllSessions } from "../data/search";
import type { Project, SearchResult, PlanEntry } from "../lib/types";

export type SearchType = "session" | "plan";

export function useSearch() {
  const { getSource, isConnected } = useClaudeDir();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [planResults, setPlanResults] = useState<PlanEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [titleOnly, setTitleOnly] = useState(false);
  const [searchType, setSearchType] = useState<SearchType>("session");
  const [searchProgress, setSearchProgress] = useState<{ scanned: number; total: number } | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const loadProjects = useCallback(async () => {
    if (!isConnected) return;
    try {
      const p = await getSource().listProjects();
      setProjects(p);
    } catch { /* ignore */ }
  }, [isConnected, getSource]);

  const search = useCallback(
    async (query: string, projectFilter?: string, dateFrom?: string, dateTo?: string) => {
      if (!isConnected) return;
      const source = getSource();

      // Cancel any in-progress deep search
      if (abortRef.current) abortRef.current.abort();

      setLoading(true);
      setError(null);
      setSearchProgress(null);

      if (searchType === "plan") {
        try {
          const plans = await source.searchPlans(query);
          setPlanResults(plans);
          setResults([]);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Search failed");
        } finally {
          setLoading(false);
        }
        return;
      }

      try {
        let projectList = projects;
        if (projectList.length === 0) {
          projectList = await source.listProjects();
          setProjects(projectList);
        }

        const hasDateFilter = !!(dateFrom || dateTo);
        // Use a large limit when date filtering to avoid dropping results before filtering
        const searchLimit = hasDateFilter ? 9999 : 50;

        let searchResults: SearchResult[];
        if (query) {
          if (!titleOnly) {
            const ac = new AbortController();
            abortRef.current = ac;
            searchResults = await source.deepSearch(projectList, query, {
              project: projectFilter,
              limit: searchLimit,
              onProgress: (progressResults, scanned, total) => {
                setResults(progressResults);
                setSearchProgress({ scanned, total });
              },
              abortSignal: ac.signal,
            });
            abortRef.current = null;
            setSearchProgress(null);
          } else {
            searchResults = localSearchSessions(projectList, query, {
              project: projectFilter,
              limit: searchLimit,
            });
          }
        } else {
          searchResults = localListAllSessions(projectList, {
            project: projectFilter,
            limit: searchLimit,
          });
        }

        // Date filter — applied before final limit
        if (hasDateFilter) {
          const sessionDates: Record<string, { created: string; modified: string }> = {};
          for (const p of projectList) {
            for (const s of p.sessions) {
              sessionDates[s.sessionId] = { created: s.created, modified: s.modified };
            }
          }
          searchResults = searchResults.filter((r) => {
            const dates = sessionDates[r.sessionId];
            if (!dates) return true;
            const modified = dates.modified || dates.created || "";
            if (dateFrom && modified < dateFrom) return false;
            if (dateTo && modified > dateTo + "T23:59:59Z") return false;
            return true;
          });
        }

        searchResults = searchResults.slice(0, 50);

        setResults(searchResults);
        setPlanResults([]);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Search failed");
      } finally {
        setLoading(false);
      }
    },
    [isConnected, getSource, projects, titleOnly, searchType],
  );

  return {
    results,
    planResults,
    loading,
    error,
    projects,
    titleOnly,
    setTitleOnly,
    searchType,
    setSearchType,
    searchProgress,
    loadProjects,
    search,
  };
}
