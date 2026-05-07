import type { Project, PlanEntry, SessionWithPlans, ProjectWithPlans } from "../lib/types";
import type { FileOps } from "../lib/file-ops";
import { extractAllSlugsFromText, decodeProjectDir } from "../lib/parsers";

export async function listPlanSlugs(fs: FileOps): Promise<Set<string>> {
  const entries = await fs.listDir("plans");
  const slugs = new Set<string>();
  for (const entry of entries) {
    if (entry.kind === "file" && entry.name.endsWith(".md")) {
      slugs.add(entry.name.replace(/\.md$/, ""));
    }
  }
  return slugs;
}

export async function readPlanContent(
  fs: FileOps,
  slug: string,
): Promise<string | null> {
  return fs.readText("plans", slug + ".md");
}

export function extractPlanTitle(markdown: string): string {
  const match = markdown.match(/^#\s+(.+)$/m);
  if (match) return match[1].trim();
  const firstLine = markdown.split("\n").find((l) => l.trim());
  return firstLine?.trim() || "Untitled Plan";
}

export async function scanSessionsForPlans(
  fs: FileOps,
  projects: Project[],
  planSlugs: Set<string>,
): Promise<ProjectWithPlans[]> {
  const result: ProjectWithPlans[] = [];

  for (const project of projects) {
    const sessionsWithPlans: SessionWithPlans[] = [];

    for (const session of project.sessions) {
      const text = await fs.readText(
        "projects",
        project.encodedDir,
        session.sessionId + ".jsonl",
      );
      if (!text) continue;
      const matching = extractAllSlugsFromText(text).filter((s) => planSlugs.has(s));
      if (matching.length === 0) continue;

      sessionsWithPlans.push({
        sessionId: session.sessionId,
        projectDir: project.encodedDir,
        modified: session.modified,
        firstPrompt: session.firstPrompt,
        slugs: matching,
      });
    }

    if (sessionsWithPlans.length === 0) continue;

    sessionsWithPlans.sort((a, b) => {
      const ta = a.modified ? new Date(a.modified).getTime() || 0 : 0;
      const tb = b.modified ? new Date(b.modified).getTime() || 0 : 0;
      return tb - ta;
    });

    result.push({
      encodedDir: project.encodedDir,
      projectPath: project.projectPath || decodeProjectDir(project.encodedDir),
      sessionsWithPlans,
    });
  }

  result.sort((a, b) => {
    const aMax = a.sessionsWithPlans[0]?.modified
      ? new Date(a.sessionsWithPlans[0].modified).getTime() || 0
      : 0;
    const bMax = b.sessionsWithPlans[0]?.modified
      ? new Date(b.sessionsWithPlans[0].modified).getTime() || 0
      : 0;
    return bMax - aMax;
  });

  return result;
}

export async function loadPlansForSession(
  fs: FileOps,
  slugs: string[],
): Promise<PlanEntry[]> {
  const plans: PlanEntry[] = [];
  for (const slug of slugs) {
    const content = await readPlanContent(fs, slug);
    if (!content) continue;
    plans.push({
      slug,
      title: extractPlanTitle(content),
      content,
    });
  }
  return plans;
}

export async function searchPlans(
  fs: FileOps,
  query: string,
): Promise<PlanEntry[]> {
  const slugs = await listPlanSlugs(fs);
  const needle = query.trim().toLowerCase();
  const plans: PlanEntry[] = [];
  for (const slug of slugs) {
    const content = await readPlanContent(fs, slug);
    if (!content) continue;
    const title = extractPlanTitle(content);
    if (
      !needle ||
      title.toLowerCase().includes(needle) ||
      content.toLowerCase().includes(needle)
    ) {
      plans.push({ slug, title, content });
    }
  }
  return plans;
}
