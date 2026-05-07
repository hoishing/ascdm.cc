import { useState, useEffect } from "react";
import { useClaudeDir } from "./useClaudeDir";
import type { Message, SessionInfo, SubagentEntry } from "../lib/types";

export function useSessionMessages(
  projectDir: string | null,
  sessionId: string | null,
  subagentId?: string | null,
) {
  const { getSource, isConnected } = useClaudeDir();
  const [messages, setMessages] = useState<Message[]>([]);
  const [info, setInfo] = useState<SessionInfo | null>(null);
  const [subagents, setSubagents] = useState<SubagentEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isConnected || !projectDir || !sessionId) {
      setMessages([]);
      setInfo(null);
      setSubagents([]);
      return;
    }

    const source = getSource();

    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const [infoData, subagentData] = await Promise.all([
          source.getSessionInfo(projectDir, sessionId),
          source.getSubagentSessions(projectDir, sessionId).catch(() => []),
        ]);

        if (cancelled) return;
        setInfo(infoData);
        setSubagents(subagentData);

        let msgs: Message[];
        if (subagentId) {
          msgs = await source.getSubagentMessages(projectDir, sessionId, subagentId);
        } else {
          msgs = await source.getSessionMessages(projectDir, sessionId);
        }

        if (!cancelled) {
          setMessages(msgs);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load session");
          setLoading(false);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [isConnected, projectDir, sessionId, subagentId, getSource]);

  return { messages, info, subagents, loading, error };
}
