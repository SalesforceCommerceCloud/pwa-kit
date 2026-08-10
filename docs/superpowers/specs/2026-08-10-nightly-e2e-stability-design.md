# Nightly E2E Stability Design

## Goal

Make the nightly PWA Kit E2E matrix exercise the intended deployments and remove the repeatable test races that are currently hidden by retries in the required per-PR E2E check.

## Confirmed behavior

- `.github/workflows/e2e-pr.yml` is the required per-PR workflow. It runs the private-client application on an isolated MRT pool target and exports `RETAIL_APP_HOME` in the same shell that launches Playwright.
- `.github/workflows/e2e.yml` is the scheduled matrix. It runs no-ext, ext, and private-client variants across Node 20, 22, and 24 with npm 10 and 11.
- The nightly private-client job deploys `e2e-pwa-kit-private`, but its standalone `export RETAIL_APP_HOME=...` step does not persist. Playwright therefore falls back to the shared no-ext URL from `e2e/config.js`.
- The passing per-PR check on PR #3967 contained three flaky first attempts: BOPIS, desktop bundle checkout, and mobile bundle checkout. Retries hid the same failure families later reported by nightly.
- Mobile checkout failures occur while shipping-option content intercepts pointer events over the visible `Continue to Payment` button and the button is re-rendered.
- The master-product wishlist test can observe both a prior variant and the newly added master product. Cleanup currently ignores non-2xx responses and does not verify the final empty state.
- The BOPIS test asserts Chakra's `data-checked` implementation attribute on a label instead of the radio's accessible checked state.

## Design

### Workflow targeting and diagnostics

Set private-client test configuration through workflow `env` so it is available to Playwright and a11y steps. Keep the per-PR and nightly workflows separate: shared test changes apply to both, while the fixed target configuration applies to nightly. Print the resolved target at test startup and fail early if a private-client job resolves to the shared no-ext host.

Upload Playwright test results for failed nightly matrix jobs. Artifacts must be uniquely named by application flavor, Node version, and npm version so parallel or sequential matrix cells cannot overwrite one another.

### Checkout synchronization

Introduce one E2E helper responsible for advancing from shipping options to payment. It will:

1. Return immediately if the payment heading is already visible.
2. Locate `Continue to Payment` within the active shipping-options step.
3. Wait for the button to be visible and enabled.
4. Click it and wait for the payment heading as the observable state transition.

The helper must not swallow click errors. It will replace duplicated count/isEnabled logic and the broad `try/catch` that currently converts a click-interception failure into a misleading missing-heading timeout. It will not use forced clicks because that would bypass the real user interaction contract.

### Cleanup isolation

Separate response validation from cleanup orchestration so it can be unit tested. Every cleanup SCAPI response must be checked. Non-2xx responses will produce a diagnostic containing the operation label, status, and response body rather than silently returning.

Cleanup remains best-effort in `afterEach` so a cleanup outage does not overwrite the original test failure. After deletion, it will re-read the basket and wishlist state with a bounded retry to tolerate eventual consistency. Exhausted verification will emit a clear warning identifying the remaining resources.

### BOPIS assertion

Target the pickup radio through its accessible role/value and assert `toBeChecked()`. Wait on the radio's checked state after selection instead of relying on `waitForLoadState()`, which does not represent the product-view SPA update.

## Testing

- Add unit tests for cleanup response validation, non-2xx diagnostics, and bounded empty-state verification.
- Add focused tests for the checkout transition helper using Playwright locator/page doubles already established by the E2E test utilities, or extract a small dependency-injected helper if no suitable pattern exists.
- Add a static workflow regression test that parses `e2e.yml` and verifies private-client Playwright steps receive the private target and failed matrix jobs upload uniquely named results.
- Run the focused Jest tests, E2E lint, YAML/static workflow validation, and the repository's relevant unit suite.
- Live MRT E2E verification is a separate CI confirmation because it requires shared credentials, deployments, and mutable Commerce Cloud data.

## Non-goals

- Do not remove Playwright retries or make flaky tests fail the PR check in this change.
- Do not merge the per-PR and nightly workflows.
- Do not change application checkout behavior unless a deterministic application defect is uncovered by the new diagnostics.
- Do not modify the user's uncommitted template application files in the primary checkout.
