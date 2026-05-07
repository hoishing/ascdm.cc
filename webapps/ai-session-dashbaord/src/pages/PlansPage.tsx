import { useState, useEffect } from "react";
import { usePlans } from "../hooks/usePlans";
import { useClaudeDir } from "../hooks/useClaudeDir";
import { Spinner } from "../components/Spinner";
import { ErrorAlert } from "../components/ErrorAlert";
import { PlanProjectPanel } from "../features/plans/PlanProjectPanel";
import { PlanSessionPanel } from "../features/plans/PlanSessionPanel";
import { PlanDetailPanel } from "../features/plans/PlanDetailPanel";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "../components/ui/resizable";
import type { PlanEntry } from "../lib/types";

export function PlansPage() {
  const { projectsWithPlans, loading, error } = usePlans();
  const { getSource, isConnected } = useClaudeDir();
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [plans, setPlans] = useState<PlanEntry[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [plansError, setPlansError] = useState<string | null>(null);

  // Auto-select first project
  useEffect(() => {
    if (projectsWithPlans && projectsWithPlans.length > 0 && !selectedProject) {
      setSelectedProject(projectsWithPlans[0].encodedDir);
    }
  }, [projectsWithPlans, selectedProject]);

  // Load plans when session selected
  useEffect(() => {
    if (!selectedSessionId || !selectedProject || !isConnected) {
      setPlans([]);
      return;
    }
    const projectData = projectsWithPlans?.find((p) => p.encodedDir === selectedProject);
    const sessionData = projectData?.sessionsWithPlans.find((s) => s.sessionId === selectedSessionId);
    if (!sessionData) return;

    let cancelled = false;
    setPlansLoading(true);
    setPlansError(null);

    getSource().loadPlansForSession(sessionData.slugs).then(
      (loaded) => { if (!cancelled) { setPlans(loaded); setPlansLoading(false); } },
      (err) => { if (!cancelled) { setPlansError(err.message); setPlansLoading(false); } },
    );

    return () => { cancelled = true; };
  }, [selectedSessionId, selectedProject, isConnected, projectsWithPlans, getSource]);

  if (loading) return <Spinner text="Scanning for plans..." />;
  if (error) return <ErrorAlert message={error} />;
  if (!projectsWithPlans) return null;

  const selectedProjectData = projectsWithPlans.find((p) => p.encodedDir === selectedProject) || null;
  const selectedSessionData = selectedProjectData?.sessionsWithPlans.find((s) => s.sessionId === selectedSessionId) || null;

  return (
    <ResizablePanelGroup orientation="horizontal" className="h-full">
      <ResizablePanel defaultSize="18%" minSize="10%" maxSize="30%">
        <PlanProjectPanel
          projects={projectsWithPlans}
          selectedProject={selectedProject}
          onSelect={(dir) => {
            setSelectedProject(dir);
            setSelectedSessionId(null);
            setPlans([]);
          }}
        />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize="22%" minSize="12%" maxSize="40%">
        <PlanSessionPanel
          project={selectedProjectData}
          currentSessionId={selectedSessionId}
          onSelectSession={setSelectedSessionId}
        />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize="60%" minSize="30%">
        <PlanDetailPanel
          plans={plans}
          loading={plansLoading}
          error={plansError}
          sessionDate={selectedSessionData?.modified}
        />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
