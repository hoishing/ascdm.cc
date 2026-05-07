import { expect, test, type Page } from "@playwright/test";
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
} from "../../src/data/codex-api";
import type { FileOps } from "../../src/lib/file-ops";

declare global {
  interface Window {
    __AISD_SERVER_MODE__?: boolean;
    __AISD_CAPS__?: {
      canPickDirectory?: boolean;
    };
  }
}

const claudeProjects = [
  {
    kind: "claude",
    encodedDir: "-Users-kng-proj-claude",
    projectPath: "/Users/kng/proj/claude",
    sessions: [
      {
        kind: "claude",
        sessionId: "claude-session-1",
        firstPrompt: "Claude first prompt",
        summary: "Claude session summary",
        messageCount: 2,
        created: "2026-04-01T00:00:00.000Z",
        modified: "2026-04-02T00:00:00.000Z",
      },
    ],
  },
];

const codexProjectPath = "/Users/kng/proj/codex";
const codexProjectDir = encodeURIComponent(codexProjectPath);
const codexSessionId = "codex-session-1";
const codexArchivedSessionId = "codex-archived-session";
const realCodexPrompt = "Build a markdown dashboard";

class MemoryFileOps implements FileOps {
  constructor(private readonly files: Record<string, string>) {}

  private key(parts: string[]): string {
    return parts.filter(Boolean).join("/");
  }

  async readText(...parts: string[]): Promise<string | null> {
    return this.files[this.key(parts)] ?? null;
  }

  async readTextPartial(maxBytes: number, ...parts: string[]): Promise<string | null> {
    const text = await this.readText(...parts);
    return text == null ? null : text.slice(0, maxBytes);
  }

  async readJson(...parts: string[]): Promise<unknown | null> {
    const text = await this.readText(...parts);
    if (text == null) return null;
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  }

  async listDir(...parts: string[]) {
    const prefix = this.key(parts);
    const prefixWithSlash = prefix ? `${prefix}/` : "";
    const entries = new Map<string, "file" | "directory">();
    for (const path of Object.keys(this.files)) {
      if (!path.startsWith(prefixWithSlash)) continue;
      const rest = path.slice(prefixWithSlash.length);
      if (!rest) continue;
      const [name, ...tail] = rest.split("/");
      entries.set(name, tail.length > 0 ? "directory" : "file");
    }
    return [...entries].map(([name, kind]) => ({ name, kind }));
  }

  async dirExists(...parts: string[]): Promise<boolean> {
    const prefix = `${this.key(parts)}/`;
    return Object.keys(this.files).some((path) => path.startsWith(prefix));
  }

  async writeText(): Promise<void> {
    throw new Error("MemoryFileOps is read-only");
  }

  async removeFile(): Promise<void> {
    throw new Error("MemoryFileOps is read-only");
  }

  async removeDir(): Promise<void> {
    throw new Error("MemoryFileOps is read-only");
  }

  async checkWritePermission(): Promise<boolean> {
    return false;
  }
}

function jsonl(records: unknown[]): string {
  return records.map((record) => JSON.stringify(record)).join("\n");
}

function createCodexFixtureFs(): FileOps {
  return new MemoryFileOps({
    "sessions/2026/04/03/codex-session-1.jsonl": jsonl([
      {
        timestamp: "2026-04-03T00:00:00.000Z",
        type: "session_meta",
        payload: {
          id: codexSessionId,
          timestamp: "2026-04-03T00:00:00.000Z",
          cwd: codexProjectPath,
          git: { branch: "codex/demo" },
        },
      },
      {
        timestamp: "2026-04-03T00:00:01.000Z",
        type: "response_item",
        payload: {
          type: "message",
          role: "developer",
          content: [{
            type: "input_text",
            text: "Example:\n<proposed_plan>\n` block.\n\nPlan Mode injected text.\n</proposed_plan>",
          }],
        },
      },
      {
        timestamp: "2026-04-03T00:00:02.000Z",
        type: "response_item",
        payload: {
          type: "message",
          role: "user",
          content: [
            {
              type: "input_text",
              text: "# AGENTS.md instructions for /Users/kng/proj/codex\n\n<INSTRUCTIONS>\nRepository setup.\n</INSTRUCTIONS>",
            },
            {
              type: "input_text",
              text: "<environment_context>\n  <cwd>/Users/kng/proj/codex</cwd>\n</environment_context>",
            },
          ],
        },
      },
      {
        timestamp: "2026-04-03T00:00:03.000Z",
        type: "response_item",
        payload: {
          type: "message",
          role: "user",
          content: [{ type: "input_text", text: realCodexPrompt }],
        },
      },
      {
        timestamp: "2026-04-03T00:00:03.000Z",
        type: "event_msg",
        payload: { type: "user_message", message: realCodexPrompt },
      },
      {
        timestamp: "2026-04-03T00:00:04.000Z",
        type: "response_item",
        payload: {
          type: "message",
          role: "assistant",
          content: [{
            type: "output_text",
            text: "# Codex assistant answer\n\n- Render **markdown**\n\n[`docs`](https://example.com)\n\n```ts\nconst ok = true;\n```\n\n<proposed_plan>\n# Real Codex Plan\n\n- Keep **markdown** clean.\n- Inline `<proposed_plan>...</proposed_plan>` mentions are documentation, not wrappers.\n- Codex Plans finds `<proposed_plan>` blocks.\n</proposed_plan>\n\n<oai-mem-citation>\n<citation_entries>\nMEMORY.md:1-1|note=[not plan content]\n</citation_entries>\n</oai-mem-citation>",
          }],
        },
      },
      {
        timestamp: "2026-04-03T00:00:05.000Z",
        type: "response_item",
        payload: {
          type: "reasoning",
          summary: [{ type: "summary_text", text: "Codex reasoning summary" }],
        },
      },
      {
        timestamp: "2026-04-03T00:00:06.000Z",
        type: "response_item",
        payload: {
          type: "function_call",
          name: "exec_command",
          arguments: "{\"cmd\":\"ls\"}",
        },
      },
      {
        timestamp: "2026-04-03T00:00:07.000Z",
        type: "response_item",
        payload: {
          type: "function_call_output",
          output: "command output",
        },
      },
    ]),
    "archived_sessions/codex-archived-session.jsonl": jsonl([
      {
        timestamp: "2026-03-03T00:00:00.000Z",
        type: "session_meta",
        payload: {
          id: codexArchivedSessionId,
          timestamp: "2026-03-03T00:00:00.000Z",
          cwd: codexProjectPath,
          git: { branch: "codex/archive" },
        },
      },
      {
        timestamp: "2026-03-03T00:00:01.000Z",
        type: "event_msg",
        payload: { type: "user_message", message: "Review archived transcript" },
      },
      {
        timestamp: "2026-03-03T00:00:02.000Z",
        type: "response_item",
        payload: {
          type: "message",
          role: "assistant",
          content: [{ type: "output_text", text: "Archived answer" }],
        },
      },
    ]),
  });
}

async function mockApi(page: Page) {
  const codexFs = createCodexFixtureFs();
  const codexProjects = await codexListProjects(codexFs);
  const codexPlanSlugs = Array.from(await codexListPlanSlugs(codexFs));

  await page.route("**/api/caps", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        serverMode: true,
        capabilities: { canPickDirectory: false },
        sources: ["claude", "codex"],
      }),
    });
  });

  await page.route("**/api/claude/projects", async (route) => {
    await route.fulfill({ contentType: "application/json", body: JSON.stringify(claudeProjects) });
  });
  await page.route("**/api/codex/projects", async (route) => {
    await route.fulfill({ contentType: "application/json", body: JSON.stringify(codexProjects) });
  });

  await page.route("**/api/claude/plans", async (route) => {
    await route.fulfill({ contentType: "application/json", body: JSON.stringify([]) });
  });
  await page.route("**/api/codex/plans", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify(codexPlanSlugs),
    });
  });
  await page.route("**/api/codex/plans/scan", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify(await codexScanSessionsForPlans(codexFs)),
    });
  });
  await page.route("**/api/codex/plans/load?*", async (route) => {
    const url = new URL(route.request().url());
    const slugs = (url.searchParams.get("slugs") ?? "").split(",").filter(Boolean);
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify(await codexLoadPlansForSession(codexFs, slugs)),
    });
  });
  await page.route("**/api/codex/plans/search?*", async (route) => {
    const url = new URL(route.request().url());
    const query = url.searchParams.get("q") ?? "";
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify(await codexSearchPlans(codexFs, query)),
    });
  });

  await page.route("**/api/codex/session/**/subagents", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify(await codexGetSubagentSessions()),
    });
  });
  await page.route("**/api/codex/session/**/messages", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify(await codexGetSessionMessages(codexFs, codexProjectDir, codexSessionId)),
    });
  });
  await page.route("**/api/codex/session/*/*", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify(await codexGetSessionInfo(codexFs, codexProjectDir, codexSessionId)),
    });
  });
  await page.route("**/api/codex/search?*", async (route) => {
    const url = new URL(route.request().url());
    const query = url.searchParams.get("q") ?? "";
    const project = url.searchParams.get("project") ?? undefined;
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify(await codexDeepSearchSessions(codexFs, codexProjects, query, { project })),
    });
  });
  await page.route("**/api/codex/session/**/subagents/*/messages", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify(await codexGetSubagentMessages()),
    });
  });
}

test.beforeEach(async ({ page }) => {
  await mockApi(page);
});

test("shows source chooser and only the remaining navigation tabs after source selection", async ({ page }) => {
  await page.goto("/#/");

  await expect(page.getByRole("button", { name: /Claude/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Codex/ })).toBeVisible();

  await page.getByRole("button", { name: /Claude/ }).click();

  await expect(page).toHaveURL(/#\/sessions$/);
  await expect(page.getByRole("link", { name: "Sessions" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Plans" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Search" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Home" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Cleanup" })).toHaveCount(0);
});

test("loads Claude and Codex projects and clears the selected session when switching source", async ({ page }) => {
  await page.goto("/#/sessions");
  await page.getByRole("button", { name: /Codex/ }).click();

  await expect(page.getByText("proj/codex")).toBeVisible();
  await page.getByText(realCodexPrompt).first().click();
  await expect(page.getByText("Codex assistant answer")).toBeVisible();

  await page.getByRole("radio", { name: "Use Claude sessions" }).click();

  await expect(page.getByText("proj/claude")).toBeVisible();
  await expect(page.getByText("Select a session to view messages")).toBeVisible();
  await expect(page.getByText("Codex assistant answer")).toHaveCount(0);
});

test("shows archived Codex sessions in the session list", async ({ page }) => {
  await page.goto("/#/sessions");
  await page.getByRole("button", { name: /Codex/ }).click();

  await expect(page.getByText("Review archived transcript")).toBeVisible();
  await expect(page.getByText(codexArchivedSessionId)).toBeVisible();
  await expect(page.getByText("Archived", { exact: true })).toBeVisible();
});

test("removes session delete controls from sessions and search", async ({ page }) => {
  await page.goto("/#/sessions");
  await page.getByRole("button", { name: /Codex/ }).click();

  await expect(page.getByRole("button", { name: "Select" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Delete/ })).toHaveCount(0);

  await page.getByRole("link", { name: "Search" }).click();
  await page.getByPlaceholder("Search conversations... (leave empty to browse all)").fill("assistant");
  await page.getByRole("button", { name: "Search" }).click();

  await expect(page.getByText(codexSessionId)).toBeVisible();
  await expect(page.getByText("Select All")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Delete/ })).toHaveCount(0);
});

test("renders normalized Codex user, assistant, reasoning, tool call, and tool result content", async ({ page }) => {
  await page.goto("/#/sessions");
  await page.getByRole("button", { name: /Codex/ }).click();
  await page.getByText(realCodexPrompt).first().click();

  await expect(page.getByText("Codex assistant answer")).toBeVisible();
  await expect(page.locator(".md-content h1", { hasText: "Codex assistant answer" })).toBeVisible();
  await expect(page.locator(".md-content li", { hasText: "Render markdown" })).toBeVisible();
  await expect(page.locator(".md-content code", { hasText: "const ok = true;" })).toBeVisible();
  await expect(page.locator(".md-content a", { hasText: "docs" })).toBeVisible();
  await expect(page.getByText("Thinking")).toBeVisible();
  await expect(page.getByText("exec_command")).toBeVisible();
  await expect(page.getByText("Tool Result")).toBeVisible();
});

test("finds Codex proposed plans", async ({ page }) => {
  await page.goto("/#/plans");
  await page.getByRole("button", { name: /Codex/ }).click();

  await expect(page.getByText(realCodexPrompt)).toBeVisible();
  await expect(page.getByText("# AGENTS.md instructions")).toHaveCount(0);
  await page.getByText(realCodexPrompt).first().click();
  await expect(page.getByRole("heading", { name: "Real Codex Plan" })).toBeVisible();
  await expect(page.locator(".md-content li", { hasText: "Keep markdown clean." })).toBeVisible();
  await expect(page.locator(".md-content li", { hasText: "<proposed_plan>...</proposed_plan> mentions are documentation" })).toBeVisible();
  await expect(page.getByRole("button", { name: realCodexPrompt })).toHaveCount(0);
  await expect(page.getByText(`codex-plan:${codexSessionId}:1`)).toHaveCount(0);
  await expect(page.getByText("block.", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Plan Mode injected text")).toHaveCount(0);
  await expect(page.getByText("MEMORY.md:1-1")).toHaveCount(0);
});

test("redirects removed and unknown routes to sessions after source selection", async ({ page }) => {
  for (const route of ["/#/", "/#/cleanup", "/#/missing-route"]) {
    await page.goto(route);
    const chooser = page.getByRole("button", { name: /Claude/ });
    await expect.poll(async () => {
      if (await chooser.count() > 0) return "chooser";
      return /#\/sessions$/.test(page.url()) ? "sessions" : "pending";
    }).not.toBe("pending");
    if (await chooser.count() > 0) {
      await chooser.click();
    }
    await expect(page).toHaveURL(/#\/sessions$/);
  }
});
