import { useEffect, useState, useCallback } from "react";
import { ClipboardList, Copy, Download } from "lucide-react";
import { renderMarkdown } from "../../lib/markdown";
import { formatDate } from "../../lib/formatters";
import { cn } from "../../lib/utils";
import { Spinner } from "../../components/Spinner";
import { ErrorAlert } from "../../components/ErrorAlert";
import { Button } from "../../components/ui/button";
import { Separator } from "../../components/ui/separator";
import { useToast } from "../../components/Toast";
import type { PlanEntry } from "../../lib/types";

interface PlanDetailPanelProps {
  plans: PlanEntry[];
  loading: boolean;
  error: string | null;
  sessionDate?: string;
}

export function PlanDetailPanel({ plans, loading, error, sessionDate }: PlanDetailPanelProps) {
  const { showToast } = useToast();
  const [activeSlug, setActiveSlug] = useState<string | null>(null);

  useEffect(() => {
    setActiveSlug(plans[0]?.slug ?? null);
  }, [plans]);

  const activePlan = plans.find((p) => p.slug === activeSlug) ?? plans[0] ?? null;

  const copyPlan = useCallback(() => {
    if (!activePlan) return;
    navigator.clipboard.writeText(activePlan.content);
    showToast("Plan copied!", "success");
  }, [activePlan, showToast]);

  const downloadPlan = useCallback(() => {
    if (!activePlan) return;
    const blob = new Blob([activePlan.content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activePlan.slug}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [activePlan]);

  if (!loading && plans.length === 0 && !error) {
    return (
      <div className="h-full flex flex-col overflow-hidden">
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
          <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
            <ClipboardList className="h-6 w-6" />
          </div>
          <p className="text-sm">Select a session to view plans</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {activePlan && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-card border-b border-border shrink-0">
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm truncate">{activePlan.title}</div>
            <div className="text-xs text-muted-foreground/60 truncate font-mono mt-0.5" title={activePlan.slug}>
              {activePlan.slug}
            </div>
          </div>
          {sessionDate && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground whitespace-nowrap">
              <span>{formatDate(sessionDate)}</span>
            </div>
          )}
          <Separator orientation="vertical" className="h-5" />
          <div className="inline-flex rounded-lg border border-border divide-x divide-border">
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-none first:rounded-l-lg" title="Copy plan" onClick={copyPlan}>
              <Copy className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-none last:rounded-r-lg" title="Download plan" onClick={downloadPlan}>
              <Download className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {plans.length > 1 && (
        <div className="flex items-center gap-0.5 bg-muted/50 border-b border-border shrink-0 px-4 py-1.5 overflow-x-auto">
          {plans.map((p) => (
            <button
              key={p.slug}
              className={cn(
                "inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium cursor-pointer transition-all max-w-[200px] shrink-0",
                activeSlug === p.slug
                  ? "bg-background text-foreground shadow-sm ring-1 ring-border/50"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50",
              )}
              title={p.title}
              onClick={() => setActiveSlug(p.slug)}
            >
              <ClipboardList className="h-3 w-3 shrink-0" />
              <span className="truncate">{p.title}</span>
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Spinner text="Loading plan..." />
          </div>
        ) : error ? (
          <ErrorAlert message={error} />
        ) : activePlan ? (
          <div
            className="md-content text-sm"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(activePlan.content) }}
          />
        ) : null}
      </div>
    </div>
  );
}
