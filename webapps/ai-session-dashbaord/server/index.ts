import os from "node:os";
import path from "node:path";
import { promises as fsp } from "node:fs";
import { createNodeFileOps } from "./fs-node";
import { handleApi } from "./handlers";

const CLAUDE_DIR =
  process.env.AISD_CLAUDE_DIR ??
  process.env.CSD_CLAUDE_DIR ??
  path.join(os.homedir(), ".claude");
const CODEX_DIR =
  process.env.AISD_CODEX_DIR ??
  process.env.CSD_CODEX_DIR ??
  path.join(os.homedir(), ".codex");
const DIST_DIR = path.resolve(import.meta.dir, "..", "dist");
const BIND = process.env.AISD_BIND ?? process.env.CSD_BIND ?? "127.0.0.1";
const PORT = Number(process.env.AISD_PORT ?? process.env.CSD_PORT ?? 8787);

const fileOps = {
  claude: createNodeFileOps(CLAUDE_DIR, false),
  codex: createNodeFileOps(CODEX_DIR, false),
};

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".txt": "text/plain; charset=utf-8",
};

function safeDistPath(urlPath: string): string | null {
  const rel = urlPath.replace(/^\/+/, "");
  const abs = path.resolve(DIST_DIR, rel);
  const relCheck = path.relative(DIST_DIR, abs);
  if (relCheck.startsWith("..") || path.isAbsolute(relCheck)) return null;
  return abs;
}

function injectServerFlag(html: string): string {
  const snippet = `<script>window.__AISD_SERVER_MODE__=true;window.__AISD_CAPS__=${JSON.stringify(
    { canPickDirectory: false },
  )};</script>`;
  if (html.includes("</head>")) return html.replace("</head>", `${snippet}</head>`);
  return snippet + html;
}

async function serveStatic(urlPath: string): Promise<Response> {
  const requestedPath = urlPath === "/" ? "/index.html" : urlPath;
  const abs = safeDistPath(requestedPath);
  if (!abs) return new Response("Forbidden", { status: 403 });

  try {
    const stat = await fsp.stat(abs);
    if (stat.isDirectory()) {
      return serveStatic(urlPath.replace(/\/?$/, "/") + "index.html");
    }
    const ext = path.extname(abs).toLowerCase();
    if (ext === ".html") {
      const raw = await fsp.readFile(abs, "utf8");
      return new Response(injectServerFlag(raw), {
        headers: { "content-type": MIME[ext] },
      });
    }
    return new Response(Bun.file(abs), {
      headers: { "content-type": MIME[ext] ?? "application/octet-stream" },
    });
  } catch {
    // SPA fallback — serve index.html for unknown routes so hash-routing works
    const indexPath = safeDistPath("/index.html");
    if (indexPath) {
      try {
        const raw = await fsp.readFile(indexPath, "utf8");
        return new Response(injectServerFlag(raw), {
          status: 200,
          headers: { "content-type": MIME[".html"] },
        });
      } catch {
        /* no dist */
      }
    }
    return new Response("Not found (did you run `bun run build`?)", {
      status: 404,
    });
  }
}

async function handleFetch(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const apiResp = await handleApi(fileOps, url, req);
  if (apiResp) return apiResp;
  return serveStatic(url.pathname);
}

Bun.serve({
  hostname: BIND,
  port: PORT,
  async fetch(req) {
    try {
      return await handleFetch(req);
    } catch (e) {
      console.error("[aisd] request failed:", e);
      return new Response(e instanceof Error ? e.message : "Internal error", {
        status: 500,
        headers: { "content-type": "text/plain" },
      });
    }
  },
});

console.log(
  `[aisd] listening on http://${BIND}:${PORT}  claudeDir=${CLAUDE_DIR}  codexDir=${CODEX_DIR}`,
);
