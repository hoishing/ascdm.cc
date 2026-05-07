import { useCallback, useEffect, useState } from "react";
import { Copy, Download, ChevronsUp, ChevronsDown, MessageSquare } from "lucide-react";
import { ExpandAllContext } from "./Collapsible";
import { formatDate } from "../../lib/formatters";
import { isDisplayableMessage, extractFirstPrompt } from "../../lib/parsers";
import { messagesToMarkdown } from "../../lib/export";
import { Spinner } from "../../components/Spinner";
import { ErrorAlert } from "../../components/ErrorAlert";
import { SubagentTabs } from "./SubagentTabs";
import { MessageList } from "./MessageList";
import { useToast } from "../../components/Toast";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Separator } from "../../components/ui/separator";
import type { Message, SessionInfo, SubagentEntry } from "../../lib/types";

interface ConversationPanelProps {
  messages: Message[];
  info: SessionInfo | null;
  subagents: SubagentEntry[];
  currentSubagent: string | null;
  onSubagentSelect: (agentId: string | null) => void;
  loading: boolean;
  error: string | null;
}

export function ConversationPanel({
  messages,
  info,
  subagents,
  currentSubagent,
  onSubagentSelect,
  loading,
  error,
}: ConversationPanelProps) {
  const [expandAll, setExpandAll] = useState<boolean | null>(true);

  useEffect(() => {
    setExpandAll(true);
  }, [messages]);

  const { showToast } = useToast();

  const copySessionId = useCallback(() => {
    if (!info) return;
    navigator.clipboard.writeText(info.sessionId);
    showToast("Session ID copied!", "success");
  }, [info, showToast]);

  const exportMarkdown = useCallback(() => {
    const md = messagesToMarkdown(messages);
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `session-${info?.sessionId || "export"}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [messages, info]);

  const hasDisplayable = messages.some(isDisplayableMessage);

  if (!info && !loading) {
    return (
      <div className="h-full flex flex-col overflow-hidden">
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
          <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
            <MessageSquare className="h-6 w-6" />
          </div>
          <p className="text-sm">Select a session to view messages</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {info && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-card border-b border-border shrink-0">
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm truncate">
              {(messages.length > 0 ? extractFirstPrompt(messages) : info.firstPrompt || info.sessionId).slice(0, 50)}
            </div>
            <div className="text-xs text-muted-foreground/60 truncate font-mono mt-0.5" title={info.sessionId}>
              {info.sessionId}
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground whitespace-nowrap">
            <Badge variant="secondary" className="font-normal">
              {(messages.length > 0 ? messages.filter(isDisplayableMessage).length : info.messageCount) || 0} msgs
            </Badge>
            {info.isArchived && (
              <Badge variant="outline" className="text-[10px]">
                Archived
              </Badge>
            )}
            <span>{formatDate(info.created)}</span>
            {info.gitBranch && (
              <Badge variant="outline" className="font-mono text-[10px]">
                {info.gitBranch}
              </Badge>
            )}
          </div>
          <Separator orientation="vertical" className="h-5" />
          <div className="inline-flex rounded-lg border border-border divide-x divide-border">
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-none first:rounded-l-lg" title="Copy session ID" onClick={copySessionId}>
              <Copy className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-none" title="Export as Markdown" onClick={exportMarkdown}>
              <Download className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-none"
              title={expandAll ? "Collapse all" : "Expand all"}
              onClick={() => setExpandAll(prev => !prev)}
            >
              {expandAll ? <ChevronsUp className="h-3.5 w-3.5" /> : <ChevronsDown className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>
      )}
      <SubagentTabs
        subagents={subagents}
        currentSubagent={currentSubagent}
        onSelect={onSubagentSelect}
      />
      <ExpandAllContext.Provider value={expandAll}>
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <Spinner text="Loading messages..." />
          ) : error ? (
            <ErrorAlert message={error} />
          ) : !hasDisplayable ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
              <p className="text-sm font-medium">No messages found</p>
              <p className="text-xs">This session file may be missing or contain only system data.</p>
            </div>
          ) : (
            <MessageList messages={messages} />
          )}
        </div>
      </ExpandAllContext.Provider>
    </div>
  );
}
