# AGENTS.md instructions for /Users/kng/proj/ascdm.cc

- Be straightforward and direct, don't predict my emotions or assume context I haven't given.
- Do not write unit tests until explicitly told to do so.
- Do create e2e tests and always update them upon UI or feature changes.
- Remove tests when the original UI / feature is removed.
- Summarize all code changes in commit message body when executing git commit.
- Python version bump workflow: edit the pyproject.toml/package.json -> commit all files -> push -> build -> publish. Do not run tests.
- Compress png files with `optipng` after all png operations: create, resize, crop, etc.

## Scripting for agent skills

- Prefer python over other languages.
- Always use `uv` instead of `pip`.
- Always use `ruff` and `basedpyright` to improve code quality, install them locally if not globally available.
- Avoid installing dependencies to the python runtime; use `uv` with inline metadata format to declare dependencies.

## Cloudflare Pages deploy

- This repo's successful Wrangler auth path used the Global API Key stored in `.env` as `CLOUDFLARE_USER_API_KEY`, paired with `CLOUDFLARE_EMAIL=ascdm.cc@gmail.com`.
- Do not print or commit the key. `.env` is ignored.
- Do not source `.env.local` for deploy unless it is known-good; its `CLOUDFLARE_API_TOKEN` can override the working Global API Key auth path.
- Working deploy command shape:

```sh
set -a
source .env
set +a
export CLOUDFLARE_API_KEY="$CLOUDFLARE_USER_API_KEY"
export CLOUDFLARE_EMAIL="ascdm.cc@gmail.com"
export CLOUDFLARE_ACCOUNT_ID="b24c8fbd73933a12f3a99af9335b4041"
unset CLOUDFLARE_API_TOKEN
wrangler pages deploy . --project-name ascdm-cc --branch main
```
