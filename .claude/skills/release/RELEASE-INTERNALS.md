# Release internals

Branch-only reference for the `release` skill — read a section when its pointer in `SKILL.md` fires, not every run.

## Compatibility audit

Dispatch a read-only subagent with exact base/head SHAs per changed package and the approved backports. Audit public SDK contracts in `pwa-kit-react-sdk`, `pwa-kit-runtime`, `pwa-kit-dev`, and `commerce-sdk-react`, plus changed generator/MCP CLI and configuration contracts. Cover removed or incompatible exports/types, runtime behavior, dependency requirements, and Node support.

Require affected contracts, customer impact, source PR links, and file/line evidence. Each package must report findings, explicitly no findings, or incomplete coverage. Review evidence with the operator and record each finding as an unresolved blocker or an approved intentional major-version break with migration guidance. Coverage gaps require follow-up before qualification completes.

## Categorized release scope

Dispatch a read-only subagent with each package's previous stable tag, exact candidate SHA/version, approved release range/backports, and subsequent preview fixes. Reconcile git history with changelogs; account for every customer-facing feature and fix under readable categories such as checkout, account, SDK/runtime, and generator/tooling.

Each entry names the customer-visible change, feature versus fix, source PR links, and authors verified from GitHub PR metadata. Consolidate related PRs while retaining links and authors. Explicitly flag missing entries, attribution, or coverage; resolve them before qualification completes. Present the report before testing and reuse it for testing assignments and final Highlights.

## Next-dev versions

Read the independent-package list in `scripts/bump-version/index.js` and matching root bump scripts. Capture all four version units; next-dev rules apply to SDK, commerce-sdk-react, and retail-react-app. MCP follows the stable-version exception below. Use captured pre-merge `develop` versions and exact shipped stable versions to derive next-dev targets.

- For each shipped unit, default to its own next minor: `X.Y.Z` -> `X.(Y+1).0-dev`. Preserve an existing `develop` dev version whose semver base is newer than that stable version, including an already-started major cycle. Confirm a different next-cycle target with the operator.
- For an unshipped unit, preserve its existing `develop` dev version. If it is still stable, use its next minor `-dev` target. Independent packages follow their own versions, not the SDK's number.
- **MCP stays stable during merge-back.** Verify `npm view @salesforce/pwa-kit-mcp@latest version` returns a stable version and record it as MCP's target; the SDK bump already restores this published version. Increment MCP only for an actual MCP release, not to start a dev cycle. Preserve its changelog's stable headings.
- Confirm the complete target map before running bumps. Run the SDK bump first, then commerce-sdk-react and retail-react-app with the default dependency-sync behavior. Prefix each command with `npm_config_allow_same_version=true` (for example, `npm_config_allow_same_version=true npm run bump-version:commerce-sdk-react -- <csr-next-dev>`), since the scripts call `npm version` even when a target already matches. Explicit independent next-dev bumps are required even when their targets were already present on `develop`; MCP needs no merge-back bump.
- Require `npx lerna list --long --all` to match all four targets, root/lerna versions to match the SDK target, and `npm run check-dep-version` to pass. Review lockfile changes and changelog headers using "Stamping the changelogs" below; keep shipped entries under their stable headings and SDK/commerce-sdk-react/retail next-cycle entries under a single matching dev heading. Surface discrepancies before pushing.

## Older-line npm tags

Before the first preview or stable publish of a patch to an older release line, run `npm dist-tag ls @salesforce/<pkg>` for every selected package. Record existing `latest`/`next` targets, including absent tags, and get operator approval for the intended targets after each preview and the stable release. Retain this baseline across preview iterations; capture newly selected packages before publishing them. On resume, recover the recorded baseline; if missing, ask the operator to establish intended targets rather than treating an already-published preview's tags as the original state.

Preview publication moves `next`; stable publication moves `latest`. State this temporary change at the publish gate. After each publish (including partial publication or a retry), compare every selected package's tags with the approved targets. **GATE each restoration:** state the exact `npm dist-tag add @salesforce/<pkg>@<approved-version> <tag>` command, or `npm dist-tag rm @salesforce/<pkg> <tag>` for an approved absent tag, and its effect. Wait for approval, execute, and verify with `npm dist-tag ls`. Restore tags before announcements or testing handoff; exact-version generation remains available afterward. Repeat verification after each publish attempt. Restoration limits disruption but does not prevent the temporary tag change during publishing.

Completion: every selected package's `latest`/`next` matches its approved targets. Retain the original baseline for subsequent previews and stable closeout; if it was lost, record that history is unknown and retain the operator-approved replacement targets instead.

## The bump-and-PR cycle

Steps 2 and 4 run the same cycle; the only difference is the version shape. **Preview** carries `-preview.N` and gets a git tag; **final** is the clean stable version, no suffix.

For patches to older release lines, load "Older-line npm tags" before the first publish gate. Require its recorded baseline (or documented missing-history decision) and approved targets before opening any bump PR; retain them for subsequent previews and stable publication.

1. **Ensure the release branch exists.** Derive `release-<major>.<minor>.x` from the monorepo version. Check origin:
   ```
   git fetch origin
   git ls-remote --heads origin release-<major>.<minor>.x
   ```
   - **Exists** (a patch, an in-flight release cutting another `-preview.N`, or the **unchanged-SDK case** where you're reusing the last SDK line's branch — see "Release a package only if it actually changed" in `SKILL.md`): keep it — it's the released baseline.
   - **Absent** (new minor/major): **GATE** — create it clean from the base while still `-dev` (publishes nothing):
     ```
     git checkout -b release-<major>.<minor>.x origin/develop
     git push -u origin release-<major>.<minor>.x
     ```
     If branch protection blocks the push, an admin/UI must create it — flag it, don't force it.

2. **Working branch off the release branch** (not the base), so the PR diff is just bumps + changelogs:
   ```
   git fetch origin
   git checkout -b prepare-release-<version> origin/release-<major>.<minor>.x
   ```

3. **Run the bumps (in order), then verify.** Run the four bumps chosen in Step 1, `#1`–`#4` from the table in `SKILL.md`. For a preview, versions carry `-preview.N`. Then compare the output below against the versions chosen in Step 1 — every package should show its intended version. Flag any mismatch to the operator.
   ```
   npx lerna list --long --all
   ```

4. **Stamp the changelogs** — see "Stamping the changelogs" below.

5. **Commit, (preview) tag, open PR.**
   ```
   git add -A
   git commit -m "Bump versions and update changelogs for <version> release"
   ```
   Preview only — tag it:
   ```
   git tag -a v<version>-preview.<n> -m "v<version>-preview.<n>"
   git push origin v<version>-preview.<n>
   ```
   **GATE — open the PR into `release-<major>.<minor>.x`.** State: "Merging this publishes `<selected packages and exact versions>` to npm tag `<next|latest>`." Lead the title with the GUS work ID. pwa-kit is a public repo — make sure `gh` is on your regular public GitHub account (`gh auth switch --user <your-public-account>`):
   ```
   git push -u origin prepare-release-<version>
   gh pr create --base release-<major>.<minor>.x --head prepare-release-<version> \
     --title "@W-XXXXXXXX@ Release <version>" \
     --body "<four versions + changelog highlights>"
   ```
   You open it; the **operator merges it.** The merge triggers CI, which publishes.

## Stamping the changelogs

**Invariant: each changed changelog has one top heading for the target version. Preserve historical stable headings and their bullets; consolidate only redundant headings for the current candidate/dev cycle. During merge-back, shipped entries stay under their stable version and newer work stays under the target dev heading.**

- **Four changelogs auto-stamp: `commerce-sdk-react`, `pwa-kit-react-sdk`, `pwa-kit-runtime`, `pwa-kit-dev`.** Each has a `version` lifecycle script (`packages/<pkg>/scripts/version.js`, all functionally identical) that prepends a dated header during the bump. The SDK bump (`#1`) runs `lerna version`, which fires the `version` lifecycle for every package — so all four get stamped with a header.
- **Check all auto-stamped files for duplicate headings after repeated bumps**, including merge-back's same-version bumps. `commerce-sdk-react` also receives transient SDK headings before its independent bump (`scripts/bump-version/index.js` flags this lifecycle side effect). Use the deduplication procedure below for redundant current-cycle headings in any affected file.
- **The remaining three changelogs need a manual header rewrite** — `pwa-kit-create-app`, `template-retail-react-app`, and `pwa-kit-mcp` have no `version.js`, so the bump only touched their `package.json`/lockfiles. Rewrite the top line:
  - Final: `## v3.19.0 (Jul 06, 2026)` (today's date).
  - Preview: `## v3.19.0-preview.0`.
  - **mcp header has NO `v` prefix** (`## 0.5.0`); every other package DOES (`## v3.19.0`). Match each file's existing style.

While in each file, confirm every shipping change is listed and nothing stale remains — this is the review the process calls for. Two failure modes to catch, both invisible if you only skim: an entry **under the wrong header** (a change for this release stranded beneath an older version's heading, or vice versa — move it under the correct one), and a change **with no entry at all** (cross-check against `git diff v<last-released> -- packages/<pkg>`; every non-trivial diff earns a bullet). **Surface the changelog diffs to the operator**; don't rubber-stamp. Completion: every changed changelog opened, one clean header each, every shipping change filed under it.

### Dedupe current-cycle headers

Keep one current-cycle header matching the package target (verified via `npx lerna list --long --all`). Move current-cycle bullets beneath it before deleting redundant candidate/dev or transient SDK headings. Preserve historical stable headings and entries. Confirm every bullet remains under its intended version and current-cycle entries are unique.

## Watching the CI publish

The publish is one step buried in a large matrix — dozens of legs across `pwa-kit` / `pwa-kit-windows` / `generated` / `lighthouse` jobs, most of which are just tests. Exactly one leg publishes: the **`pwa-kit` job's `ubuntu-latest` leg whose node/npm matches `IS_MRT_NODE`**, step **"Publish to NPM"** — every other leg skips it. Read the current node/npm from `IS_MRT_NODE` in `.github/workflows/test.yml` (it tracks MRT's recommended node and drifts over time — read it live, don't trust a version memorized here). So watch that leg's Publish step rather than the whole run. It's also gated on the version not being `-dev`, so a green run whose Publish step was *skipped* published nothing. A green check proves nothing either way — **confirm against npm** (`npm view`, Step 3) as the source of truth.
