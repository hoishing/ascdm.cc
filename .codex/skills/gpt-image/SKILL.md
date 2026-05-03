---
name: gpt-image
description: Generate or download GPT image assets for the ascdm.cc landing page using the ChatGPT web app in the cmux in-app browser. Use when the user asks to create, regenerate, or save project images from site-info.md prompts, especially into assets/, and wants the ChatGPT prompt-box quality/mode set to Instant.
---

# GPT Image

## Overview

Use this skill to create `ascdm.cc` landing-page images from `site-info.md` with the ChatGPT web UI inside the cmux in-app browser. Default to the right-side prompt-box mode pill set to `Instant`, generate one image at a time, and save final assets under `assets/`.

## Workflow

1. Read the relevant image plan in `site-info.md`.
2. Inspect cmux and identify the browser surface:

```sh
cmux capabilities --json
cmux identify --json
cmux tree --all
cmux browser surface:N get url
cmux browser surface:N snapshot --interactive --compact
```

3. Open a fresh ChatGPT composer if the current thread is awkward to control:

```sh
cmux browser surface:N navigate https://chatgpt.com/zh-TW/ --snapshot-after
cmux browser surface:N wait --selector '#prompt-textarea' --timeout-ms 15000
```

4. Set the right-side mode pill to `Instant` before submitting.
   - The pill appears on the right side of the prompt box.
   - In Traditional Chinese UI, `Instant` may already be visible as `Instant`.
   - If another mode is visible, open the pill and choose `Instant`.
   - Verify by reading the form HTML or page text before sending.

5. Fill `#prompt-textarea` with the exact prompt from `site-info.md`, plus this leading instruction:

```text
Generate this image directly using gpt-image-2. Do not answer with a description.
```

6. Click `button[data-testid="send-button"]`.
7. Wait for a new rendered image URL:

```sh
cmux browser surface:N wait --selector 'img[src*="backend-api/estuary/content"]' --timeout-ms 240000
cmux browser surface:N get attr 'img[src*="backend-api/estuary/content"]' src
```

8. Download the actual generated PNG with the helper script, not a screenshot.
9. Resize only when the saved dimensions do not match the plan.
10. View the image and reject obvious failures: readable fake text, logos, platform marks, watermarks, wrong aspect ratio, or visually off-brief output.

## Project Asset Names

Use these defaults when the user asks for the images from `site-info.md`:

- Hero: `assets/ascdm-hero.png`, `2048x1152`
- Process: `assets/ascdm-process.png`, `1536x1024`
- Reporting: `assets/ascdm-reporting.png`, `1536x1024`

## Download Helper

Use `scripts/download_chatgpt_image.py` to download through the authenticated browser session without printing tokens:

```sh
uv run .codex/skills/gpt-image/scripts/download_chatgpt_image.py \
  --surface surface:N \
  --out assets/ascdm-process.png
```

For a known content URL:

```sh
uv run .codex/skills/gpt-image/scripts/download_chatgpt_image.py \
  --surface surface:N \
  --url 'https://chatgpt.com/backend-api/estuary/content?...' \
  --out assets/ascdm-reporting.png
```

Then normalize dimensions if needed:

```sh
sips -z 1024 1536 assets/ascdm-process.png >/dev/null
sips -g pixelWidth -g pixelHeight assets/ascdm-process.png
```

## Notes

- Keep generated images out of `output/imagegen/` when the user asks for `assets/`.
- Do not use browser screenshots as final assets unless the user explicitly accepts that fallback.
- Do not print ChatGPT access tokens or session cookies.
- If a plain `curl` returns `403`, use the helper script; ChatGPT image URLs require authenticated browser context.
