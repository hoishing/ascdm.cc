import { useState, useEffect } from "react";
import { useClaudeDir } from "./useClaudeDir";
import type { Project } from "../lib/types";

export function useProjects() {
  const { getSource, refreshCounter, isConnected } = useClaudeDir();
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isConnected) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    getSource().listProjects().then(
      (data) => {
        if (!cancelled) {
          setProjects(data);
          setLoading(false);
        }
      },
      (err) => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      },
    );

    return () => { cancelled = true; };
  }, [isConnected, refreshCounter, getSource]);

  return { projects, loading, error };
}
