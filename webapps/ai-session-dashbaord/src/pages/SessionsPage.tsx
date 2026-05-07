import { useState, useEffect, useRef } from "react";
import type { PanelImperativeHandle } from "react-resizable-panels";
import { useSearchParams } from "react-router";
import { useProjects } from "../hooks/useProjects";
import { useSessionMessages } from "../hooks/useSessionMessages";
import { useClaudeDir } from "../hooks/useClaudeDir";
import { Spinner } from "../components/Spinner";
import { ErrorAlert } from "../components/ErrorAlert";
import { ProjectPanel } from "../features/sessions/ProjectPanel";
import { SessionPanel } from "../features/sessions/SessionPanel";
import { ConversationPanel } from "../features/sessions/ConversationPanel";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "../components/ui/resizable";

export function SessionsPage() {
  const { projects, loading, error } = useProjects();
  const { kind } = useClaudeDir();
  const [searchParams] = useSearchParams();
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [currentSession, setCurrentSession] = useState<{ projectDir: string; sessionId: string } | null>(null);
  const [currentSubagent, setCurrentSubagent] = useState<string | null>(null);
  const [projectPanelOpen, setProjectPanelOpen] = useState(true);
  const projectPanelRef = useRef<PanelImperativeHandle | null>(null);

  const { messages, info, subagents, loading: msgLoading, error: msgError } = useSessionMessages(
    currentSession?.projectDir ?? null,
    currentSession?.sessionId ?? null,
    currentSubagent,
  );

  useEffect(() => {
    setSelectedProject(null);
    setCurrentSession(null);
    setCurrentSubagent(null);
  }, [kind]);

  useEffect(() => {
    if (!projects) return;
    const paramProject = searchParams.get("project");
    const paramSession = searchParams.get("session");

    if (paramProject && paramSession) {
      const project = projects.find(
        (p) => p.projectPath === paramProject || p.encodedDir === paramProject || p.encodedDir === encodeURIComponent(paramProject),
      );
      if (project) {
        setSelectedProject(project.encodedDir);
        setCurrentSession({ projectDir: project.encodedDir, sessionId: paramSession });
        setCurrentSubagent(null);
      } else {
        for (const p of projects) {
          const s = p.sessions.find((session) => session.sessionId === paramSession);
          if (s) {
            setSelectedProject(p.encodedDir);
            setCurrentSession({ projectDir: p.encodedDir, sessionId: paramSession });
            setCurrentSubagent(null);
            break;
          }
        }
      }
    } else if (paramProject) {
      const project = projects.find(
        (p) => p.projectPath === paramProject || p.encodedDir === paramProject || p.encodedDir === encodeURIComponent(paramProject),
      );
      if (project) setSelectedProject(project.encodedDir);
    }
  }, [projects, searchParams]);

  useEffect(() => {
    if (projects && projects.length > 0 && !selectedProject && !searchParams.get("project")) {
      setSelectedProject(projects[0].encodedDir);
    }
  }, [projects, selectedProject, searchParams]);

  if (loading) return <Spinner text="Loading projects..." />;
  if (error) return <ErrorAlert message={error} />;
  if (!projects) return null;

  const selectedProjectData = projects.find((p) => p.encodedDir === selectedProject) || null;

  return (
    <ResizablePanelGroup orientation="horizontal" className="h-full">
      <ResizablePanel
        panelRef={projectPanelRef}
        collapsible
        defaultSize="15%"
        minSize="12%"
        maxSize="25%"
        collapsedSize={3}
        onResize={(size) => setProjectPanelOpen(size.asPercentage > 4)}
      >
        <ProjectPanel
          projects={projects}
          selectedProject={selectedProject}
          onSelect={(dir) => {
            setSelectedProject(dir);
            setCurrentSession(null);
            setCurrentSubagent(null);
          }}
          open={projectPanelOpen}
          onToggle={() => {
            const panel = projectPanelRef.current;
            if (!panel) return;
            if (panel.isCollapsed()) panel.expand();
            else panel.collapse();
          }}
        />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize="22%" minSize="15%" maxSize="40%">
        <SessionPanel
          project={selectedProjectData}
          currentSessionId={currentSession?.sessionId ?? null}
          currentProjectDir={currentSession?.projectDir ?? null}
          onSelectSession={(projectDir, sessionId) => {
            setCurrentSession({ projectDir, sessionId });
            setCurrentSubagent(null);
          }}
        />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize="63%" minSize="30%">
        <ConversationPanel
          messages={messages}
          info={info}
          subagents={subagents}
          currentSubagent={currentSubagent}
          onSubagentSelect={setCurrentSubagent}
          loading={msgLoading}
          error={msgError}
        />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
