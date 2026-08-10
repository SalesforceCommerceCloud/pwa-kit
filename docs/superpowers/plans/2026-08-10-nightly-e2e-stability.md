# Nightly E2E Stability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the scheduled no-ext, ext, and private-client E2E matrix target the intended deployments, preserve actionable failure evidence, and remove the checkout, cleanup, and BOPIS races already visible beneath per-PR retries.

**Architecture:** Keep `.github/workflows/e2e-pr.yml` as the required per-PR private-client workflow and change only shared E2E helpers/tests plus the scheduled `.github/workflows/e2e.yml`. Express workflow invariants as parsed YAML contract tests, centralize the shipping-to-payment transition in one Playwright helper, and keep after-test cleanup best-effort while validating every SCAPI response and boundedly re-reading state.

**Tech Stack:** GitHub Actions YAML, Node.js CommonJS helpers, Jest 29, Playwright 1.61, ESLint, Prettier, `js-yaml` 4.

## Global Constraints

- Work only in `/Users/j.sheth/Documents/Salesforce/pwa/pwa-kit/.worktrees/fix-nightly-e2e-stability` on branch `fix/nightly-e2e-stability`.
- Do not edit `.github/workflows/e2e-pr.yml`; it remains the separate per-PR workflow.
- Do not remove Playwright retries or force clicks.
- Do not change storefront checkout application behavior.
- Preserve cleanup as best-effort so cleanup failures do not replace the original test result.
- Do not touch the user's uncommitted files in the primary checkout.
- Treat run `31370372920` and PR-run `31217463570` as the red live-environment evidence. Full MRT E2E confirmation must happen in CI because it needs shared credentials, deployment targets, and mutable Commerce Cloud data.

---

## Task 1: Add an executable contract for the scheduled workflow

**Files:**

- Create: `e2e/scripts/validate-nightly-workflow.test.js`
- Create: `e2e/scripts/validate-nightly-workflow.js`
- Modify: `e2e/package.json`
- Modify: `e2e/package-lock.json`

**Interfaces:**

```js
loadWorkflow(filePath) -> object
validateNightlyWorkflow(workflow) -> undefined | throws Error
```

- [ ] **Step 1: Write the failing contract test against the real workflow**

Create `e2e/scripts/validate-nightly-workflow.test.js`:

```js
/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const path = require('path')
const {loadWorkflow, validateNightlyWorkflow} = require('./validate-nightly-workflow')

describe('nightly E2E workflow', () => {
    test('targets private-client and preserves uniquely named failure artifacts', () => {
        const workflow = loadWorkflow(
            path.resolve(__dirname, '../../.github/workflows/e2e.yml')
        )

        expect(() => validateNightlyWorkflow(workflow)).not.toThrow()
    })
})
```

- [ ] **Step 2: Run the suite and confirm it fails for the missing module**

Run:

```bash
npm test --prefix e2e
```

Expected: FAIL with `Cannot find module './validate-nightly-workflow'`.

- [ ] **Step 3: Add the YAML parser as a declared E2E development dependency**

Run:

```bash
npm install --prefix e2e --save-dev js-yaml@^4.1.0
```

Expected: `e2e/package.json` and `e2e/package-lock.json` declare `js-yaml` 4.x; no root application dependencies change.

- [ ] **Step 4: Implement the semantic validator**

Create `e2e/scripts/validate-nightly-workflow.js`:

```js
/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const fs = require('fs')
const yaml = require('js-yaml')

const PRIVATE_CLIENT_HOME =
    'https://scaffold-pwa-e2e-pwa-kit-private.mobify-storefront.com'
const MATRIX_JOBS = [
    ['run-generator-retail-app-no-ext', 'no-ext'],
    ['run-generator-retail-app-ext', 'ext'],
    ['run-generator-private-client', 'private-client']
]

const loadWorkflow = (filePath) => yaml.load(fs.readFileSync(filePath, 'utf8'))

const requireCondition = (condition, message) => {
    if (!condition) throw new Error(message)
}

const validateNightlyWorkflow = (workflow) => {
    const jobs = workflow.jobs || {}
    const privateJob = jobs['run-generator-private-client']

    requireCondition(privateJob, 'Missing private-client matrix job')
    requireCondition(
        privateJob.env?.RETAIL_APP_HOME === PRIVATE_CLIENT_HOME,
        `Private-client RETAIL_APP_HOME must be ${PRIVATE_CLIENT_HOME}`
    )

    const privatePlaywrightStep = privateJob.steps?.find(
        (step) => step.name === 'Run Playwright tests'
    )
    requireCondition(
        privatePlaywrightStep?.run?.includes('test "$RETAIL_APP_HOME" ='),
        'Private-client Playwright step must fail fast when RETAIL_APP_HOME is wrong'
    )

    for (const [jobId, flavor] of MATRIX_JOBS) {
        const job = jobs[jobId]
        const artifactStep = job?.steps?.find(
            (step) => step.uses === 'actions/upload-artifact@v4'
        )
        const expectedName = `playwright-results-${flavor}-node-\${{ matrix.node }}-npm-\${{ matrix.npm }}`

        requireCondition(artifactStep, `${jobId} must upload Playwright results`)
        requireCondition(
            artifactStep.if === '${{ failure() }}',
            `${jobId} must upload results only after failure`
        )
        requireCondition(
            artifactStep.with?.name === expectedName,
            `${jobId} artifact name must include flavor, Node, and npm`
        )
        requireCondition(
            artifactStep.with?.path === 'test-results',
            `${jobId} must upload test-results`
        )
    }
}

module.exports = {loadWorkflow, validateNightlyWorkflow}
```

- [ ] **Step 5: Run the suite and confirm the validator exposes the real workflow defect**

Run:

```bash
npm test --prefix e2e
```

Expected: FAIL with `Private-client RETAIL_APP_HOME must be https://scaffold-pwa-e2e-pwa-kit-private.mobify-storefront.com`; this proves the test checks behavior missing from the current workflow rather than merely loading YAML.

- [ ] **Step 6: Commit the red contract**

```bash
git add e2e/package.json e2e/package-lock.json e2e/scripts/validate-nightly-workflow.js e2e/scripts/validate-nightly-workflow.test.js
git commit -m "test: define nightly e2e workflow contract"
```

---

## Task 2: Correct nightly targeting and retain failed Playwright artifacts

**Files:**

- Modify: `.github/workflows/e2e.yml:60-153`
- Modify: `.github/workflows/e2e.yml:170-261`
- Modify: `.github/workflows/e2e.yml:282-382`

- [ ] **Step 1: Make the private target persistent at job scope**

Under `run-generator-private-client.env`, add:

```yaml
RETAIL_APP_HOME: https://scaffold-pwa-e2e-pwa-kit-private.mobify-storefront.com
```

Delete the ineffective standalone steps named `Set Retail App Private Client Home` and `Set PWA Kit E2E Test User`. The latter is also ineffective today because its shell export does not persist; no tests currently receive those values from that step.

- [ ] **Step 2: Print and enforce the private target in the process that launches Playwright**

Replace the private-client Playwright step with:

```yaml
- name: Run Playwright tests
  run: |-
    echo "RETAIL_APP_HOME=$RETAIL_APP_HOME"
    test "$RETAIL_APP_HOME" = "https://scaffold-pwa-e2e-pwa-kit-private.mobify-storefront.com"
    npm run test:e2e
```

The job-level environment also reaches the subsequent a11y command.

- [ ] **Step 3: Upload failure evidence for every scheduled application matrix**

Immediately after the no-ext Playwright step, add:

```yaml
- name: Upload Playwright test results
  if: ${{ failure() }}
  uses: actions/upload-artifact@v4
  with:
    name: playwright-results-no-ext-node-${{ matrix.node }}-npm-${{ matrix.npm }}
    path: test-results
    if-no-files-found: ignore
    retention-days: 7
```

Add the same step after the ext Playwright step with this name:

```yaml
name: playwright-results-ext-node-${{ matrix.node }}-npm-${{ matrix.npm }}
```

Add it after the private-client a11y step so either Playwright or a11y failure reaches it, using:

```yaml
name: playwright-results-private-client-node-${{ matrix.node }}-npm-${{ matrix.npm }}
```

Keep `path`, `if-no-files-found`, and `retention-days` identical in all three jobs.

- [ ] **Step 4: Run the workflow contract and all existing E2E Jest tests**

Run:

```bash
npm test --prefix e2e
```

Expected: PASS, including `validate-nightly-workflow.test.js` and the existing 84 baseline tests.

- [ ] **Step 5: Validate formatting and commit**

Run:

```bash
npx prettier --check .github/workflows/e2e.yml e2e/scripts/validate-nightly-workflow.js e2e/scripts/validate-nightly-workflow.test.js e2e/package.json
git diff --check
```

Expected: both commands exit 0.

```bash
git add .github/workflows/e2e.yml
git commit -m "fix: target private app in nightly e2e"
```

---

## Task 3: Centralize and harden the shipping-to-payment transition

**Files:**

- Create: `e2e/scripts/checkout.js`
- Create: `e2e/scripts/checkout.test.js`
- Modify: `e2e/scripts/pageHelpers.js:8-10,477-510,584-619`
- Modify: `e2e/tests/mobile/guest-shopper.spec.js:8-14,63-82`
- Modify: `e2e/tests/mobile/registered-shopper.spec.js:8-15,91-119`

**Interface:**

```js
advanceToPayment(page) -> Promise<void>
```

- [ ] **Step 1: Write focused tests for both checkout paths and error propagation**

Create `e2e/scripts/checkout.test.js` with a small locator/page double factory. The three tests must assert observable outcomes:

```js
/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const {advanceToPayment} = require('./checkout')

const createCheckout = ({paymentVisible = false, clickError} = {}) => {
    const transition = {
        first: jest.fn().mockReturnThis(),
        waitFor: jest.fn().mockResolvedValue()
    }
    const payment = {
        isVisible: jest
            .fn()
            .mockResolvedValueOnce(paymentVisible)
            .mockResolvedValue(paymentVisible),
        or: jest.fn().mockReturnValue(transition),
        waitFor: jest.fn().mockResolvedValue()
    }
    const button = {
        waitFor: jest.fn().mockResolvedValue(),
        click: clickError
            ? jest.fn().mockRejectedValue(clickError)
            : jest.fn().mockResolvedValue()
    }
    const form = {
        getByRole: jest.fn().mockReturnValue(button)
    }
    const page = {
        getByRole: jest.fn().mockReturnValue(payment),
        getByTestId: jest.fn().mockReturnValue(form)
    }

    return {page, payment, form, button, transition}
}

describe('advanceToPayment', () => {
    test('returns when checkout already advanced to payment', async () => {
        const checkout = createCheckout({paymentVisible: true})

        await advanceToPayment(checkout.page)

        expect(checkout.page.getByTestId).not.toHaveBeenCalled()
    })

    test('clicks the active shipping form and waits for payment', async () => {
        const checkout = createCheckout()

        await advanceToPayment(checkout.page)

        expect(checkout.transition.waitFor).toHaveBeenCalledWith({state: 'visible'})
        expect(checkout.form.getByRole).toHaveBeenCalledWith('button', {
            name: /Continue to Payment/i
        })
        expect(checkout.button.waitFor).toHaveBeenCalledWith({state: 'visible'})
        expect(checkout.button.click).toHaveBeenCalledTimes(1)
        expect(checkout.payment.waitFor).toHaveBeenCalledWith({state: 'visible'})
    })

    test('propagates an intercepted click instead of masking it', async () => {
        const clickError = new Error('pointer events intercepted')
        const checkout = createCheckout({clickError})

        await expect(advanceToPayment(checkout.page)).rejects.toThrow(clickError)
        expect(checkout.payment.waitFor).not.toHaveBeenCalled()
    })
})
```

- [ ] **Step 2: Run the suite and confirm it fails for the missing helper**

Run:

```bash
npm test --prefix e2e
```

Expected: FAIL with `Cannot find module './checkout'`.

- [ ] **Step 3: Implement the transition around observable UI state**

Create `e2e/scripts/checkout.js`:

```js
/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const advanceToPayment = async (page) => {
    const paymentHeading = page.getByRole('heading', {name: /Payment/i})
    if (await paymentHeading.isVisible()) return

    const shippingForm = page.getByTestId('sf-checkout-shipping-options-form')

    // Checkout may auto-submit shipping and advance while this helper starts.
    await paymentHeading.or(shippingForm).first().waitFor({state: 'visible'})
    if (await paymentHeading.isVisible()) return

    const continueToPayment = shippingForm.getByRole('button', {
        name: /Continue to Payment/i
    })
    await continueToPayment.waitFor({state: 'visible'})

    // Locator.click re-resolves after React renders and waits for the button to
    // be stable, enabled, and able to receive pointer events.
    await continueToPayment.click()
    await paymentHeading.waitFor({state: 'visible'})
}

module.exports = {advanceToPayment}
```

- [ ] **Step 4: Replace all four duplicated shipping-step branches**

Import the helper in `pageHelpers.js` and both mobile specs:

```js
const {advanceToPayment} = require('./checkout')
```

Use `../../scripts/checkout` from mobile spec files.

In `checkoutProduct`, preserve the optional a11y call before transitioning, remove the broad `try/catch`, and call:

```js
await advanceToPayment(page)
```

In `registeredUserHappyPath`, replace the `count()`/`isEnabled()` branch with the helper and retain its existing `Edit Shipping Options` assertion after the helper returns. In mobile guest checkout, replace `waitForLoadState()` and the `count()`/`isEnabled()` branch with the helper. In mobile registered checkout, replace `waitForLoadState()`, the timeout-catching branch, `hasShippingStep`, and its conditional step-2 edit assertion with the helper. Each path keeps its existing Payment-heading assertion after the helper; none infers whether shipping succeeded from a swallowed click error.

- [ ] **Step 5: Run tests and lint**

Run:

```bash
npm test --prefix e2e
npm run lint --prefix e2e
```

Expected: PASS; checkout tests prove already-advanced, explicit transition, and click-error paths.

- [ ] **Step 6: Commit the checkout change**

```bash
git add e2e/scripts/checkout.js e2e/scripts/checkout.test.js e2e/scripts/pageHelpers.js e2e/tests/mobile/guest-shopper.spec.js e2e/tests/mobile/registered-shopper.spec.js
git commit -m "fix: synchronize e2e checkout transition"
```

---

## Task 4: Validate cleanup responses and verify empty shopper state

**Files:**

- Create: `e2e/scripts/cleanup.test.js`
- Modify: `e2e/scripts/cleanup.js:8-126`
- Modify: `e2e/scripts/pageHelpers.js:836-845`

**Interfaces:**

```js
ensureOkResponse(label, response) -> Promise<Response>
verifyEmpty({label, readIds, attempts, retryDelay, sleepFn}) -> Promise<void>
```

- [ ] **Step 1: Write response-validation and bounded-retry tests**

Create `e2e/scripts/cleanup.test.js`:

```js
/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const {ensureOkResponse, verifyEmpty} = require('./cleanup')

describe('cleanup response validation', () => {
    test('returns successful responses', async () => {
        const response = {ok: () => true}

        await expect(ensureOkResponse('GET baskets', response)).resolves.toBe(response)
    })

    test('reports operation, status, and response body', async () => {
        const response = {
            ok: () => false,
            status: () => 503,
            text: jest.fn().mockResolvedValue('service unavailable')
        }

        await expect(ensureOkResponse('GET baskets', response)).rejects.toThrow(
            'GET baskets failed with status 503: service unavailable'
        )
    })
})

describe('cleanup empty-state verification', () => {
    test('retries until no resource ids remain', async () => {
        const readIds = jest
            .fn()
            .mockResolvedValueOnce(['basket-1'])
            .mockResolvedValueOnce([])
        const sleepFn = jest.fn().mockResolvedValue()

        await expect(
            verifyEmpty({label: 'baskets', readIds, attempts: 3, retryDelay: 25, sleepFn})
        ).resolves.toBeUndefined()
        expect(readIds).toHaveBeenCalledTimes(2)
        expect(sleepFn).toHaveBeenCalledWith(25)
    })

    test('reports remaining resource ids after the retry bound', async () => {
        const readIds = jest.fn().mockResolvedValue(['item-1', 'item-2'])
        const sleepFn = jest.fn().mockResolvedValue()

        await expect(
            verifyEmpty({label: 'wishlist items', readIds, attempts: 3, sleepFn})
        ).rejects.toThrow('wishlist items still contains: item-1, item-2')
        expect(readIds).toHaveBeenCalledTimes(3)
        expect(sleepFn).toHaveBeenCalledTimes(2)
    })
})
```

- [ ] **Step 2: Run the suite and confirm the new exports are missing**

Run:

```bash
npm test --prefix e2e
```

Expected: FAIL because `ensureOkResponse` and `verifyEmpty` are not functions.

- [ ] **Step 3: Implement reusable validation and retry primitives**

Import `sleep` from `./utils` and add:

```js
const ensureOkResponse = async (label, response) => {
    if (response?.ok()) return response

    const status = response?.status?.() ?? 'unknown'
    let responseBody = ''
    try {
        responseBody = await response?.text()
    } catch {
        responseBody = ''
    }

    throw new Error(
        `${label} failed with status ${status}${responseBody ? `: ${responseBody}` : ''}`
    )
}

const verifyEmpty = async ({
    label,
    readIds,
    attempts = 3,
    retryDelay = 250,
    sleepFn = sleep
}) => {
    let remainingIds = []
    for (let attempt = 1; attempt <= attempts; attempt++) {
        remainingIds = await readIds()
        if (remainingIds.length === 0) return
        if (attempt < attempts) await sleepFn(retryDelay)
    }

    throw new Error(`${label} still contains: ${remainingIds.join(', ')}`)
}
```

Export both helpers with `clearCartAndWishlist`.

- [ ] **Step 4: Route every SCAPI call through response validation**

Define `readBasketIds` and `readWishlist` as closures inside `clearCartAndWishlist` after `baseUrl`, `siteId`, `orgId`, and `headers` are created. Both GET responses must call `ensureOkResponse` before `.json()`. For each DELETE, await the request and then call `ensureOkResponse` with its existing operation label. Preserve `safeRequest` at orchestration boundaries so errors become warnings in this exact format:

```text
[e2e cleanup] DELETE basket <id> failed: DELETE basket <id> failed with status <status>: <body>
```

Do not condition behavior on `response.ok()` without reporting the false branch.

- [ ] **Step 5: Re-read baskets and wishlist items after deletion**

After the DELETE promises settle, call `verifyEmpty` through `safeRequest`:

```js
await safeRequest('verify baskets empty', () =>
    verifyEmpty({label: 'baskets', readIds: readBasketIds})
)
await safeRequest('verify wishlist empty', () =>
    verifyEmpty({
        label: 'wishlist items',
        readIds: async () => (await readWishlist())?.items.map((item) => item.id) ?? []
    })
)
```

`readWishlist` must return `{id, items}` when a wish list exists and `{id: null, items: []}` otherwise. Verification exhaustion remains a warning because `safeRequest` catches it.

- [ ] **Step 6: Make the master-product assertion identify its behavior, not every matching heading**

In `addMasterProductToWishlistAndCart`, remove the unscoped duplicate-prone product-heading assertion after navigating to `/account/wishlist`. Keep the `Wishlist` heading assertion, then use the unique `View Options` button as the observable master-product behavior:

```js
const viewOptionsButton = page.getByRole('button', {name: /View Options/i})
await expect(viewOptionsButton).toBeVisible()
```

Cleanup diagnostics will still report a stale variant ID; it will no longer turn an otherwise valid master-product assertion into a Playwright strict-mode error.

- [ ] **Step 7: Run tests and lint, then commit**

Run:

```bash
npm test --prefix e2e
npm run lint --prefix e2e
```

Expected: PASS, including the successful response, non-2xx body, eventual-empty, and exhausted-retry cases.

```bash
git add e2e/scripts/cleanup.js e2e/scripts/cleanup.test.js e2e/scripts/pageHelpers.js
git commit -m "fix: diagnose and verify e2e cleanup"
```

---

## Task 5: Assert BOPIS through the radio's public state

**Files:**

- Modify: `e2e/tests/desktop/bopis.spec.js:56-72`

- [ ] **Step 1: Use the existing live failure as the red regression evidence**

The failing assertion in Actions run `31370372920` targets `label.chakra-radio` and waits for Chakra's private `data-checked` attribute. A local run is not a safe substitute because this spec requires the deployed storefront, inventory data, credentials, and shared Commerce Cloud state.

- [ ] **Step 2: Replace the implementation-detail locator and load-state waits**

Replace:

```js
await page.waitForLoadState()
const pickupRadio = page.locator('label.chakra-radio:has(input[value="pickup"])')
await pickupRadio.click()
await page.waitForLoadState()
await expect(pickupRadio).toHaveAttribute('data-checked')
```

with:

```js
const pickupRadio = page.getByRole('radio', {name: /Pick Up in Store/i})
await pickupRadio.click()
await expect(pickupRadio).toBeChecked()
```

This matches the component's actual accessible label (`Pick Up in Store`) and waits on the user-visible selection contract.

- [ ] **Step 3: Run local static verification**

Run:

```bash
npm test --prefix e2e
npm run lint --prefix e2e
npx prettier --check e2e/tests/desktop/bopis.spec.js
git diff --check
```

Expected: all commands exit 0.

- [ ] **Step 4: Commit**

```bash
git add e2e/tests/desktop/bopis.spec.js
git commit -m "fix: assert bopis radio state accessibly"
```

---

## Task 6: Final verification and CI handoff

**Files:**

- Verify all files changed by Tasks 1-5.

- [ ] **Step 1: Review the diff for scope and secrets**

Run:

```bash
git status --short
git diff --stat HEAD~5
git diff HEAD~5 -- .github/workflows/e2e.yml e2e
```

Confirm `.github/workflows/e2e-pr.yml` and template application source are absent from the diff. Confirm the obsolete hard-coded `PWA_E2E_USER_PASSWORD` line is removed rather than relocated.

- [ ] **Step 2: Run the complete local verification set**

Run:

```bash
npm test --prefix e2e
npm run lint --prefix e2e
npx prettier --check .github/workflows/e2e.yml e2e/package.json e2e/scripts/checkout.js e2e/scripts/checkout.test.js e2e/scripts/cleanup.js e2e/scripts/cleanup.test.js e2e/scripts/validate-nightly-workflow.js e2e/scripts/validate-nightly-workflow.test.js e2e/tests/desktop/bopis.spec.js e2e/tests/mobile/guest-shopper.spec.js e2e/tests/mobile/registered-shopper.spec.js
git diff --check
```

Expected: every command exits 0. Record suite and test counts from fresh output.

- [ ] **Step 3: Confirm commit and worktree state**

Run:

```bash
git status --short --branch
git log --oneline --decorate -7
```

Expected: clean `fix/nightly-e2e-stability` worktree with the design, workflow contract, workflow fix, checkout fix, cleanup fix, and BOPIS fix commits.

- [ ] **Step 4: Handoff the live verification boundary explicitly**

Report that local contract/unit/lint/format checks passed, but do not claim nightly is fixed until a GitHub Actions run exercises:

- all 18 no-ext/ext/private-client Node/npm matrix cells;
- private-client logs showing the private URL;
- no exhausted retries in the BOPIS, desktop bundle checkout, mobile bundle checkout, and master wishlist tests;
- uniquely named `playwright-results-*` artifacts on any failed cell.

Do not push or trigger CI without explicit user authorization.
