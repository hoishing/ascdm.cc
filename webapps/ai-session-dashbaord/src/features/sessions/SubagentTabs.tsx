import { Bot } from "lucide-react";
import { cn } from "../../lib/utils";
import type { SubagentEntry } from "../../lib/types";

interface SubagentTabsProps {
  subagents: SubagentEntry[];
  currentSubagent: string | null;
  onSelect: (agentId: string | null) => void;
}

export function SubagentTabs({ subagents, currentSubagent, onSelect }: SubagentTabsProps) {
  if (!subagents || subagents.length === 0) return null;

  return (
    <div className="flex items-center gap-0.5 bg-muted/50 border-b border-border shrink-0 px-4 py-1.5">
      <button
        className={cn(
          "inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium cursor-pointer transition-all",
          !currentSubagent
            ? "bg-background text-foreground shadow-sm ring-1 ring-border/50"
            : "text-muted-foreground hover:text-foreground hover:bg-background/50",
        )}
        onClick={() => onSelect(null)}
      >
        Main
      </button>
      {subagents.map((sa, i) => (
        <button
          key={sa.agentId}
          className={cn(
            "inline-flex items-center justify-center gap-1 rounded-md px-3 py-1 text-xs font-medium cursor-pointer transition-all",
            currentSubagent === sa.agentId
              ? "bg-background text-foreground shadow-sm ring-1 ring-border/50"
              : "text-muted-foreground hover:text-foreground hover:bg-background/50",
          )}
          onClick={() => onSelect(sa.agentId)}
        >
          <Bot className="h-3 w-3" />
          {`agent-${i + 1}`}
        </button>
      ))}
    </div>
  );
}
