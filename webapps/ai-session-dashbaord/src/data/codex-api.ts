import type {
  ContentBlock,
  Message,
  PlanEntry,
  Project,
  ProjectWithPlans,
  SearchResult,
  SessionEntry,
  SessionInfo,
  SessionWithPlans,
  SubagentEntry,
} from "../lib/types";
import type { FileOps } from "../lib/file-ops";
import {
  encodeProjectPath,
  extractFirstPrompt,
  extractMatchContext,
  extractSearchableText,
  normalizeTimestamp,
  parseJsonl,
} from "../lib/parsers";
import type { DeepSearchOptions } from "./search";

interface CodexSessionMeta {
  id: string;
  cwd: string;
  timestamp: string;
  gitBranch?: string;
}

interface CodexSessionIndexEntry extends CodexSessionMeta {
  sourcePath: string[];
  isArchived: boolean;
  firstPrompt: string;
  summary: string;
  messageCount: number;
  created: string;
  modified: string;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function arrayValue(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function jsonString(value: unknown): string {
  return typeof value === "string" ? value : JSON.stringify(value, null, 2);
}

function parseArguments(value: unknown): unknown {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function toTextBlocks(content: unknown, allowedTypes: Set<string>): ContentBlock[] {
  const blocks: ContentBlock[] = [];
  for (const item of arrayValue(content)) {
    const rec = asRecord(item);
    if (!rec) continue;
    const type = stringValue(rec.type);
    if (type && allowedTypes.has(type) && typeof rec.text === "string") {
      blocks.push({ type: "text", text: rec.text });
    }
  }
  return blocks;
}

function textFromBlocks(blocks: ContentBlock[]): string {
  return blocks
    .map((block) => block.type === "text" ? block.text ?? "" : "")
    .join("\n")
    .trim();
}

function normalizeForDedupe(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function isBootstrapUserText(text: string): boolean {
  const trimmed = text.trim();
  return trimmed.startsWith("# AGENTS.md instructions")
    || trimmed.startsWith("<environment_context>")
    || trimmed.startsWith("<INSTRUCTIONS>")
    || trimmed.includes("\n<INSTRUCTIONS>")
    || trimmed.includes("\n<environment_context>");
}

function normalizeCodexRecord(record: Message): Message[] {
  const raw = record as unknown;
  const rec = asRecord(raw);
  if (!rec) return [];
  const timestamp = normalizeTimestamp(rec.timestamp as string | number | Date | undefined);
  const payload = asRecord(rec.payload);
  if (!payload) return [];

  if (rec.type === "event_msg" && payload.type === "user_message") {
    const message = stringValue(payload.message);
    if (!message || isBootstrapUserText(message)) return [];
    return [{
      type: "user",
      timestamp,
      message: { content: message },
    }];
  }

  if (rec.type !== "response_item") return [];

  if (payload.type === "message") {
    if (payload.role !== "user" && payload.role !== "assistant") return [];
    const role = payload.role === "user" ? "user" : "assistant";
    const blocks = toTextBlocks(
      payload.content,
      role === "user" ? new Set(["input_text"]) : new Set(["output_text"]),
    );
    if (blocks.length === 0) return [];
    if (role === "user" && isBootstrapUserText(textFromBlocks(blocks))) return [];
    return [{
      type: role,
      timestamp,
      message: { content: blocks },
    }];
  }

  if (payload.type === "reasoning") {
    const summary = arrayValue(payload.summary)
      .map((item) => {
        const recItem = asRecord(item);
        return recItem ? stringValue(recItem.text) ?? "" : "";
      })
      .filter(Boolean)
      .join("\n");
    const content = arrayValue(payload.content)
      .map((item) => {
        const recItem = asRecord(item);
        return recItem ? stringValue(recItem.text) ?? "" : "";
      })
      .filter(Boolean)
      .join("\n");
    const thinking = summary || content;
    if (!thinking) return [];
    return [{
      type: "assistant",
      timestamp,
      message: { content: [{ type: "thinking", thinking }] },
    }];
  }

  if (payload.type === "function_call" || payload.type === "custom_tool_call") {
    return [{
      type: "assistant",
      timestamp,
      message: {
        content: [{
          type: "tool_use",
          name: stringValue(payload.name) ?? "tool",
          input: parseArguments(payload.arguments ?? payload.input),
        }],
      },
    }];
  }

  if (payload.type === "function_call_output" || payload.type === "custom_tool_call_output") {
    return [{
      type: "assistant",
      timestamp,
      message: {
        content: [{
          type: "tool_result",
          content: jsonString(payload.output),
        }],
      },
    }];
  }

  return [];
}

function normalizeCodexRecords(rawMessages: Message[]): Message[] {
  const messages: Message[] = [];
  const seenUserTexts = new Set<string>();
  for (const msg of rawMessages) {
    for (const normalized of normalizeCodexRecord(msg)) {
      if (normalized.type === "user") {
        const content = normalized.message?.content;
        const text = typeof content === "string"
          ? content
          : Array.isArray(content)
            ? textFromBlocks(content)
            : "";
        const key = normalizeForDedupe(text);
        if (!key || seenUserTexts.has(key)) continue;
        seenUserTexts.add(key);
      }
      messages.push(normalized);
    }
  }
  return messages;
}

function extractAssistantTextBlocks(rawMessages: Message[]): string[] {
  const texts: string[] = [];
  for (const msg of rawMessages) {
    const rec = asRecord(msg);
    const payload = asRecord(rec?.payload);
    if (rec?.type !== "response_item" || payload?.type !== "message" || payload.role !== "assistant") {
      continue;
    }
    const text = textFromBlocks(toTextBlocks(payload.content, new Set(["output_text"])));
    if (text) texts.push(text);
  }
  return texts;
}

function readSessionMeta(rawMessages: Message[], fallbackPath: string[]): CodexSessionMeta | null {
  const metaRecord = rawMessages.find((msg) => {
    const rec = asRecord(msg);
    return rec?.type === "session_meta";
  });
  const meta = asRecord(asRecord(metaRecord)?.payload);
  const id = stringValue(meta?.id);
  if (!id) return null;
  const cwd = stringValue(meta?.cwd) ?? "Unknown project";
  const git = asRecord(meta?.git);
  return {
    id,
    cwd,
    timestamp: stringValue(meta?.timestamp) ?? fallbackPath.join("/"),
    gitBranch: stringValue(git?.branch),
  };
}

async function walkJsonlFiles(fs: FileOps, ...base: string[]): Promise<string[][]> {
  const found: string[][] = [];
  const entries = await fs.listDir(...base);
  for (const entry of entries) {
    const next = [...base, entry.name];
    if (entry.kind === "directory") {
      found.push(...await walkJsonlFiles(fs, ...next));
    } else if (entry.kind === "file" && entry.name.endsWith(".jsonl")) {
      found.push(next);
    }
  }
  return found;
}

async function readCodexSession(fs: FileOps, sourcePath: string[]): Promise<CodexSessionIndexEntry | null> {
  const text = await fs.readText(...sourcePath);
  if (!text) return null;
  const rawMessages = parseJsonl(text);
  const meta = readSessionMeta(rawMessages, sourcePath);
  if (!meta) return null;
  const messages = normalizeCodexRecords(rawMessages);
  const timestamps = messages
    .map((msg) => normalizeTimestamp(msg.timestamp))
    .filter(Boolean)
    .sort();
  const firstPrompt = extractFirstPrompt(messages);
  return {
    ...meta,
    sourcePath,
    isArchived: sourcePath[0] === "archived_sessions",
    firstPrompt,
    summary: "",
    messageCount: messages.filter((msg) => msg.type === "user" || msg.type === "assistant").length,
    created: timestamps[0] || meta.timestamp,
    modified: timestamps[timestamps.length - 1] || meta.timestamp,
  };
}

async function listCodexSessions(fs: FileOps): Promise<CodexSessionIndexEntry[]> {
  const files = [
    ...await walkJsonlFiles(fs, "sessions"),
    ...await walkJsonlFiles(fs, "archived_sessions"),
  ];
  const sessions: CodexSessionIndexEntry[] = [];
  for (const file of files) {
    const session = await readCodexSession(fs, file);
    if (session) sessions.push(session);
  }
  const byId = new Map<string, CodexSessionIndexEntry>();
  for (const session of sessions) {
    const existing = byId.get(session.id);
    if (!existing || (existing.isArchived && !session.isArchived)) {
      byId.set(session.id, session);
    }
  }
  const deduped = [...byId.values()];
  deduped.sort((a, b) => (b.modified || "").localeCompare(a.modified || ""));
  return deduped;
}

async function findCodexSession(
  fs: FileOps,
  projectDir: string,
  sessionId: string,
): Promise<CodexSessionIndexEntry | null> {
  const sessions = await listCodexSessions(fs);
  return sessions.find(
    (session) => session.id === sessionId && encodeProjectPath(session.cwd) === projectDir,
  ) ?? sessions.find((session) => session.id === sessionId) ?? null;
}

async function readNormalizedMessagesFromPath(
  fs: FileOps,
  sourcePath: string[],
): Promise<Message[]> {
  const text = await fs.readText(...sourcePath);
  if (!text) return [];
  return normalizeCodexRecords(parseJsonl(text));
}

async function readAssistantTextsFromPath(
  fs: FileOps,
  sourcePath: string[],
): Promise<string[]> {
  const text = await fs.readText(...sourcePath);
  if (!text) return [];
  return extractAssistantTextBlocks(parseJsonl(text));
}

export async function codexListProjects(fs: FileOps): Promise<Project[]> {
  const sessions = await listCodexSessions(fs);
  const byProject = new Map<string, Project>();
  for (const session of sessions) {
    const encodedDir = encodeProjectPath(session.cwd);
    const project = byProject.get(encodedDir) ?? {
      kind: "codex" as const,
      encodedDir,
      projectPath: session.cwd,
      sessions: [],
    };
    const entry: SessionEntry = {
      kind: "codex",
      sessionId: session.id,
      projectPath: session.cwd,
      sourcePath: session.sourcePath,
      isArchived: session.isArchived,
      firstPrompt: session.firstPrompt,
      summary: session.summary,
      messageCount: session.messageCount,
      created: session.created,
      modified: session.modified,
      gitBranch: session.gitBranch,
    };
    project.sessions.push(entry);
    byProject.set(encodedDir, project);
  }
  const projects = [...byProject.values()];
  projects.sort((a, b) => {
    const aMax = Math.max(0, ...a.sessions.map((s) => new Date(s.modified || 0).getTime() || 0));
    const bMax = Math.max(0, ...b.sessions.map((s) => new Date(s.modified || 0).getTime() || 0));
    return bMax - aMax;
  });
  return projects;
}

export async function codexGetSessionMessages(
  fs: FileOps,
  projectDir: string,
  sessionId: string,
): Promise<Message[]> {
  const session = await findCodexSession(fs, projectDir, sessionId);
  if (!session) return [];
  return readNormalizedMessagesFromPath(fs, session.sourcePath);
}

export async function codexGetSessionInfo(
  fs: FileOps,
  projectDir: string,
  sessionId: string,
): Promise<SessionInfo> {
  const session = await findCodexSession(fs, projectDir, sessionId);
  if (!session) {
    return {
      kind: "codex",
      sessionId,
      projectDir,
      projectPath: projectDir,
      firstPrompt: "No prompt",
      summary: "",
      messageCount: 0,
      created: "",
      modified: "",
    };
  }
  return {
    kind: "codex",
    sessionId: session.id,
    projectDir: encodeProjectPath(session.cwd),
    projectPath: session.cwd,
    isArchived: session.isArchived,
    firstPrompt: session.firstPrompt,
    summary: session.summary,
    messageCount: session.messageCount,
    created: session.created,
    modified: session.modified,
    gitBranch: session.gitBranch,
  };
}

export async function codexDeepSearchSessions(
  fs: FileOps,
  projects: Project[],
  query: string,
  opts: DeepSearchOptions = {},
): Promise<SearchResult[]> {
  const limit = opts.limit || 50;
  const needle = query.toLowerCase();
  const results: SearchResult[] = [];
  const filtered = opts.project
    ? projects.filter((p) => p.encodedDir === opts.project || p.projectPath === opts.project)
    : projects;
  let scanned = 0;
  const total = filtered.reduce((sum, project) => sum + project.sessions.length, 0);

  for (const project of filtered) {
    for (const session of project.sessions) {
      if (opts.abortSignal?.aborted) return results;
      scanned++;
      let score = 0;
      let context = "";
      let source: SearchResult["matchSource"] = "metadata";
      const prompt = session.firstPrompt || "";
      if (prompt.toLowerCase().includes(needle)) {
        score = 10;
        context = prompt.slice(0, 200);
      }

      const messages = session.sourcePath
        ? await readNormalizedMessagesFromPath(fs, session.sourcePath)
        : await codexGetSessionMessages(fs, project.encodedDir, session.sessionId);
      for (const msg of messages) {
        const text = extractSearchableText(msg);
        if (!text.toLowerCase().includes(needle)) continue;
        const contentScore = msg.type === "user" ? 8 : 6;
        if (score === 0 || contentScore > score) {
          score = contentScore;
          context = extractMatchContext(text, query);
          source = "content";
        }
        break;
      }

      if (score > 0) {
        results.push({
          kind: "codex",
          sessionId: session.sessionId,
          projectDir: project.encodedDir,
          projectPath: project.projectPath,
          isArchived: session.isArchived,
          firstPrompt: prompt,
          summary: session.summary,
          matchContext: context,
          score,
          modified: session.modified || session.created,
          matchSource: source,
        });
      }
      if (opts.onProgress && (scanned % 5 === 0 || score > 0)) {
        opts.onProgress([...results].sort((a, b) => b.score - a.score).slice(0, limit), scanned, total);
      }
    }
  }
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit);
}

export async function codexGetSubagentSessions(): Promise<SubagentEntry[]> {
  return [];
}

export async function codexGetSubagentMessages(): Promise<Message[]> {
  return [];
}

function extractProposedPlans(text: string): string[] {
  return [...text.matchAll(/^[ \t]*<proposed_plan>[ \t]*\r?\n([\s\S]*?)\r?\n[ \t]*<\/proposed_plan>[ \t]*$/gm)]
    .map((match) => match[1]?.trim())
    .filter((plan): plan is string => Boolean(plan));
}

function planTitle(content: string, fallback: string): string {
  const heading = content.match(/^#\s+(.+)$/m);
  return heading?.[1]?.trim() || fallback || "Untitled Plan";
}

export async function codexListPlanSlugs(fs: FileOps): Promise<Set<string>> {
  const projects = await codexScanSessionsForPlans(fs);
  return new Set(projects.flatMap((p) => p.sessionsWithPlans.flatMap((s) => s.slugs)));
}

export async function codexScanSessionsForPlans(fs: FileOps): Promise<ProjectWithPlans[]> {
  const projects = await codexListProjects(fs);
  const result: ProjectWithPlans[] = [];
  for (const project of projects) {
    const sessionsWithPlans: SessionWithPlans[] = [];
    for (const session of project.sessions) {
      const assistantTexts = session.sourcePath
        ? await readAssistantTextsFromPath(fs, session.sourcePath)
        : [];
      const text = assistantTexts.join("\n");
      const plans = extractProposedPlans(text);
      if (plans.length === 0) continue;
      sessionsWithPlans.push({
        kind: "codex",
        sessionId: session.sessionId,
        projectDir: project.encodedDir,
        isArchived: session.isArchived,
        modified: session.modified,
        firstPrompt: session.firstPrompt,
        slugs: plans.map((_, index) => `codex-plan:${session.sessionId}:${index}`),
      });
    }
    if (sessionsWithPlans.length > 0) {
      result.push({
        kind: "codex",
        encodedDir: project.encodedDir,
        projectPath: project.projectPath,
        sessionsWithPlans,
      });
    }
  }
  return result;
}

export async function codexLoadPlansForSession(
  fs: FileOps,
  slugs: string[],
): Promise<PlanEntry[]> {
  const wanted = new Set(slugs);
  const projects = await codexListProjects(fs);
  const plans: PlanEntry[] = [];
  for (const project of projects) {
    for (const session of project.sessions) {
      const assistantTexts = session.sourcePath
        ? await readAssistantTextsFromPath(fs, session.sourcePath)
        : [];
      const extracted = extractProposedPlans(assistantTexts.join("\n"));
      extracted.forEach((content, index) => {
        const slug = `codex-plan:${session.sessionId}:${index}`;
        if (!wanted.has(slug)) return;
        plans.push({
          slug,
          title: planTitle(content, session.firstPrompt || session.sessionId),
          content,
        });
      });
    }
  }
  return plans;
}

export async function codexSearchPlans(
  fs: FileOps,
  query: string,
): Promise<PlanEntry[]> {
  const needle = query.trim().toLowerCase();
  const projects = await codexScanSessionsForPlans(fs);
  const allSlugs = projects.flatMap((p) => p.sessionsWithPlans.flatMap((s) => s.slugs));
  const plans = await codexLoadPlansForSession(fs, allSlugs);
  if (!needle) return plans;
  return plans.filter(
    (plan) =>
      plan.title.toLowerCase().includes(needle) ||
      plan.content.toLowerCase().includes(needle),
  );
}
