import { useNavigate } from "react-router";
import { Copy } from "lucide-react";
import { shortPath, formatDateTime } from "../../lib/formatters";
import { highlightText } from "../../lib/markdown";
import { useToast } from "../../components/Toast";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import type { SearchResult } from "../../lib/types";

interface SearchResultCardProps {
  result: SearchResult;
  query: string;
}

export function SearchResultCard({ result, query }: SearchResultCardProps) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const context = result.matchContext || "";

  const handleClick = () => {
    navigate(`/sessions?project=${encodeURIComponent(result.projectDir || result.projectPath)}&session=${encodeURIComponent(result.sessionId)}`);
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(result.sessionId);
    showToast("Session ID copied!", "success");
  };

  return (
    <div className="rounded-xl border bg-card hover:border-primary/30 transition-all flex flex-row items-start group">
      <div className="p-4 cursor-pointer flex-1 min-w-0" onClick={handleClick}>
        <div className="flex items-center gap-2">
          {result.kind && (
            <Badge variant="outline" className="text-[10px] capitalize">{result.kind}</Badge>
          )}
          {result.matchSource === "content" && (
            <Badge variant="secondary" className="text-[10px]">Content</Badge>
          )}
          {result.matchSource === "subagent" && (
            <Badge variant="outline" className="text-[10px]">Subagent</Badge>
          )}
          {result.isArchived && (
            <Badge variant="outline" className="text-[10px]">Archived</Badge>
          )}
          <h3 className="font-semibold text-sm text-primary group-hover:underline">
            {result.sessionId}
          </h3>
        </div>
        <p className="text-xs text-muted-foreground mt-1.5">
          {shortPath(result.projectPath)}
          {result.modified && <> · {formatDateTime(result.modified)}</>}
        </p>
        {context && (
          <div
            className="bg-muted/50 border border-border/50 p-2.5 rounded-lg text-xs font-mono whitespace-pre-wrap break-words mt-2.5"
            dangerouslySetInnerHTML={{ __html: query ? highlightText(context, query) : context }}
          />
        )}
      </div>
      <div className="flex items-center pr-3 self-stretch">
        <Button
          variant="ghost"
          size="icon"
          className="size-7 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
          title="Copy session ID"
          onClick={handleCopy}
        >
          <Copy className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
