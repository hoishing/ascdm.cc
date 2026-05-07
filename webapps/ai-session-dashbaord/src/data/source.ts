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
import type { DeepSearchOptions } from "./search";

export type DataSourceMode = "static" | "server";

export interface DataSourceCapabilities {
  canPickDirectory: boolean;
}

export interface DataSource {
  kind: SessionKind;
  mode: DataSourceMode;
  capabilities: DataSourceCapabilities;

  listProjects(): Promise<Project[]>;
  getSessionInfo(projectDir: string, sessionId: string): Promise<SessionInfo>;
  getSessionMessages(projectDir: string, sessionId: string): Promise<Message[]>;
  getSubagentSessions(projectDir: string, sessionId: string): Promise<SubagentEntry[]>;
  getSubagentMessages(
    projectDir: string,
    sessionId: string,
    agentId: string,
  ): Promise<Message[]>;
  getHistory(): Promise<HistoryEntry[]>;

  deepSearch(
    projects: Project[],
    query: string,
    opts: DeepSearchOptions,
  ): Promise<SearchResult[]>;

  listPlanSlugs(): Promise<Set<string>>;
  scanSessionsForPlans(
    projects: Project[],
    slugs: Set<string>,
  ): Promise<ProjectWithPlans[]>;
  loadPlansForSession(slugs: string[]): Promise<PlanEntry[]>;
  searchPlans(query: string): Promise<PlanEntry[]>;
}

declare global {
  interface Window {
    __AISD_SERVER_MODE__?: boolean;
    __AISD_CAPS__?: Partial<DataSourceCapabilities>;
  }
}

export function detectServerMode(): boolean {
  return typeof window !== "undefined" && window.__AISD_SERVER_MODE__ === true;
}
