import type { Project, SearchResult, SearchOptions } from "../lib/types";
import type { FileOps } from "../lib/file-ops";
import { parseJsonl, extractSearchableText, extractMatchContext } from "../lib/parsers";

function filterProjects(projects: Project[], projectFilter?: string): Project[] {
  if (!projectFilter) return projects;
  return projects.filter(
    (p) => p.encodedDir === projectFilter || p.projectPath === projectFilter,
  );
}

export interface DeepSearchOptions extends SearchOptions {
  onProgress?: (results: SearchResult[], scanned: number, total: number) => void;
  abortSignal?: AbortSignal;
}

export async function localDeepSearchSessions(
  fs: FileOps,
  projects: Project[],
  query: string,
  opts: DeepSearchOptions = {},
): Promise<SearchResult[]> {
  const limit = opts.limit || 50;
  const needle = query.toLowerCase();
  const results: SearchResult[] = [];
  const filtered = filterProjects(projects, opts.project);

  let totalSessions = 0;
  for (const project of filtered) totalSessions += project.sessions.length;
  let scanned = 0;

  console.log(`[deep-search] query="${query}" projects=${filtered.length} sessions=${totalSessions}`);

  for (const project of filtered) {
    for (const session of project.sessions) {
      if (opts.abortSignal?.aborted) return results;
      scanned++;

      let bestScore = 0;
      let bestContext = "";
      let bestSource: "metadata" | "content" | "subagent" = "metadata";
      let bestSubagentId: string | undefined;

      const prompt = session.firstPrompt || "";
      const summary = session.summary || "";

      // 1. Metadata match (same as quick search)
      if (prompt.toLowerCase().includes(needle)) {
        bestScore += 10;
        bestContext = prompt.slice(0, 200);
      }
      if (summary.toLowerCase().includes(needle)) {
        bestScore += 5;
        if (!bestContext) bestContext = summary;
      }

      // 2. Main session JSONL — raw text check first to skip parsing
      const rawText = await fs.readText(
        "projects", project.encodedDir, session.sessionId + ".jsonl",
      );
      const rawLower = rawText?.toLowerCase();
      if (rawLower && rawLower.includes(needle)) {
        const messages = parseJsonl(rawText!);
        for (const msg of messages) {
          if (msg.type !== "user" && msg.type !== "assistant") continue;
          const msgText = extractSearchableText(msg);
          if (msgText.toLowerCase().includes(needle)) {
            const contentScore = msg.type === "user" ? 8 : 6;
            if (bestSource === "metadata" || contentScore > bestScore) {
              bestScore = Math.max(bestScore, contentScore);
              bestContext = extractMatchContext(msgText, query);
              bestSource = "content";
            } else {
              bestScore += 1;
            }
            break; // one content match per session is enough for context
          }
        }
      }

      // 3. Subagent JSONL files
      let subEntries: { name: string; kind: string }[];
      try {
        subEntries = await fs.listDir(
          "projects", project.encodedDir, session.sessionId, "subagents",
        );
        if (subEntries.length > 0) {
          console.log(`[deep-search] session=${session.sessionId.slice(0, 8)}… subagents=${subEntries.length}`);
        }
      } catch (err) {
        console.warn(`[deep-search] subagent dir failed for ${session.sessionId}:`, err);
        subEntries = [];
      }
      for (const entry of subEntries) {
        if (opts.abortSignal?.aborted) return results;
        if (!entry.name.endsWith(".jsonl")) continue;
        const match = entry.name.match(/^agent-(.+)\.jsonl$/);
        if (!match) continue;

        const agentRaw = await fs.readText(
          "projects", project.encodedDir,
          session.sessionId, "subagents", entry.name,
        );
        if (!agentRaw) continue;
        const agentLower = agentRaw.toLowerCase();
        if (!agentLower.includes(needle)) continue;
        console.log(`[deep-search] raw match in subagent ${entry.name} of session ${session.sessionId.slice(0, 8)}…`);

        const agentMessages = parseJsonl(agentRaw);
        for (const msg of agentMessages) {
          if (msg.type !== "user" && msg.type !== "assistant") continue;
          const msgText = extractSearchableText(msg);
          if (msgText.toLowerCase().includes(needle)) {
            if (bestSource !== "content") {
              bestScore = Math.max(bestScore, 4);
              bestContext = extractMatchContext(msgText, query);
              bestSource = "subagent";
              bestSubagentId = match[1];
            } else {
              bestScore += 1;
            }
            break;
          }
        }
        if (bestSource === "subagent") break; // one subagent match is enough
      }

      if (bestScore > 0) {
        console.log(`[deep-search] MATCH session=${session.sessionId.slice(0, 8)}… score=${bestScore} source=${bestSource}`);
        results.push({
          sessionId: session.sessionId,
          projectDir: project.encodedDir,
          projectPath: project.projectPath,
          firstPrompt: prompt,
          summary,
          matchContext: bestContext,
          score: bestScore,
          modified: session.modified || session.created || "",
          matchSource: bestSource,
          subagentId: bestSubagentId,
        });
      }

      if (opts.onProgress && (scanned % 5 === 0 || bestScore > 0)) {
        const sorted = [...results].sort((a, b) => b.score - a.score).slice(0, limit);
        opts.onProgress(sorted, scanned, totalSessions);
      }

      // Yield to event loop every few sessions
      if (scanned % 3 === 0) await new Promise((r) => setTimeout(r, 0));
    }
  }

  results.sort((a, b) => b.score - a.score);
  console.log(`[deep-search] done. scanned=${scanned} results=${results.length}`);
  return results.slice(0, limit);
}

export function localSearchSessions(
  projects: Project[],
  query: string,
  opts: SearchOptions = {},
): SearchResult[] {
  const limit = opts.limit || 50;
  const needle = query.toLowerCase();
  const results: SearchResult[] = [];
  const filtered = filterProjects(projects, opts.project);

  for (const project of filtered) {
    for (const session of project.sessions) {
      let score = 0;
      let matchContext = "";
      const prompt = session.firstPrompt || "";
      const summary = session.summary || "";
      if (prompt.toLowerCase().includes(needle)) {
        score += 10;
        matchContext = prompt.slice(0, 200);
      }
      if (summary.toLowerCase().includes(needle)) {
        score += 5;
        if (!matchContext) matchContext = summary;
      }
      if (score > 0) {
        results.push({
          sessionId: session.sessionId,
          projectDir: project.encodedDir,
          projectPath: project.projectPath,
          firstPrompt: prompt,
          summary,
          matchContext,
          score,
        });
      }
    }
  }
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit);
}

export function localListAllSessions(
  projects: Project[],
  opts: SearchOptions = {},
): SearchResult[] {
  const limit = opts.limit || 50;
  const filtered = filterProjects(projects, opts.project);
  const results: SearchResult[] = [];
  for (const project of filtered) {
    for (const session of project.sessions) {
      results.push({
        sessionId: session.sessionId,
        projectDir: project.encodedDir,
        projectPath: project.projectPath,
        firstPrompt: session.firstPrompt || "",
        summary: session.summary || "",
        matchContext: "",
        score: 0,
        modified: session.modified || session.created || "",
      });
    }
  }
  results.sort((a, b) => (b.modified || "").localeCompare(a.modified || ""));
  return results.slice(0, limit);
}
