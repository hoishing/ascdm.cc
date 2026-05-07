import { useState, useEffect, useRef } from "react";
import { Search, SearchX } from "lucide-react";
import { useSearch } from "../hooks/useSearch";
import { Spinner } from "../components/Spinner";
import { ErrorAlert } from "../components/ErrorAlert";
import { Progress } from "../components/ui/progress";
import { SearchFilters } from "../features/search/SearchFilters";
import { SearchResults } from "../features/search/SearchResults";
import { PlanSearchResults } from "../features/search/PlanSearchResults";

export function SearchPage() {
  const {
    results, planResults, loading, error, projects,
    titleOnly, setTitleOnly, searchType, setSearchType, searchProgress,
    loadProjects, search,
  } = useSearch();
  const [query, setQuery] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const hasSearched = useRef(false);

  useEffect(() => { loadProjects(); }, [loadProjects]);

  const doSearch = () => {
    hasSearched.current = true;
    search(query, projectFilter, dateFrom, dateTo);
  };

  const isPlan = searchType === "plan";
  const hasResults = isPlan ? planResults.length > 0 : results.length > 0;

  return (
    <div className="p-6 overflow-y-auto h-full">
      <div className="flex items-center gap-2 mb-5">
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Search className="h-4 w-4 text-primary" />
        </div>
        <h2 className="text-lg font-semibold">Search</h2>
      </div>
      <SearchFilters
        query={query} onQueryChange={setQuery}
        projectFilter={projectFilter} onProjectFilterChange={setProjectFilter}
        dateFrom={dateFrom} onDateFromChange={setDateFrom}
        dateTo={dateTo} onDateToChange={setDateTo}
        onSearch={doSearch}
        projects={projects}
        titleOnly={titleOnly} onTitleOnlyChange={setTitleOnly}
        searchType={searchType} onSearchTypeChange={setSearchType}
      />
      {loading && searchProgress && (
        <div className="flex items-center gap-3 mb-4">
          <Progress
            className="h-1.5 flex-1 max-w-xs"
            value={(searchProgress.scanned / searchProgress.total) * 100}
          />
          <span className="text-xs text-muted-foreground">
            {searchProgress.scanned} / {searchProgress.total} sessions
          </span>
        </div>
      )}
      {loading && !hasResults ? (
        <Spinner text={isPlan ? "Searching plans..." : !titleOnly && query ? "Deep searching..." : query ? "Searching..." : "Loading..."} />
      ) : error ? (
        <ErrorAlert message={error} />
      ) : hasResults ? (
        isPlan ? (
          <PlanSearchResults results={planResults} query={query} />
        ) : (
          <SearchResults
            results={results}
            query={query}
          />
        )
      ) : hasSearched.current ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
          <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
            <SearchX className="h-6 w-6" />
          </div>
          <p className="text-sm font-medium">No results found</p>
          <p className="text-xs">
            {isPlan
              ? "Try a different query."
              : "Try a different query, adjust filters, or disable \"Title only\" for deeper search."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-4">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Search className="h-8 w-8 text-primary/60" />
          </div>
          <div className="text-center space-y-1.5">
            <p className="text-base font-medium text-foreground">
              {isPlan ? "Search your plans" : "Search your conversations"}
            </p>
            <p className="text-sm max-w-md">
              {isPlan
                ? "Find plans by title or content."
                : "Find sessions by message content, titles, and subagent outputs. Filter by project or date range to narrow results."}
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs mt-1">
            <span>Enter a query and press <kbd className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono text-[11px]">Enter</kbd> to search</span>
            {!isPlan && (
              <>
                <span>·</span>
                <span>Toggle <strong>Title only</strong> for faster metadata search</span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
