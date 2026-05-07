import { useState, useEffect } from "react";
import { useClaudeDir } from "./useClaudeDir";
import { useProjects } from "./useProjects";
import type { ProjectWithPlans } from "../lib/types";

export function usePlans() {
  const { getSource, refreshCounter, isConnected } = useClaudeDir();
  const { projects, loading: projectsLoading } = useProjects();
  const [projectsWithPlans, setProjectsWithPlans] = useState<ProjectWithPlans[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isConnected || !projects) return;
    const source = getSource();

    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      const planSlugs = await source.listPlanSlugs();
      if (planSlugs.size === 0) {
        if (!cancelled) { setProjectsWithPlans([]); setLoading(false); }
        return;
      }
      const result = await source.scanSessionsForPlans(projects, planSlugs);
      if (!cancelled) {
        setProjectsWithPlans(result);
        setLoading(false);
      }
    })().catch((err) => {
      if (!cancelled) { setError(err.message); setLoading(false); }
    });

    return () => { cancelled = true; };
  }, [isConnected, refreshCounter, projects, getSource]);

  return { projectsWithPlans, loading: loading || projectsLoading, error };
}
