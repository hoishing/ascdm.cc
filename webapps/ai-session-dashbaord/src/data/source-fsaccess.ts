import type { DataSource } from "./source";
import type { FileOps } from "../lib/file-ops";
import type { SessionKind } from "../lib/types";
import { createFsaFileOps } from "../lib/file-ops-fsa";
import {
  localListProjects,
  localGetSessionInfo,
  localGetSessionMessages,
  localGetSubagentSessions,
  localGetSubagentMessages,
  localGetHistory,
} from "./claude-api";
import {
  codexDeepSearchSessions,
  codexGetSessionInfo,
  codexGetSessionMessages,
  codexGetSubagentMessages,
  codexGetSubagentSessions,
  codexListProjects,
  codexListPlanSlugs,
  codexLoadPlansForSession,
  codexScanSessionsForPlans,
  codexSearchPlans,
} from "./codex-api";
import { localDeepSearchSessions, type DeepSearchOptions } from "./search";
import {
  listPlanSlugs as listPlanSlugsImpl,
  scanSessionsForPlans as scanSessionsForPlansImpl,
  loadPlansForSession as loadPlansForSessionImpl,
  searchPlans as searchPlansImpl,
} from "./plan-api";

export function createFsAccessSource(
  kind: SessionKind,
  getDir: () => FileSystemDirectoryHandle | null,
): DataSource {
  function fs(): FileOps {
    const dir = getDir();
    if (!dir) throw new Error(`Not connected to a ~/.${kind} directory`);
    return createFsaFileOps(dir);
  }

  if (kind === "codex") {
    return {
      kind,
      mode: "static",
      capabilities: { canPickDirectory: true },

      listProjects: () => codexListProjects(fs()),
      getSessionInfo: (p, s) => codexGetSessionInfo(fs(), p, s),
      getSessionMessages: (p, s) => codexGetSessionMessages(fs(), p, s),
      getSubagentSessions: () => codexGetSubagentSessions(),
      getSubagentMessages: () => codexGetSubagentMessages(),
      getHistory: async () => [],

      deepSearch: (projects, query, opts: DeepSearchOptions) =>
        codexDeepSearchSessions(fs(), projects, query, opts),

      listPlanSlugs: () => codexListPlanSlugs(fs()),
      scanSessionsForPlans: () => codexScanSessionsForPlans(fs()),
      loadPlansForSession: (slugs) => codexLoadPlansForSession(fs(), slugs),
      searchPlans: (query) => codexSearchPlans(fs(), query),
    };
  }

  return {
    kind,
    mode: "static",
    capabilities: { canPickDirectory: true },

    listProjects: () => localListProjects(fs()),
    getSessionInfo: (p, s) => localGetSessionInfo(fs(), p, s),
    getSessionMessages: (p, s) => localGetSessionMessages(fs(), p, s),
    getSubagentSessions: (p, s) => localGetSubagentSessions(fs(), p, s),
    getSubagentMessages: (p, s, a) => localGetSubagentMessages(fs(), p, s, a),
    getHistory: () => localGetHistory(fs()),

    deepSearch: (projects, query, opts: DeepSearchOptions) =>
      localDeepSearchSessions(fs(), projects, query, opts),

    listPlanSlugs: () => listPlanSlugsImpl(fs()),
    scanSessionsForPlans: (projects, slugs) =>
      scanSessionsForPlansImpl(fs(), projects, slugs),
    loadPlansForSession: (slugs) => loadPlansForSessionImpl(fs(), slugs),
    searchPlans: (query) => searchPlansImpl(fs(), query),
  };
}
