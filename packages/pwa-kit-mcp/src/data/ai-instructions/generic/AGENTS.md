# PWA Kit MCP Tools — Agent Guidelines

## Available Tools (exact names from registration)
- `get_development_guidelines`
- `create_storefront_app`
- `create_component`
- `create_page`
- `run_site_test`

## Mandatory Usage Instructions
- If the user asks to create/start a PWA Kit app, or to list presets/templates → call `create_storefront_app` before any other action.
- For any PWA Kit storefront development task (analyze, generate, refactor, modify, fix) → call `get_development_guidelines` first, then:
  - Component requests → call `create_component`.
  - Page requests → call `create_page`.
- For site performance or accessibility checks → call `run_site_test`.

If multiple apply (e.g., create then test): `get_development_guidelines` → creation tool(s) → `run_site_test`.

## Input Handling Guidelines
- If a tool prompts for missing inputs, ask the user only for the missing items, one at a time. Do not fabricate values.
- Prefer tool outputs; avoid pulling unrelated context or scanning files unless explicitly needed for the user's prompt.

## Site Testing Requirements (`run_site_test`)
- You must provide an explicit `siteUrl` for every `run_site_test` call.
  - Never rely on or use a default URL.
  - If the user did not provide a URL, ask for the full URL (one question) and do not execute until provided.
- `testType` must be exactly `performance` or `accessibility`.
- After the tool finishes, use its output to propose concrete, minimal code changes that address the detected issues.
  - Summarize the high-impact findings and recommend specific edits (files/areas if known or typical), scoped to the storefront codebase.
  - Avoid scanning unrelated files; focus on issues implicated by the tool output.
  - Keep suggestions actionable and small; prefer incremental changes.
  - When the user approves, proceed with normal development flow (and re-run tests as appropriate).

## Non-Interference Policy
- If none of the above tools apply to the user's request, ignore this rule and proceed with other relevant tools or built-in capabilities.
