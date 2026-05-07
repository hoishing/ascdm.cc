import { SearchResultCard } from "./SearchResultCard";
import type { SearchResult } from "../../lib/types";

interface SearchResultsProps {
  results: SearchResult[];
  query: string;
}

export function SearchResults({ results, query }: SearchResultsProps) {
  if (results.length === 0) {
    return <p className="text-muted-foreground p-4 text-center">No results found.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {results.map((result) => (
        <SearchResultCard
          key={`${result.projectDir}::${result.sessionId}`}
          result={result}
          query={query}
        />
      ))}
    </div>
  );
}
