# B2C Commerce Cloud Composable Storefront PWA-Kit Retail React Application - Agent Mandatory Tool Usage Guidelines

Use these tools only when the user’s prompt clearly matches a tool’s purpose. Do not override or delay other built-in or MCP tools when these do not apply.

## Tools
- `pwakit_get_dev_guidelines`
- `pwakit_create_storefront`
- `pwakit_create_page`
- `pwakit_run_site_test`

## Mandatory usage (when applicable)
- Storefront dev tasks (analyze, generate, refactor, modify, fix) → `pwakit_get_dev_guidelines` first, then:
  - Pages → `pwakit_create_page`
- Site or app performance or accessibility checks → `pwakit_run_site_test`.

If multiple apply (e.g., create then test), the order is: `pwakit_get_dev_guidelines` → creation tool(s) → `pwakit_run_site_test`.

Gating requirement:
- Before making ANY recommendations or remediation steps based on `pwakit_run_site_test` output, you MUST first call `pwakit_get_dev_guidelines` and incorporate its guidance. If `pwakit_get_dev_guidelines` has not been called yet in the current task flow, call it immediately before interpreting `pwakit_run_site_test` results. Do not suggest code or config changes from `pwakit_run_site_test` without this step.

## Input handling and context minimization
- If a tool prompts for missing inputs, ask the user only for the missing items, one at a time. Do not fabricate values.
- Prefer tool outputs; avoid pulling unrelated context or scanning files unless explicitly needed for the user’s prompt.
- For `pwakit_run_site_test`, you MUST have a `siteUrl` before calling the tool. If the user’s message does not include it, ask one concise question to collect `siteUrl` and wait for the answer; do not proceed or call the tool without it. Do not infer or guess the URL. This applies equally when the user says "site" or "app" performance.
- Do not include a tool call in the same message that asks for `siteUrl`; first ask the question, wait for the user’s reply, then call `pwakit_run_site_test`.

## After `pwakit_run_site_test`
- Summarize high-impact findings and always propose minimal, concrete fixes (files/areas if known).
- Focus only on issues implicated by the output; avoid unrelated scans.
- Keep steps small and actionable; upon approval, proceed with normal flow and re-run tests as needed.

## Non-interference
- If none of the above tools apply, proceed with other relevant tools or built-in capabilities.
