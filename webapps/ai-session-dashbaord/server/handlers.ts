import type { NodeFileOps } from "./fs-node";
import {
  localListProjects,
  localGetSessionInfo,
  localGetSessionMessages,
  localGetSubagentSessions,
  localGetSubagentMessages,
  localGetHistory,
} from "../src/data/claude-api";
import {
  codexDeepSearchSessions,
  codexGetSessionInfo,
  codexGetSessionMessages,
  codexGetSubagentMessages,
  codexGetSubagentSessions,
  codexListPlanSlugs,
  codexListProjects,
  codexLoadPlansForSession,
  codexScanSessionsForPlans,
  codexSearchPlans,
} from "../src/data/codex-api";
import { localDeepSearchSessions } from "../src/data/search";
import {
  listPlanSlugs,
  scanSessionsForPlans,
  loadPlansForSession,
  searchPlans,
} from "../src/data/plan-api";
import type { SessionKind } from "../src/lib/types";

function json(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init.headers ?? {}),
    },
  });
}

function notFound(): Response {
  return new Response("Not found", { status: 404 });
}

function methodNotAllowed(): Response {
  return new Response("Method not allowed", { status: 405 });
}

function serverError(e: unknown): Response {
  const msg = e instanceof Error ? e.message : String(e);
  console.error("[server] error:", msg);
  return new Response(msg, { status: 500 });
}

export async function handleApi(
  roots: Record<SessionKind, NodeFileOps>,
  url: URL,
  req: Request,
): Promise<Response | null> {
  const pathname = url.pathname;
  if (!pathname.startsWith("/api/")) return null;
  const rawRest = pathname.slice("/api/".length);
  if (rawRest === "caps" && req.method === "GET") {
    return json({
      serverMode: true,
      capabilities: { canPickDirectory: false },
      sources: ["claude", "codex"],
    });
  }

  const rawSegs = rawRest.split("/");
  const maybeKind = rawSegs[0];
  const kind: SessionKind = maybeKind === "codex" ? "codex" : "claude";
  const rest =
    maybeKind === "codex" || maybeKind === "claude"
      ? rawSegs.slice(1).join("/")
      : rawRest;
  const segs = rest.split("/").map(decodeURIComponent);
  const fs = roots[kind];

  try {
    // /api/projects
    if (rest === "projects" && req.method === "GET") {
      return json(kind === "codex" ? await codexListProjects(fs) : await localListProjects(fs));
    }

    // /api/history
    if (rest === "history" && req.method === "GET") {
      return json(kind === "codex" ? [] : await localGetHistory(fs));
    }

    // /api/search?q=...&project=...&limit=...
    if (rest.startsWith("search") && segs[0] === "search" && req.method === "GET") {
      const query = url.searchParams.get("q") ?? "";
      if (!query) return json([]);
      const project = url.searchParams.get("project") ?? undefined;
      const limit = Number(url.searchParams.get("limit")) || 50;
      const projects = kind === "codex" ? await codexListProjects(fs) : await localListProjects(fs);
      const results = kind === "codex"
        ? await codexDeepSearchSessions(fs, projects, query, {
            project,
            limit,
            abortSignal: req.signal,
          })
        : await localDeepSearchSessions(fs, projects, query, {
            project,
            limit,
            abortSignal: req.signal,
          });
      return json(results);
    }

    // /api/plans
    if (rest === "plans" && req.method === "GET") {
      return json(Array.from(kind === "codex" ? await codexListPlanSlugs(fs) : await listPlanSlugs(fs)));
    }

    // /api/plans/scan
    if (rest === "plans/scan" && req.method === "GET") {
      if (kind === "codex") return json(await codexScanSessionsForPlans(fs));
      const [projects, slugs] = await Promise.all([
        localListProjects(fs),
        listPlanSlugs(fs),
      ]);
      if (slugs.size === 0) return json([]);
      return json(await scanSessionsForPlans(fs, projects, slugs));
    }

    // /api/plans/load?slugs=a,b,c
    if (rest === "plans/load" && req.method === "GET") {
      const raw = url.searchParams.get("slugs") ?? "";
      const slugs = raw ? raw.split(",").filter(Boolean) : [];
      return json(kind === "codex" ? await codexLoadPlansForSession(fs, slugs) : await loadPlansForSession(fs, slugs));
    }

    // /api/plans/search?q=...
    if (rest === "plans/search" && req.method === "GET") {
      const query = url.searchParams.get("q") ?? "";
      return json(kind === "codex" ? await codexSearchPlans(fs, query) : await searchPlans(fs, query));
    }

    // /api/session/:projectDir/:sessionId (GET info)
    if (segs[0] === "session" && segs.length === 3) {
      const [, projectDir, sessionId] = segs;
      if (req.method === "GET") {
        return json(kind === "codex"
          ? await codexGetSessionInfo(fs, projectDir, sessionId)
          : await localGetSessionInfo(fs, projectDir, sessionId));
      }
      return methodNotAllowed();
    }

    // /api/session/:projectDir/:sessionId/messages
    if (segs[0] === "session" && segs.length === 4 && segs[3] === "messages") {
      if (req.method !== "GET") return methodNotAllowed();
      return json(kind === "codex"
        ? await codexGetSessionMessages(fs, segs[1], segs[2])
        : await localGetSessionMessages(fs, segs[1], segs[2]));
    }

    // /api/session/:projectDir/:sessionId/subagents
    if (segs[0] === "session" && segs.length === 4 && segs[3] === "subagents") {
      if (req.method !== "GET") return methodNotAllowed();
      return json(kind === "codex"
        ? await codexGetSubagentSessions()
        : await localGetSubagentSessions(fs, segs[1], segs[2]));
    }

    // /api/session/:projectDir/:sessionId/subagents/:agentId/messages
    if (
      segs[0] === "session" &&
      segs.length === 6 &&
      segs[3] === "subagents" &&
      segs[5] === "messages"
    ) {
      if (req.method !== "GET") return methodNotAllowed();
      return json(
        kind === "codex"
          ? await codexGetSubagentMessages()
          : await localGetSubagentMessages(fs, segs[1], segs[2], segs[4]),
      );
    }

    return notFound();
  } catch (e) {
    return serverError(e);
  }
}
