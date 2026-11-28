# Lighthouse baseline verification (DIAGNOSTIC — DO NOT MERGE)

This branch is based on commit `9ea365612608a7b03a7a12f7a0bcce064046b0da` — the
**last develop commit whose Lighthouse CI job passed** (run on 2026-06-24, on
GitHub runner image `ubuntu24/20260615.205.1` / Node 24.16.0).

Its only purpose is to re-run that exact, known-green application code through
the Lighthouse CI job **now**, on the current GitHub-hosted runner image.

Hypothesis: the Lighthouse failures that began 2026-06-25 are caused by the
GitHub `ubuntu-24.04` runner-image rollover (`20260615.205`/Node 24.16 →
`20260622.220`/Node 24.17), **not** by any application code change — the diff
between the last green and first red develop commits is only a Playwright
test-dependency bump (#3903), which the Lighthouse job never installs or runs.

- If this PR's `lighthouse` job **fails**, the known-green code now fails with no
  app change → the runner environment is confirmed as the cause.
- If it **passes**, the failure was introduced after the green commit and needs
  further bisection.

This file is the only change versus the green baseline; it touches no published
package, so it cannot affect any Lighthouse score.
