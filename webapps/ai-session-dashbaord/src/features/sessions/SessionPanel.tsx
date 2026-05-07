import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { formatDate, truncate } from "../../lib/formatters";
import { cn } from "../../lib/utils";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import type { Project } from "../../lib/types";

interface SessionPanelProps {
  project: Project | null;
  currentSessionId: string | null;
  currentProjectDir: string | null;
  onSelectSession: (projectDir: string, sessionId: string) => void;
}

export function SessionPanel({
  project,
  currentSessionId,
  currentProjectDir,
  onSelectSession,
}: SessionPanelProps) {
  const [filter, setFilter] = useState("");

  const sessions = useMemo(() =>
    project
      ? [...project.sessions]
          .filter((s) => s.messageCount > 0)
          .sort((a, b) => {
            const ta = a.modified ? new Date(a.modified).getTime() || 0 : 0;
            const tb = b.modified ? new Date(b.modified).getTime() || 0 : 0;
            return tb - ta;
          })
      : [],
  [project]);

  const filtered = useMemo(() =>
    filter
      ? sessions.filter((s) => {
          const text = `${s.firstPrompt} ${s.summary} ${s.sessionId}`.toLowerCase();
          return text.includes(filter.toLowerCase());
        })
      : sessions,
  [sessions, filter]);

  return (
    <div className="h-full bg-card/50 border-r border-border flex flex-col overflow-hidden">
      <div className="px-3 py-2.5 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-2 text-sm font-semibold">
          Sessions
          <Badge variant="secondary" className="rounded-full h-5 min-w-5 justify-center text-[10px] px-1.5">
            {sessions.length}
          </Badge>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {project ? (
          <>
            <div className="px-2 py-1.5 border-b border-border">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Filter sessions..."
                  className="h-7 text-xs pl-7"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                />
              </div>
            </div>
            {filtered.length === 0 ? (
              <div className="text-center text-muted-foreground text-xs py-8">No sessions</div>
            ) : (
              filtered.map((s) => {
                const isActive = currentSessionId === s.sessionId && currentProjectDir === project.encodedDir;
                return (
                  <div
                    key={s.sessionId}
                    className={`session-item px-3 py-2.5 cursor-pointer text-xs flex items-start gap-2 ${isActive ? "active" : ""}`}
                    onClick={() => onSelectSession(project.encodedDir, s.sessionId)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className={cn("truncate font-medium", isActive && "text-primary")}>{truncate(s.firstPrompt || s.sessionId, 50)}</div>
                      <div className="text-muted-foreground/60 mt-0.5 truncate font-mono" title={s.sessionId}>
                        {s.sessionId}
                      </div>
                      <div className="text-muted-foreground mt-1 flex items-center gap-1.5">
                        <span>{formatDate(s.modified)}</span>
                        <span className="text-muted-foreground/40">·</span>
                        <span>{s.messageCount || 0} msgs</span>
                        {s.isArchived && (
                          <>
                            <span className="text-muted-foreground/40">·</span>
                            <Badge variant="outline" className="h-4 rounded px-1 text-[10px]">
                              Archived
                            </Badge>
                          </>
                        )}
                        {s.gitBranch && (
                          <>
                            <span className="text-muted-foreground/40">·</span>
                            <span className="text-primary/70">{s.gitBranch}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </>
        ) : (
          <div className="text-center text-muted-foreground text-xs py-8">Select a project</div>
        )}
      </div>
    </div>
  );
}
