import { PanelLeftClose, PanelLeftOpen, FolderOpen } from "lucide-react";
import { shortPath } from "../../lib/formatters";
import { cn } from "../../lib/utils";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import type { Project } from "../../lib/types";

interface ProjectPanelProps {
  projects: Project[];
  selectedProject: string | null;
  onSelect: (encodedDir: string) => void;
  open: boolean;
  onToggle: () => void;
}

export function ProjectPanel({ projects, selectedProject, onSelect, open, onToggle }: ProjectPanelProps) {
  const sorted = [...projects].sort((a, b) => {
    const aMax = a.sessions.reduce((m, s) => Math.max(m, s.modified ? new Date(s.modified).getTime() || 0 : 0), 0);
    const bMax = b.sessions.reduce((m, s) => Math.max(m, s.modified ? new Date(s.modified).getTime() || 0 : 0), 0);
    return bMax - aMax;
  });

  if (!open) {
    return (
      <div className="h-full bg-sidebar border-r border-sidebar-border flex flex-col">
        <div className="px-2 py-2.5 border-b border-sidebar-border flex items-center justify-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="size-7 text-muted-foreground hover:text-foreground"
            title="Show projects"
          >
            <PanelLeftOpen className="size-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-sidebar border-r border-sidebar-border flex flex-col overflow-hidden">
      <div className="px-3 py-2.5 font-semibold text-sm border-b border-sidebar-border flex items-center justify-between">
        <span className="flex items-center gap-2">
          <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" />
          Projects
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="size-7 text-muted-foreground hover:text-foreground"
          title="Hide projects"
        >
          <PanelLeftClose className="size-4" />
        </Button>
      </div>
      <ul className="flex-1 overflow-y-auto flex flex-col gap-0.5 p-1">
        {sorted.map((project) => {
          const name = shortPath(project.projectPath);
          const sessions = project.sessions.filter((s) => s.messageCount > 0 || s.firstPrompt !== "No prompt");
          if (sessions.length === 0) return null;
          const isActive = selectedProject === project.encodedDir;
          return (
            <li key={project.encodedDir}>
              <a
                className={cn(
                  "flex items-center gap-2 rounded-md px-2 py-1.5 cursor-pointer transition-all",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground ring-1 ring-sidebar-primary/20"
                    : "hover:bg-sidebar-accent/50 text-muted-foreground hover:text-foreground",
                )}
                onClick={() => onSelect(project.encodedDir)}
                title={project.projectPath}
              >
                <span className="flex-1 truncate text-xs">{name}</span>
                <Badge variant="secondary" className="rounded-full h-5 min-w-5 justify-center text-[10px] px-1.5">
                  {sessions.length}
                </Badge>
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
