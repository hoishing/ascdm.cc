# AGENTS.md

- Be straightforward and direct; do not predict user emotions or assume context not given.
- Do not write unit tests unless explicitly told to do so.
- Do create e2e tests and always update them upon UI or feature changes.
- Remove tests when the original UI or feature is removed.

## Python

- Always use `uv` instead of `pip`.
- Always use `ruff` and `basedpyright` to improve code quality; install them locally if not globally available.
- When creating Python scripts for agent skills, avoid installing packages to the Python runtime; use `uv` with inline metadata format to declare dependencies.

## Web Dev Preferences

- Use `bun` over `npm`.
- Use TypeScript over JavaScript.
- Prefer frontend-first SPA/SSG with Vite.
- Use Hono plus SQLite backend only if necessary.
- Never suggest full-stack solutions like Next.js.
- Use Cloudflare Pages with `wrangler` CLI to deploy static sites.

## Code Quality

- Run typecheck and lint after every code change.
- Follow ESLint and `tsc` diagnostics.
- Do not use `any` or silence errors with `// @ts-ignore` unless explicitly justified.

## In-App Browser And E2E

- The Codex in-app browser cannot reliably use `window.showDirectoryPicker()` from the Vite-only dev app because automated clicks do not satisfy the native file-picker user-gesture requirement.
- For automated e2e/in-app-browser testing that needs `~/.claude` or `~/.codex`, use server mode instead of the static File System Access path.
- Server mode is available by building the app and running `bun run server:start`, then opening `http://127.0.0.1:8787`.
- The server injects `window.__AISD_SERVER_MODE__` and reads local session roots from the Bun backend, avoiding the folder picker.
- If testing against Vite dev on `http://127.0.0.1:5173`, ensure the Bun server is also running for `/api` and inject or otherwise enable `window.__AISD_SERVER_MODE__` before app startup.
