import { ClipboardList } from "lucide-react";
import { highlightText } from "../../lib/markdown";
import type { PlanEntry } from "../../lib/types";

const SNIPPET_RADIUS = 140;

function buildSnippet(content: string, query: string): string {
  if (!query) return content.slice(0, 280);
  const lower = content.toLowerCase();
  const idx = lower.indexOf(query.toLowerCase());
  if (idx === -1) return content.slice(0, 280);
  const start = Math.max(0, idx - SNIPPET_RADIUS);
  const end = Math.min(content.length, idx + query.length + SNIPPET_RADIUS);
  const prefix = start > 0 ? "…" : "";
  const suffix = end < content.length ? "…" : "";
  return prefix + content.slice(start, end) + suffix;
}

interface PlanSearchResultsProps {
  results: PlanEntry[];
  query: string;
}

export function PlanSearchResults({ results, query }: PlanSearchResultsProps) {
  if (results.length === 0) {
    return <p className="text-muted-foreground p-4 text-center">No plans found.</p>;
  }
  return (
    <div className="flex flex-col gap-3">
      {results.map((plan) => {
        const snippet = buildSnippet(plan.content, query);
        return (
          <div
            key={plan.slug}
            className="rounded-xl border bg-card p-4 flex flex-col gap-2 hover:border-primary/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-primary shrink-0" />
              <h3 className="font-semibold text-sm text-primary truncate">
                <span dangerouslySetInnerHTML={{ __html: query ? highlightText(plan.title, query) : plan.title }} />
              </h3>
            </div>
            <p className="text-xs text-muted-foreground font-mono truncate">{plan.slug}</p>
            <div
              className="bg-muted/50 border border-border/50 p-2.5 rounded-lg text-xs whitespace-pre-wrap break-words"
              dangerouslySetInnerHTML={{ __html: query ? highlightText(snippet, query) : snippet }}
            />
          </div>
        );
      })}
    </div>
  );
}
