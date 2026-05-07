import { useMemo, useState } from "react";
import { FolderOpen, Search } from "lucide-react";
import { shortPath } from "../../lib/formatters";
import { cn } from "../../lib/utils";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import type { ProjectWithPlans } from "../../lib/types";

interface PlanProjectPanelProps {
  projects: ProjectWithPlans[];
  selectedProject: string | null;
  onSelect: (encodedDir: string) => void;
}

export function PlanProjectPanel({ projects, selectedProject, onSelect }: PlanProjectPanelProps) {
  const [filter, setFilter] = useState("");

  const filtered = useMemo(() => {
    if (!filter.trim()) return projects;
    const q = filter.toLowerCase();
    return projects.filter((p) => p.projectPath.toLowerCase().includes(q));
  }, [projects, filter]);

  return (
    <div className="h-full bg-sidebar border-r border-sidebar-border flex flex-col overflow-hidden">
      <div className="px-3 py-2.5 font-semibold text-sm border-b border-sidebar-border flex items-center gap-2">
        <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" />
        Projects
      </div>
      <div className="px-2 py-1.5 border-b border-sidebar-border">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Filter projects..."
            className="h-7 text-xs pl-7"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
      </div>
      <ul className="flex-1 overflow-y-auto flex flex-col gap-0.5 p-1">
        {filtered.length === 0 ? (
          <li className="text-center text-muted-foreground text-xs py-8">No projects</li>
        ) : (
          filtered.map((project) => {
            const name = shortPath(project.projectPath);
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
                    {project.sessionsWithPlans.length}
                  </Badge>
                </a>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
