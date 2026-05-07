import type {
  Project,
  SessionInfo,
  Message,
  HistoryEntry,
  SubagentEntry,
  SearchResult,
  PlanEntry,
  ProjectWithPlans,
  SessionKind,
} from "../lib/types";
import type { DataSource } from "./source";
import type { DeepSearchOptions } from "./search";

async function httpJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`${url} failed: ${res.status}`);
  return (await res.json()) as T;
}

function q(...parts: string[]): string {
  return parts.map(encodeURIComponent).join("/");
}

export function createHttpSource(kind: SessionKind, baseUrl = ""): DataSource {
  const prefix = `${baseUrl}/api/${kind}`;

  return {
    kind,
    mode: "server",
    capabilities: { canPickDirectory: false },

    listProjects: () => httpJson<Project[]>(`${prefix}/projects`),

    getSessionInfo: (p, s) =>
      httpJson<SessionInfo>(`${prefix}/session/${q(p, s)}`),

    getSessionMessages: (p, s) =>
      httpJson<Message[]>(`${prefix}/session/${q(p, s)}/messages`),

    getSubagentSessions: (p, s) =>
      httpJson<SubagentEntry[]>(`${prefix}/session/${q(p, s)}/subagents`),

    getSubagentMessages: (p, s, a) =>
      httpJson<Message[]>(
        `${prefix}/session/${q(p, s)}/subagents/${encodeURIComponent(a)}/messages`,
      ),

    getHistory: () => httpJson<HistoryEntry[]>(`${prefix}/history`),

    async deepSearch(projects, query, opts: DeepSearchOptions) {
      const params = new URLSearchParams({ q: query });
      if (opts.project) params.set("project", opts.project);
      if (opts.limit) params.set("limit", String(opts.limit));
      const results = await httpJson<SearchResult[]>(
        `${prefix}/search?${params.toString()}`,
        { signal: opts.abortSignal },
      );
      // Deep HTTP search is one-shot — fire final progress callback so UI can clear.
      if (opts.onProgress) {
        let total = 0;
        const filter = opts.project;
        for (const p of projects) {
          if (filter && p.encodedDir !== filter && p.projectPath !== filter) continue;
          total += p.sessions.length;
        }
        opts.onProgress(results, total, total);
      }
      return results;
    },

    async listPlanSlugs() {
      const arr = await httpJson<string[]>(`${prefix}/plans`);
      return new Set(arr);
    },

    scanSessionsForPlans: () =>
      // Server walks its own filesystem; `projects` / `slugs` args unused.
      httpJson<ProjectWithPlans[]>(`${prefix}/plans/scan`),

    loadPlansForSession: (slugs) =>
      httpJson<PlanEntry[]>(
        `${prefix}/plans/load?slugs=${encodeURIComponent(slugs.join(","))}`,
      ),

    searchPlans: (query) =>
      httpJson<PlanEntry[]>(
        `${prefix}/plans/search?q=${encodeURIComponent(query)}`,
      ),
  };
}
