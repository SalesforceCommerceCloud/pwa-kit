# MRT Distributed-Tracing Compatibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable PWA Kit tracing when either the existing OpenTelemetry flag or Managed Runtime's distributed-tracing flag is `"true"`.

**Architecture:** Keep `getOTELConfig()` as PWA Kit's single tracing-config boundary. Expand only its `enabled` boolean with an OR condition, so distributed tracing, MRT span export, and the existing `serverTiming` OpenTelemetry path all consume identical state without new call sites or a second configuration helper.

**Tech Stack:** Node.js, JavaScript, Jest, PWA Kit React SDK.

## Global Constraints

- `OTEL_TRACING_ENABLED === 'true'` remains supported unchanged.
- `MRT_DISTRIBUTED_TRACING_ENABLED === 'true'` is an alternative enablement flag.
- Any value other than the exact string `"true"` leaves tracing disabled.
- `serverTiming` continues to use `getOTELConfig().enabled`; do not introduce a new server-timing gate.
- Do not change sampling, trace ingestion, or MRT realm configuration.

---

### Task 1: Extend the shared tracing configuration gate

**Files:**
- Modify: `packages/pwa-kit-react-sdk/src/utils/opentelemetry-config.test.js:61-98`
- Modify: `packages/pwa-kit-react-sdk/src/utils/opentelemetry-config.js:13-17`
- Test: `packages/pwa-kit-react-sdk/src/ssr/server/opentelemetry-server.test.js:472-604`

**Interfaces:**
- Consumes: `process.env.OTEL_TRACING_ENABLED` and `process.env.MRT_DISTRIBUTED_TRACING_ENABLED`.
- Produces: `getOTELConfig(): { serviceName: string, enabled: boolean }`; all current consumers, including `tracePerformance()` for `serverTiming`, continue to consume `enabled` unchanged.

- [ ] **Step 1: Write the failing configuration tests**

Add an MRT-only test and a combined-negative test to the existing `enabled` suite:

```js
test('should return enabled as true when MRT_DISTRIBUTED_TRACING_ENABLED is "true"', () => {
    delete process.env.OTEL_TRACING_ENABLED
    process.env.MRT_DISTRIBUTED_TRACING_ENABLED = 'true'

    const {getOTELConfig} = mockModule()
    expect(getOTELConfig().enabled).toBe(true)
})

test('should return enabled as false when neither tracing flag is "true"', () => {
    process.env.OTEL_TRACING_ENABLED = 'false'
    process.env.MRT_DISTRIBUTED_TRACING_ENABLED = '1'

    const {getOTELConfig} = mockModule()
    expect(getOTELConfig().enabled).toBe(false)
})
```

Also delete `MRT_DISTRIBUTED_TRACING_ENABLED` in `beforeEach` or restore it through the existing `process.env` snapshot so each case is isolated.

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test --prefix packages/pwa-kit-react-sdk -- src/utils/opentelemetry-config.test.js --runInBand
```

Expected: the MRT-only test fails because `enabled` only checks `OTEL_TRACING_ENABLED`.

- [ ] **Step 3: Write minimal implementation**

Change the existing property only:

```js
enabled:
    process.env.OTEL_TRACING_ENABLED === 'true' ||
    process.env.MRT_DISTRIBUTED_TRACING_ENABLED === 'true'
```

Do not change `serviceName` or any `serverTiming` call site. `tracePerformance()` already reads this same `enabled` value, so the legacy flag keeps its behavior and MRT-only configuration activates it consistently.

- [ ] **Step 4: Run configuration and server-timing regression tests**

Run:

```bash
npm test --prefix packages/pwa-kit-react-sdk -- src/utils/opentelemetry-config.test.js src/ssr/server/opentelemetry-server.test.js --runInBand
```

Expected: configuration tests pass; the existing `tracePerformance` tests continue to verify B3 headers are emitted only when the shared config reports tracing enabled and omitted when it reports disabled.

- [ ] **Step 5: Commit implementation and tests**

```bash
git add packages/pwa-kit-react-sdk/src/utils/opentelemetry-config.js packages/pwa-kit-react-sdk/src/utils/opentelemetry-config.test.js
git commit -m "feat: enable tracing with MRT flag"
```

### Task 2: Document the compatibility contract and release note

**Files:**
- Modify: `docs/distributed-tracing.md:29-42,100-105`
- Modify: `packages/pwa-kit-react-sdk/src/ssr/server/mrt-console-span-exporter.js:11-16`
- Modify: `packages/pwa-kit-react-sdk/src/utils/opentelemetry.js:116-127`
- Modify: `packages/pwa-kit-react-sdk/CHANGELOG.md:1-4`

**Interfaces:**
- Consumes: the shared `getOTELConfig().enabled` contract from Task 1.
- Produces: matching developer documentation and diagnostics for both supported flags.

- [ ] **Step 1: Update documentation and inline environment references**

Document both supported flags in `docs/distributed-tracing.md`, state that either exact `"true"` value enables distributed tracing and `serverTiming`'s OpenTelemetry path, and rename the architecture description from an `OTEL_TRACING_ENABLED`-only master switch to the shared tracing gate. Update the exporter's JSDoc and the disabled-timing suggestion so they name both supported ways to enable tracing.

- [ ] **Step 2: Add SDK release note**

Under `## v3.22.0-dev` in `packages/pwa-kit-react-sdk/CHANGELOG.md`, add:

```markdown
- [Feature] Enable OpenTelemetry and distributed tracing when either `OTEL_TRACING_ENABLED=true` or MRT's `MRT_DISTRIBUTED_TRACING_ENABLED=true` is set. [W-24614336]
```

- [ ] **Step 3: Verify documentation and affected tests**

Run:

```bash
npm test --prefix packages/pwa-kit-react-sdk -- src/utils/opentelemetry-config.test.js src/ssr/server/distributed-tracing.test.js src/ssr/server/mrt-console-span-exporter.test.js src/ssr/server/opentelemetry-server.test.js --runInBand
npm run lint --prefix packages/pwa-kit-react-sdk
git diff --check
```

Expected: all focused tests and lint pass, and `git diff --check` reports no whitespace errors.

- [ ] **Step 4: Commit documentation and release note**

```bash
git add docs/distributed-tracing.md packages/pwa-kit-react-sdk/src/ssr/server/mrt-console-span-exporter.js packages/pwa-kit-react-sdk/src/utils/opentelemetry.js packages/pwa-kit-react-sdk/CHANGELOG.md
git commit -m "docs: document MRT tracing flag"
```

### Task 3: Review and prepare the pull request

**Files:**
- Review: `packages/pwa-kit-react-sdk/src/utils/opentelemetry-config.js`
- Review: `packages/pwa-kit-react-sdk/src/utils/opentelemetry-config.test.js`
- Review: `docs/distributed-tracing.md`
- Review: `packages/pwa-kit-react-sdk/CHANGELOG.md`

**Interfaces:**
- Consumes: the validated shared configuration change and documentation from Tasks 1-2.
- Produces: a reviewable branch and PR linked to `W-24614336`.

- [ ] **Step 1: Inspect final change surface**

Run:

```bash
git status --short
git log --oneline develop..HEAD
git diff --check develop...HEAD
git diff --stat develop...HEAD
```

Expected: only the configuration, tests, docs, changelog, and approved design/plan artifacts differ from `develop`.

- [ ] **Step 2: Push and create PR**

Run:

```bash
git push -u origin feat/mrt-distributed-tracing
gh pr create --base develop --head feat/mrt-distributed-tracing --title "@WI-24614336: Enable tracing with MRT distributed tracing flag" --body-file /private/tmp/pwa-kit-mrt-tracing-pr.md
```

Write `/private/tmp/pwa-kit-mrt-tracing-pr.md` with a summary of the OR-condition compatibility behavior, the preserved `serverTiming` shared-gate behavior, the focused test commands, and a link to W-24614336.

- [ ] **Step 3: Verify created PR**

Run:

```bash
gh pr view --json url,title,body,headRefName,baseRefName,files
```

Expected: the PR targets `develop`, includes only intended files, references W-24614336, and states that both flags must be the exact string `"true"`.

