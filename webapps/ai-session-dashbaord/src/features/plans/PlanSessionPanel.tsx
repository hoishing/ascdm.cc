import { formatDate, truncate } from "../../lib/formatters";
import { cn } from "../../lib/utils";
import { Badge } from "../../components/ui/badge";
import type { ProjectWithPlans } from "../../lib/types";

interface PlanSessionPanelProps {
  project: ProjectWithPlans | null;
  currentSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
}

export function PlanSessionPanel({ project, currentSessionId, onSelectSession }: PlanSessionPanelProps) {
  return (
    <div className="h-full bg-card/50 border-r border-border flex flex-col overflow-hidden">
      <div className="px-3 py-2.5 flex items-center gap-2 border-b border-border">
        <span className="text-sm font-semibold">Sessions</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {project ? (
          project.sessionsWithPlans.length === 0 ? (
            <div className="text-center text-muted-foreground text-xs py-8">No sessions with plans</div>
          ) : (
            project.sessionsWithPlans.map((s) => {
              const isActive = currentSessionId === s.sessionId;
              return (
                <div
                  key={s.sessionId}
                  className={cn("session-item px-3 py-2.5 cursor-pointer text-xs", isActive && "active")}
                  onClick={() => onSelectSession(s.sessionId)}
                >
                  <div className={cn("truncate font-medium", isActive && "text-primary")}>
                    {truncate(s.firstPrompt || s.sessionId, 50)}
                  </div>
                  <div className="flex items-center justify-between mt-1 text-muted-foreground">
                    <span>{formatDate(s.modified)}</span>
                    <span className="flex items-center gap-1.5">
                      {s.isArchived && (
                        <Badge variant="outline" className="h-4 rounded px-1 text-[10px]">
                          Archived
                        </Badge>
                      )}
                      <Badge variant="secondary" className="rounded-full h-5 min-w-5 justify-center text-[10px] px-1.5">
                        {s.slugs.length}
                      </Badge>
                    </span>
                  </div>
                </div>
              );
            })
          )
        ) : (
          <div className="text-center text-muted-foreground text-xs py-8">Select a project</div>
        )}
      </div>
    </div>
  );
}
