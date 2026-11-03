---
name: release
description: Operator runbook for cutting a PWA Kit release — cut the branch, bump the four versions, stamp changelogs, open the PR that publishes, smoke test, ship final, move dist-tags, merge back.
disable-model-invocation: true
---

Drive a PWA Kit release from start to finish. A release spans a **week or more**: cut a preview, smoke test, fix blockers, cut more previews, ship the final, move npm dist-tags, then merge back. Assume the operator has never done this.

You do the work. Each irreversible action is a **gate**: state the exact command and its consequence (what publishes, where it lands), then **stop and wait** for the operator's "yes" — one gate per turn, never batch them. On "yes," run the command you stated. Two carve-outs you never do — **merging any PR** and the **merge-back to develop** — the operator performs those.

Reveal only the current step. The full arc below is your private map; walk the operator through one step at a time.

## First: triage where they are

`/release` may be invoked on day 1 or day 6. Never assume step 1. Run these and read the result into the map:

```
git branch --show-current
node -p "require('./package.json').version"
git log --oneline -5
```

| Signal | You are at |
|---|---|
| On `develop`, version ends `-dev`, no release branch cut | **Step 1 — Pre-release audit** |
| Release contents or compatibility coverage unverified | **Step 1 — Pre-release audit** |
| Release branch exists, on a working branch, versions still `-dev` | **Step 2 — Bump + changelogs + PR** |
| On `prepare-release-*`, versions bumped (not `-dev`), no PR open | **Step 2 — open the PR** (bump-and-PR cycle, at the PR gate) |
| Bump PR merged; any selected exact preview or stable version is absent from npm | **Step 3 publication checkpoint / Step 4 stable verification** |
| All selected previews are published; scope or testing incomplete | **Step 3 — Scope + smoke test** |
| A preview is published but a blocker was found | **Step 2 — next `-preview.(N+1)`** |
| Preview smoke-tested clean, no blockers left | **Step 4 — Final release** |
| Stable versions published; notes verification, dist-tags, Snyk, or announcement incomplete | **Step 5 — Post-release** |
| Post-release checks complete; merge-back ancestry or next-dev versions unverified | **Step 6 — Merge back** |

Tell the operator which step they're on and why. In the same turn — no separate gate — ask if this is their first release. If **yes**, give them the quick overview below to orient them; if **no**, skip it. Either way, start at their step.

**Quick overview (first-timers only).** A release is a week-plus arc, not a single command. The steps, by name:

1. **Cut** a `release-X.Y.x` branch off `develop`.
2. **Bump + PR.** Bump the four versions, stamp changelogs, open a PR into the release branch — **merging that PR is what publishes to npm** (there's no publish button).
3. **Smoke test** the published `-preview.N`, fix blockers, cut another preview, repeat until clean.
4. **Ship** the stable version the same way.
5. **Post-release**: GitHub notes, npm dist-tags, Slack announce.
6. **Merge back** into `develop` at the next `-dev` version.

Each step's own section below carries the detail. You drive; the operator says "yes" at each gate and merges the PRs. Reveal one step at a time from here — don't dump the whole arc again.

## The one rule that shapes everything: when CI publishes

There is **no publish button.** Pushing a commit to a `release-X.Y.x` branch runs `.github/workflows/test.yml`, whose "Publish to NPM" step runs the `publish_to_npm` action (`npm run publish-to-npm` → `lerna publish from-package`). It publishes a package when **(a)** the monorepo version does **not** end in `-dev`, and **(b)** that version is **not already on npm**. A merged PR into the release branch is a push — so **merging a bump PR into the release branch is what publishes.**

**Where to watch it.** Exactly one leg in a large matrix publishes — the `pwa-kit` job's `ubuntu-latest` leg matching `IS_MRT_NODE` in `.github/workflows/test.yml`, step "Publish to NPM". A green check proves nothing either way — **confirm against npm** (`npm view`, Step 3) as the source of truth. For the leg-hunting detail, see "Watching the CI publish" in `RELEASE-INTERNALS.md`.

Two consequences the steps depend on:

- **Branch creation and version bumping are separate acts.** Cut `release-X.Y.x` *clean from develop* while versions still end in `-dev` — that push publishes nothing (gate (a)). The bump lands afterward via PR; that merge is the deliberate, only publish trigger.
- **The flow is resilient.** Re-merging a version already on npm is a no-op (gate (b)); bumping `-preview.N` or a patch publishes a fresh artifact.

Dist-tags: `-preview.N` versions publish to npm tag `next`; stable versions publish to `latest` (lerna's default from semver).

## The four versions (collect all four up front)

PWA Kit versions four things independently; the seven published packages collapse to four numbers. Run the bumps **in this order** — `#1` first, because it restores the independent packages and pins **mcp** to its latest *published npm* version, which `#2`–`#4` then override:

| # | What | Bump command | Stamps these CHANGELOGs |
|---|---|---|---|
| 1 | Monorepo ("sdk") | `npm run bump-version -- <v>` | `pwa-kit-create-app`, `pwa-kit-dev`, `pwa-kit-react-sdk`, `pwa-kit-runtime` |
| 2 | commerce-sdk-react | `npm run bump-version:commerce-sdk-react -- <v>` | `commerce-sdk-react` |
| 3 | retail-react-app | `npm run bump-version:retail-react-app -- <v>` | `template-retail-react-app` |
| 4 | mcp | `npm run bump-version:mcp -- <v>` | `pwa-kit-mcp` |

- The **monorepo version (`#1`) drives the branch name**: `3.19.0` → `release-3.19.x` (the `x` is literal — one branch per X.Y line).
- Don't assume a minor bump — patch or major is possible. Justify each number against its changelog before running anything.
- Each bump script runs `npm install`; expect `package-lock.json` churn.

**Which packages to release — follow the runtime dependents.** Whatever you release, release anything downstream that depends on it at runtime — **dev dependencies don't count.** `retail-react-app` runtime-depends on both the SDK packages and `commerce-sdk-react`; nothing depends on `retail-react-app`.

- Releasing the **SDK** → also release **retail-react-app**. (Not commerce-sdk-react — its only pwa-kit dependency is a *dev* dependency, so bump it if you like but it needs no release.)
- Releasing **commerce-sdk-react** → also release **retail-react-app**.
- Releasing **retail-react-app** → nothing else (it's a leaf).

Multiple packages ship together in **one branch and PR** — bump each one's version and the publish script releases exactly those whose version isn't yet on npm. Name the shared branch off the **SDK** version (`release-10.0.x`).

**Release a package only if it actually changed. The code diff is the signal, not the changelog.** A changelog is a cache that can lie both ways: empty because nobody wrote the entry (not because nothing changed), or filled with entries stacked under a stale heading. Decide changed-vs-unchanged from the diff against the package's last released tag:
```
git diff v<last-released> -- packages/<pkg>
```
An empty diff means unchanged; a non-empty diff with an empty changelog means the entries are **missing** — write them before shipping, don't read the silence as "no changes."

`develop`'s `-dev` version is a placeholder, not an obligation — an unchanged SDK does not have to ship just because develop reads `3.20.0-dev`. If the SDK diff is empty since its last `3.19.x` release, keep it on the 3.19 line: the release branch is the **existing `release-3.19.x`** (reused, not recreated — a fresh cut off develop would collide with that name), and the working branch is `prepare-release-<version>` off it.

But `release-3.19.x` is **stale** — the changes you're shipping (e.g. new commerce-sdk-react / retail-react-app work) live on `develop`. So **merge `develop` into your working branch** to bring them in. That merge also drags in develop's `3.20.0-dev` SDK version strings, so afterward **pin the SDK/root back to the already-published `3.19.x`** (`npm run bump-version -- 3.19.<published>`) and bump only the changed packages. On merge, the root is non-`dev` so the publish step fires, `from-package` skips the SDK (already on npm), and only the bumped packages publish — and the SDK bump re-pins retail-react-app's `pwa-kit-*` deps to the published `3.19.x`. Only bump the SDK to a *new* version when its code actually changed, or when you deliberately want the whole suite version-aligned on the next minor (which republishes identical SDK code — allowed, just redundant).

## Step 1 — Pre-release audit

Goal: the base is clean and all four version numbers are chosen.

**Hotfix / patch to an already-released line?** Same process, one difference at the base: **reuse the existing `release-X.Y.x` branch** — don't cut a new one (a fresh cut off develop would collide with the name and drag in unshipped work). Bump a **patch** (`3.19.0` → `3.19.1`), not a minor. The tricky part is *which commits* land on that branch — the fix lives on `develop` (or a fix branch) mixed with work that must **not** ship in a patch. **Work with the operator** to pick the exact commits — don't guess (usually `git cherry-pick <sha>...` onto the working branch, not a full `develop` merge). Confirm the selected set with them before bumping. Then rejoin the normal flow at Step 2.

1. **Audit the base** (default `develop`). It may be missing an unmerged feature branch that should ship, or carry commits that should *not* ship yet (extract those to a separate branch first). Completion: operator confirms the base holds exactly the intended changes.
   **Compatibility audit:** load "Compatibility audit" in `RELEASE-INTERNALS.md` and dispatch its read-only audit before approving versions. Record findings and coverage gaps as blockers; intentional major-version breaks require operator approval and migration guidance.
2. **Preview or final?** Preview carries `-preview.N` and gets a git tag; final has no suffix.
3. **Choose which packages to release and their versions**, each justified from its diff since the last released tag (`git diff v<last-released> -- packages/<pkg>` — the changelog can lie both ways, see above), following the dependents rule above (releasing the SDK or commerce-sdk-react pulls in retail-react-app). Prompt only for the units that ship:
   > 1. Monorepo (sdk): ___  2. commerce-sdk-react: ___  3. retail-react-app: ___  4. mcp: ___

   State the resulting `release-<major>.<minor>.x` name back and get a yes.

Completion: the operator approves the exact release range and version map, compatibility coverage is complete, and every finding is recorded with its disposition. Audit completion permits previews; unresolved accidental breaks or missing migration guidance block stable shipment.

## Step 2 — Bump, stamp changelogs, open the PR

Run **the bump-and-PR cycle** with **preview** versions (`-preview.N`), documented in `RELEASE-INTERNALS.md`: ensure the release branch, working branch off it, run the four bumps and verify, stamp the changelogs, then **GATE** the PR into `release-<major>.<minor>.x`. You open it; the **operator merges it.** The merge triggers CI, which publishes. Announcing to teams and smoke testing both wait on that publish — they are Step 3, gated on the preview actually being on npm.

## Step 3 — Smoke test the generated project

**Testing is a multi-team effort.** Each team exercises its own features against the generated preview; the operator drives the core-flow smoke test below and collects blockers reported back. End users start by *generating* a project, and that's where bugs hide (usually a stale asset file in the generator that wasn't updated) — testing the retail app straight from the monorepo would miss them.

**Publication checkpoint:** for every selected package, run `npm view @salesforce/<pkg>@<exact-version> version` and require the expected version. Use the approved release version map, including independent versions. All selected packages must be installable before announcing or generating.

If publication is partial, inspect the publishing leg for the exact merged SHA and repair its failure. **GATE** a retry of the failed workflow jobs at that same SHA/version map (`gh run rerun <run-id> --failed`), stating which missing packages may publish. Already-published versions are skipped. Recheck every selected version; keep testing and post-release blocked until all resolve.

**Release scope:** load "Categorized release scope" in `RELEASE-INTERNALS.md`, dispatch its read-only report, and present the verified scope to the operator before testing. Include it with the preview announcement so feature owners know what to exercise; reuse it for final Highlights.

1. **Generate from the just-published preview**, and give the operator this same command to paste into a Slack **announcement** so each team tests its own features against the preview — testing is shared across teams, not the operator's alone:
   ```
   npx @salesforce/pwa-kit-create-app@<version>-preview.N --templateVersion <retail-preview-version> --outputDir /tmp/smoke-test-<version>-preview.N
   ```
2. In the generated project, **you (the agent) run the automated checks**: `npm ci` (or `npm install`), `npm run lint`, `npm run build`, `npm test`. These must pass before the manual pass is worth anyone's time.
3. **The operator runs the manual happy-path smoke test** — this is theirs, not yours; you can't drive a browser through checkout. Start the local dev server (`npm start`) and walk the core purchase flow end to end: **homepage → browse/search a product → PDP → add to cart → cart → checkout (shipping, payment) → place order → order confirmation.** Hand the operator this flow and wait for their result; a clean build with a broken checkout is still a blocker. Meanwhile each team exercises its own features and reports back.
4. When testing settles, **ask the operator directly: "any blockers from you or any team?"** — don't infer "clean" from silence. **Blocker found?** Fix on the release branch, then return to **Step 2** for `-preview.(N+1)` — increment N, since republishing the same version is a no-op (lerna skips already-published versions). Once that preview publishes, refresh compatibility coverage and scope for the added commits, generate a fresh project, and **re-test the exact scenario that was blocked** before re-running the full smoke test. Loop until a preview smoke-tests clean across all teams. Completion: categorized scope and attribution are complete, automated checks and happy-path/changed-feature tests pass, and the operator explicitly confirms zero testing or compatibility blockers from every team; only then proceed to Step 4.

## Step 4 — Final release

Before publishing a patch to an older release line (for example, `3.19.1` when `3.21.0` is already released), capture existing npm `latest`/`next` tags and confirm their intended post-release targets with the operator. Stable publication moves `latest`; if a newer line must remain the default, include separately gated restoration commands in the publish plan and verify restoration before announcing. For a normal top-of-line release, both tags target the shipped stable versions.

Run **the bump-and-PR cycle** again (`RELEASE-INTERNALS.md`) with the clean stable versions (no suffix). Re-verify every changelog reads final — no `-preview` left, dates correct — tag `v<version>`, and **GATE** the final PR into `release-X.Y.x` stating it publishes stable to `latest`. You open it; the **operator merges it.**

Completion: every selected stable version passes the publication checkpoint from Step 3; only then proceed to post-release.

## Step 5 — Post-release

1. **GitHub release notes.** Draft the notes as markdown, then publish with `gh` (no web UI). The compiled changelogs are the *bottom* of the notes, not the whole thing — a reader shouldn't have to read seven package changelogs to learn what shipped. Follow this three-section shape (see [v3.20.0](https://github.com/SalesforceCommerceCloud/pwa-kit/releases/tag/v3.20.0), [v3.18.0](https://github.com/SalesforceCommerceCloud/pwa-kit/releases/tag/v3.18.0) for reference) — top to bottom:
   1. **Intro summary** — one plain-English paragraph naming what this release *does* for someone who won't read further: `PWA Kit <X.Y> ships/fixes <the two or three things that matter>, plus <assorted smaller work>.` Written from the changes, not copied from any one changelog.
   2. **`## Highlights`** — the handful of user-facing changes worth surfacing, most important first, one bullet each. Not every changelog line — only what a storefront developer would care about. Shape each bullet: `- :emoji: **Short title** — what it is and why it matters, in plain English. ([#PR](url), [#PR](url))`. Pick an emoji that fits the change (`:lock:` security, `:money_with_wings:` cost, `:credit_card:` checkout, etc.). Draft these, then **surface them to the operator to confirm** — the "what matters" judgment is theirs.
   3. **`---`** then **`## Package Changes`** — the per-package changelog compilation (every changed `CHANGELOG.md`, grouped under `### @salesforce/<pkg>@<version>` headers), and end with `**Full Changelog**: https://github.com/SalesforceCommerceCloud/pwa-kit/compare/v<prev>...v<this>`.
   - **GATE — publish it.** Write the drafted notes to a file and publish against the tag pushed in Step 4 (`gh` is on your public account — see the bump-and-PR cycle in `RELEASE-INTERNALS.md`):
     ```
     gh release create v<version> --title "v<version>" --notes-file <notes.md> --verify-tag
     ```
     Let `gh` decide "latest" (its default: automatic by semver + date). For a normal top-of-line stable that marks it latest, which fires `deploy_latest_release.yml`, redeploying the demo + bug-bounty sites. State that redeploy consequence and wait for the operator's yes before running it.
   - **Read-back:** run `gh release view v<version> --json body,url,tagName,isDraft,isPrerelease`. Require the intended tag, a published stable release, a non-empty introduction, substantive Highlights, the separator, and Package Changes matching the approved notes. Check every public link and record the release URL and result. Repair discrepancies through a separately gated `gh release edit` and reverify before continuing.
   - Optionally link the Dev Portal changelog anchor (recent releases have often skipped it). It's constructable from the version — strip the dots: `3.17.0` → `#pwa-kit-317-changes`:
     ```
     https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/references/about-pwa-kit-managed-runtime/about.html#pwa-kit-<XYZ>-changes
     ```
2. **npm dist-tags** (stable releases only). Publishing already tagged the release: previews land on `next`, stables land on `latest` (lerna's default). For a normal top-of-line stable, move `next` off the preview onto the shipped stable. For patches to older release lines, apply the tag targets approved in Step 4 instead. Previews need nothing here. **GATE**, since it writes to the public registry. Use the approved tag/version map, never develop's `package.json`. Normal top-of-line commands:
   ```
   npm dist-tag add @salesforce/pwa-kit-react-sdk@<sdk-v> next
   npm dist-tag add @salesforce/pwa-kit-runtime@<sdk-v> next
   npm dist-tag add @salesforce/pwa-kit-dev@<sdk-v> next
   npm dist-tag add @salesforce/pwa-kit-create-app@<sdk-v> next
   npm dist-tag add @salesforce/commerce-sdk-react@<csr-v> next
   npm dist-tag add @salesforce/retail-react-app@<retail-v> next
   npm dist-tag add @salesforce/pwa-kit-mcp@<mcp-v> next
   ```
   Only tag packages that actually released. `npm login` first if `npm whoami` fails; npm will prompt for a fresh OTP on each write — enter it each time. Confirm with `npm dist-tag ls @salesforce/<pkg>`.
3. **Snyk.** Point Snyk at the new release branch (follow the team's internal Snyk setup doc for the exact steps). Completion: the Snyk dashboard tracks `release-X.Y.x`.
4. **Announce the release on Slack.** Once publication and approved tags are verified, **remind the operator to notify everyone** that `<version>` is out. Include the generate command with exact generator and retail versions from the release map so it also works for patches to older release lines:
   ```
   npx @salesforce/pwa-kit-create-app@<version> --templateVersion <released-retail-version> --outputDir /tmp/smoke-test-<version>
   ```

Completion: GitHub notes pass read-back, every released package's `latest` and `next` match the approved tag targets, Snyk tracks the release branch, and the announcement is sent or explicitly delegated to a named operator.

## Step 6 — Merge back to develop

Get the release commits onto `develop` and reset it to the next dev version.

Before merging, capture the release tip SHA, the shipped version map, and all four versions on `origin/develop`. Derive next-dev targets with "Next-dev versions" in `RELEASE-INTERNALS.md` and confirm the map with the operator.

1. Create an **intermediary branch** off the release branch. Merge the latest `develop` *into it* — resolve conflicts here, not on `develop`.
   - **The merge is a slog — dispatch it to a subagent.** Supply the intermediary/release/`develop` branch names, captured version maps, and approved next-dev targets. Require it to merge `develop` into the intermediary locally and return every conflict resolution. Preserve develop's version strings during conflict resolution; Step 2 applies the target map. Reconcile code by intent, preserving shipped fixes and newer develop work, and flag uncertain resolutions for operator review. The subagent stops before pushing or opening a PR and leaves `develop` untouched. **Surface its resolution list and resolve uncertainties with the operator before moving on.**
2. Apply **all four next-dev targets**, SDK first and independent packages afterward, following "Next-dev versions" in `RELEASE-INTERNALS.md`. Verify versions, dependency pins, lockfiles, and changelog headings before opening the PR.
3. **GATE — open a PR from the intermediary branch targeting `develop`.** You open it; the **operator merges it** using GitHub's **Create a merge commit**, preserving original release commits rather than squashing or rebasing.
4. Fetch origin and run `git merge-base --is-ancestor <captured-release-tip> origin/develop`; require exit code 0. Verify all four next-dev targets and dependency pins on the merged `develop`.

Release complete when publication, scope/testing, and post-release criteria pass, the captured release tip is an ancestor of `origin/develop`, and every version unit is on its approved next-dev target.
