import type {
  Project,
  SessionEntry,
  SessionInfo,
  Message,
  SubagentEntry,
  HistoryEntry,
} from "../lib/types";
import type { FileOps } from "../lib/file-ops";
import {
  parseJsonl,
  normalizeTimestamp,
  extractFirstPrompt,
  extractSummary,
  countConversationMessages,
  decodeProjectDir,
} from "../lib/parsers";

export async function localListProjects(fs: FileOps): Promise<Project[]> {
  const entries = await fs.listDir("projects");
  const projects: Project[] = [];

  for (const entry of entries) {
    if (entry.kind !== "directory") continue;
    const projDir = entry.name;

    const index = (await fs.readJson("projects", projDir, "sessions-index.json")) as {
      entries?: SessionEntry[];
    } | null;
    let sessionEntries: SessionEntry[] = index?.entries ?? [];

    if (sessionEntries.length === 0) {
      const files = await fs.listDir("projects", projDir);
      const jsonlFiles = files.filter(
        (f) => f.name.endsWith(".jsonl") && !f.name.startsWith("."),
      );
      const discovered: SessionEntry[] = [];

      for (const file of jsonlFiles) {
        const sessionId = file.name.replace(/\.jsonl$/, "");
        try {
          const text = await fs.readText("projects", projDir, file.name);
          if (!text) continue;
          const messages = parseJsonl(text);
          const timestamps = messages
            .map((m) => (m.timestamp ? normalizeTimestamp(m.timestamp) : ""))
            .filter(Boolean)
            .sort();
          discovered.push({
            sessionId,
            firstPrompt: extractFirstPrompt(messages),
            summary: extractSummary(messages),
            messageCount: countConversationMessages(messages),
            created: timestamps[0] || "",
            modified: timestamps[timestamps.length - 1] || "",
          });
        } catch {
          /* skip */
        }
      }
      sessionEntries = discovered;
    }

    const projectPath =
      sessionEntries[0]?.projectPath || decodeProjectDir(projDir);
    projects.push({
      encodedDir: projDir,
      projectPath,
      sessions: sessionEntries,
    });
  }

  projects.sort((a, b) => {
    const aMax = Math.max(
      0,
      ...a.sessions.map((s) => new Date(s.modified || 0).getTime() || 0),
    );
    const bMax = Math.max(
      0,
      ...b.sessions.map((s) => new Date(s.modified || 0).getTime() || 0),
    );
    return bMax - aMax;
  });

  return projects;
}

export async function localGetSessionMessages(
  fs: FileOps,
  projectDir: string,
  sessionId: string,
): Promise<Message[]> {
  const text = await fs.readText("projects", projectDir, sessionId + ".jsonl");
  return text ? parseJsonl(text) : [];
}

export async function localGetSessionInfo(
  fs: FileOps,
  projectDir: string,
  sessionId: string,
): Promise<SessionInfo> {
  const index = (await fs.readJson(
    "projects",
    projectDir,
    "sessions-index.json",
  )) as { entries?: SessionEntry[] } | null;
  if (index?.entries) {
    const entry = index.entries.find((e) => e.sessionId === sessionId);
    if (entry) {
      return {
        sessionId: entry.sessionId,
        projectDir,
        projectPath: entry.projectPath || decodeProjectDir(projectDir),
        firstPrompt: entry.firstPrompt,
        summary: entry.summary,
        messageCount: entry.messageCount,
        created: entry.created,
        modified: entry.modified,
        gitBranch: entry.gitBranch,
      };
    }
  }
  const messages = await localGetSessionMessages(fs, projectDir, sessionId);
  const timestamps = messages
    .map((m) => (m.timestamp ? normalizeTimestamp(m.timestamp) : ""))
    .filter(Boolean)
    .sort();
  return {
    sessionId,
    projectDir,
    projectPath: decodeProjectDir(projectDir),
    firstPrompt: extractFirstPrompt(messages),
    summary: extractSummary(messages),
    messageCount: countConversationMessages(messages),
    created: timestamps[0] || "",
    modified: timestamps[timestamps.length - 1] || "",
  };
}

export async function localGetHistory(fs: FileOps): Promise<HistoryEntry[]> {
  const text = await fs.readText("history.jsonl");
  if (!text) return [];
  const entries = parseJsonl(text) as unknown as HistoryEntry[];
  entries.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  return entries;
}

export async function localGetSubagentSessions(
  fs: FileOps,
  projectDir: string,
  sessionId: string,
): Promise<SubagentEntry[]> {
  const entries = await fs.listDir("projects", projectDir, sessionId, "subagents");
  const agents: SubagentEntry[] = [];
  for (const entry of entries) {
    if (!entry.name.endsWith(".jsonl")) continue;
    const match = entry.name.match(/^agent-(.+)\.jsonl$/);
    if (!match) continue;
    const agentId = match[1];
    let slug: string | undefined;
    try {
      const text = await fs.readTextPartial(
        512,
        "projects",
        projectDir,
        sessionId,
        "subagents",
        entry.name,
      );
      if (text) {
        const firstLine = text.split("\n")[0]?.trim();
        if (firstLine) slug = (JSON.parse(firstLine) as { slug?: string }).slug;
      }
    } catch {
      /* ignore */
    }
    agents.push({ agentId, slug });
  }
  return agents;
}

export async function localGetSubagentMessages(
  fs: FileOps,
  projectDir: string,
  sessionId: string,
  agentId: string,
): Promise<Message[]> {
  const text = await fs.readText(
    "projects",
    projectDir,
    sessionId,
    "subagents",
    "agent-" + agentId + ".jsonl",
  );
  return text ? parseJsonl(text) : [];
}
