# E2E Tests · ascdm.cc

Runner: `uv run e2e/run.py`

Engine: Lightpanda (headless-browser skill, local-fetch mode via `lightpanda fetch --dump html`).

Static server boots on `127.0.0.1:8765` for the duration of the run.

## Checks

- **homepage · hero** — H1 title, brand name (zh + en), email CTA present.
- **homepage · services Core 5** — Five core service cards (SEO Strategy, Content Operations, Shopify SEO, Reporting, Repurposing) render.
- **homepage · extended capabilities Five** — Five extended-capability cards render with `加值能力` badge (Video SEO, Visual / Graphic, Shopify Theme Dev, Newsletter Ops, Automation Pipelines).
- **homepage · case study section + CTA** — `#case-study` section title, "查看完整案例" and "瀏覽銷售簡報" CTAs, and inner links to `/case-study/` and `/deck/` are present.
- **homepage · client anonymity** — Page contains no `TePe`, `tepe`, `TePE`, or `tepetw` strings.
- **homepage · trust bar tools** — Extended toolset (Shopify Theme Dev, YouTube, Threads, GitHub Actions) appears in the trust bar.
- **case-study · hero + scope** — Anonymous brand title, Engagement Scope + Brand Context blocks, scope numbers (`200+ 關鍵字`) present.
- **case-study · architecture + cadence + outcomes** — Content Engine, Operating Cadence, and Outcomes sections render with `FIRST PAGE` / `TRIPLE-DIGIT` / `FIVE-FIGURE` labels.
- **case-study · client anonymity** — No leaked client name strings.
- **deck · 13 slides + reveal.js** — reveal.js asset reference plus key slide titles (Operating Loop, Content Engine, Engagement Models, Why Us, Next Steps) render.
- **deck · client anonymity** — No leaked client name strings.

## Adding a check

1. Append a `(name, path, must_contain, must_not)` tuple to the `checks` list in `e2e/run.py`.
2. Re-run `uv run e2e/run.py` and update this file.
