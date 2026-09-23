# Release internals

Branch-only reference for the `release` skill — read a section when its pointer in `SKILL.md` fires, not every run.

## The bump-and-PR cycle

Steps 2 and 4 run the same cycle; the only difference is the version shape. **Preview** carries `-preview.N` and gets a git tag; **final** is the clean stable version, no suffix.

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
   **GATE — open the PR into `release-<major>.<minor>.x`.** State: "Merging this publishes `<the four versions>` to npm tag `<next|latest>`." Lead the title with the GUS work ID. pwa-kit is a public repo — make sure `gh` is on your regular public GitHub account (`gh auth switch --user <your-public-account>`):
   ```
   git push -u origin prepare-release-<version>
   gh pr create --base release-<major>.<minor>.x --head prepare-release-<version> \
     --title "@W-XXXXXXXX@ Release <version>" \
     --body "<four versions + changelog highlights>"
   ```
   You open it; the **operator merges it.** The merge triggers CI, which publishes.

## Stamping the changelogs

**Invariant: each changed changelog has exactly ONE version header at the top — the version just set — with the accumulated bullets beneath. One header per file, no stacked `-dev`/`-preview.N` lines.**

- **Four changelogs auto-stamp: `commerce-sdk-react`, `pwa-kit-react-sdk`, `pwa-kit-runtime`, `pwa-kit-dev`.** Each has a `version` lifecycle script (`packages/<pkg>/scripts/version.js`, all functionally identical) that prepends a dated header during the bump. The SDK bump (`#1`) runs `lerna version`, which fires the `version` lifecycle for every package — so all four get stamped with a header.
- **Only `commerce-sdk-react` is prone to stacked headers.** `pwa-kit-react-sdk/runtime/dev` ride the SDK version, so `lerna version` stamps each exactly **once** — one clean header; just verify it matches the version you set. `commerce-sdk-react` is versioned **independently**, so it gets stamped **twice**: once by the SDK bump's `lerna version` (at the SDK version — wrong), then again by its own bump (`#2`, the correct version). (`scripts/bump-version/index.js` even flags this: `// TODO: is it possible to _not_ trigger the lifecycle scripts? See commerce-sdk-react/CHANGELOG.md`.) See "commerce-sdk-react: dedupe stacked headers" below for the fix.
- **The remaining three changelogs need a manual header rewrite** — `pwa-kit-create-app`, `template-retail-react-app`, and `pwa-kit-mcp` have no `version.js`, so the bump only touched their `package.json`/lockfiles. Rewrite the top line:
  - Final: `## v3.19.0 (Jul 06, 2026)` (today's date).
  - Preview: `## v3.19.0-preview.0`.
  - **mcp header has NO `v` prefix** (`## 0.5.0`); every other package DOES (`## v3.19.0`). Match each file's existing style.

While in each file, confirm every shipping change is listed and nothing stale remains — this is the review the process calls for. Two failure modes to catch, both invisible if you only skim: an entry **under the wrong header** (a change for this release stranded beneath an older version's heading, or vice versa — move it under the correct one), and a change **with no entry at all** (cross-check against `git diff v<last-released> -- packages/<pkg>`; every non-trivial diff earns a bullet). **Surface the changelog diffs to the operator**; don't rubber-stamp. Completion: every changed changelog opened, one clean header each, every shipping change filed under it.

### commerce-sdk-react: dedupe stacked headers

Open `commerce-sdk-react/CHANGELOG.md` and keep the one header matching the version you just set (verified via `npx lerna list --long --all`). If the stale header has bullets that belong in this release, **move those bullets up** under the kept header first — then delete the stale header line. Rehome bullets before deleting a header, always. Confirm no duplicate bullets remain across headers.

## Watching the CI publish

The publish is one step buried in a large matrix — dozens of legs across `pwa-kit` / `pwa-kit-windows` / `generated` / `lighthouse` jobs, most of which are just tests. Exactly one leg publishes: the **`pwa-kit` job's `ubuntu-latest` leg whose node/npm matches `IS_MRT_NODE`**, step **"Publish to NPM"** — every other leg skips it. Read the current node/npm from `IS_MRT_NODE` in `.github/workflows/test.yml` (it tracks MRT's recommended node and drifts over time — read it live, don't trust a version memorized here). So watch that leg's Publish step rather than the whole run. It's also gated on the version not being `-dev`, so a green run whose Publish step was *skipped* published nothing. A green check proves nothing either way — **confirm against npm** (`npm view`, Step 3) as the source of truth.
