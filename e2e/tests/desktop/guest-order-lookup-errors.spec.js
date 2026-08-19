/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * S19: Guest Order Access — error paths
 *
 * All tests use Playwright route interception to mock API responses.
 * No real SCAPI calls are made.
 *
 * Base URL is controlled by GUEST_ORDER_LOOKUP_E2E_BASE_URL (feature must be on).
 * See GROUP6_DECISIONS.md for CI wiring notes.
 */

const {test, expect} = require('@playwright/test')
const AxeBuilder = require('@axe-core/playwright')
const config = require('../../config.js')
const {answerConsentTrackingForm} = require('../../scripts/pageHelpers.js')

const FEATURE_ON_BASE_URL = process.env.GUEST_ORDER_LOOKUP_E2E_BASE_URL || config.RETAIL_APP_HOME
// Feature-on suites require a dedicated deployment with guestOrderLookup.enabled=true.
// Skip them in standard CI where GUEST_ORDER_LOOKUP_E2E_BASE_URL is not set.
const FEATURE_ON = !!process.env.GUEST_ORDER_LOOKUP_E2E_BASE_URL

// ---------------------------------------------------------------------------
// Shared mock helpers
// ---------------------------------------------------------------------------

const mockSlasToken = (page) => {
    return page.route('**/oauth2/token**', (route) => {
        route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                access_token: 'mock-guest-token',
                token_type: 'Bearer',
                expires_in: 1800,
                refresh_token: 'mock-refresh-token',
                usid: 'mock-usid',
                customer_id: 'mock-cust-id',
                enc_user_id: '',
                idp_access_token: null
            })
        })
    })
}

const mockRequestCode = (page) => {
    return page.route(
        '**/shopper-orders/v1/organizations/*/request-order-access-code**',
        (route) => {
            route.fulfill({status: 202, body: ''})
        }
    )
}

/**
 * Type a 6-digit access code into the individual digit inputs on the verify page.
 * Each digit has aria-label "Digit N of 6".
 */
const fillOtpCode = async (page, code) => {
    for (let i = 0; i < Math.min(code.length, 6); i++) {
        await page.getByLabel(new RegExp(`digit ${i + 1} of 6`, 'i')).fill(code[i])
    }
}

/**
 * Navigate from Step 1 to Step 2 with router state (order number + email).
 * Prerequisite: mockRequestCode and mockSlasToken should already be set up.
 */
const navigateToStep2 = async (page, {orderNo = 'ORD-001234', email = 'test@example.com'} = {}) => {
    await page.goto(FEATURE_ON_BASE_URL + '/order-lookup')
    await answerConsentTrackingForm(page)

    await page.getByLabel(/order number/i).fill(orderNo)
    await page.getByLabel(/email address/i).fill(email)

    await Promise.all([
        page.waitForURL('**/order-lookup/verify/**'),
        page.getByRole('button', {name: /find my order/i}).click()
    ])

    await expect(page.getByRole('heading', {name: /verify your email/i})).toBeVisible()
}

// ---------------------------------------------------------------------------
// Error path tests
// ---------------------------------------------------------------------------

test.describe('Guest Order Access — error paths (feature-on)', () => {
    test.skip(!FEATURE_ON, 'Requires GUEST_ORDER_LOOKUP_E2E_BASE_URL to be set')
    test.beforeEach(async ({page}) => {
        await mockSlasToken(page)
        await mockRequestCode(page)
    })

    test('Invalid/expired code: mock 404 → inline error visible, still on Step 2', async ({
        page
    }) => {
        await page.route('**/api/order-lookup/verify', (route) => {
            route.fulfill({status: 404, contentType: 'application/json', body: '{}'})
        })

        await navigateToStep2(page)

        await fillOtpCode(page, '000000')
        await page.getByRole('button', {name: /verify code/i}).click()

        // Inline error message visible
        await expect(page.getByRole('alert')).toBeVisible()
        await expect(page.getByText(/invalid or has expired/i)).toBeVisible()

        // Still on Step 2 — did NOT navigate to Step 3
        expect(page.url()).toContain('/order-lookup/verify')
        expect(page.url()).not.toContain('/order-lookup/order')
    })

    test('Throttle: mock 429 → inline "Too many attempts" error', async ({page}) => {
        await page.route('**/api/order-lookup/verify', (route) => {
            route.fulfill({status: 429, contentType: 'application/json', body: '{}'})
        })

        await navigateToStep2(page)

        await fillOtpCode(page, '111111')
        await page.getByRole('button', {name: /verify code/i}).click()

        await expect(page.getByRole('alert')).toBeVisible()
        await expect(page.getByText(/too many attempts/i)).toBeVisible()

        expect(page.url()).toContain('/order-lookup/verify')
    })

    test('Mid-session expiry on Step 3: mock 404 from GET order → redirect to /order-lookup?expired=1 → expiry banner visible', async ({
        page
    }) => {
        // First verify succeeds
        await page.route('**/api/order-lookup/verify', (route) => {
            route.fulfill({status: 200, contentType: 'application/json', body: '{}'})
        })

        // Order endpoint returns 404 (session expired)
        await page.route('**/api/order-lookup/order**', (route) => {
            route.fulfill({status: 404, contentType: 'application/json', body: '{}'})
        })

        await navigateToStep2(page)

        await fillOtpCode(page, '123456')

        await Promise.all([
            page.waitForURL('**/order-lookup/order/**'),
            page.getByRole('button', {name: /verify code/i}).click()
        ])

        // Step 3 fetches the order and gets 404 — component redirects to /order-lookup?order=...&expired=1
        await page.waitForURL('**/order-lookup?**expired=1**', {timeout: 10000})

        expect(page.url()).toContain('/order-lookup')
        expect(page.url()).toContain('expired=1')

        // Expiry banner / alert should be visible on Step 1
        await expect(page.getByRole('alert')).toBeVisible()
        await expect(page.getByText(/session has expired/i)).toBeVisible()
    })

    test('Mid-session expiry on Step 3: mock 403 from GET order → redirect to /order-lookup?expired=1 → expiry banner and orderNo pre-filled', async ({
        page
    }) => {
        await page.route('**/api/order-lookup/verify', (route) => {
            route.fulfill({status: 200, contentType: 'application/json', body: '{}'})
        })

        // Order endpoint returns 403 (session cookie missing/expired)
        await page.route('**/api/order-lookup/order**', (route) => {
            route.fulfill({status: 403, contentType: 'application/json', body: '{}'})
        })

        await navigateToStep2(page)

        await fillOtpCode(page, '123456')

        await Promise.all([
            page.waitForURL('**/order-lookup/order/**'),
            page.getByRole('button', {name: /verify code/i}).click()
        ])

        // Step 3 fetches the order and gets 403 — component redirects to /order-lookup?order=...&expired=1
        await page.waitForURL('**/order-lookup?**expired=1**', {timeout: 10000})

        expect(page.url()).toContain('/order-lookup')
        expect(page.url()).toContain('expired=1')
        expect(page.url()).toContain('order=')

        // Expiry banner and orderNo pre-fill visible on Step 1
        await expect(page.getByRole('alert')).toBeVisible()
        await expect(page.getByText(/session has expired/i)).toBeVisible()
    })

    test('Direct navigation to /order-lookup/verify without orderNo → redirect to /order-lookup', async ({
        page
    }) => {
        // Navigate directly to Step 2 without a :orderNo segment
        await page.goto(FEATURE_ON_BASE_URL + '/order-lookup/verify')
        await answerConsentTrackingForm(page)

        // The verify page has a <Redirect to="/order-lookup" /> when orderNo is missing
        await page.waitForURL('**/order-lookup', {timeout: 5000})

        expect(page.url()).toContain('/order-lookup')
        expect(page.url()).not.toContain('/order-lookup/verify')
        expect(page.url()).not.toContain('/order-lookup/order')
    })
})

// ---------------------------------------------------------------------------
// S19 a11y: run axe on all three pages — zero critical violations
// (These tests duplicate the a11y checks from S18 so they appear in the
// dedicated S19 error-path file; the checks complement each other.)
// ---------------------------------------------------------------------------

test.describe('Guest Order Access — a11y critical violations check (S19)', () => {
    test.skip(!FEATURE_ON, 'Requires GUEST_ORDER_LOOKUP_E2E_BASE_URL to be set')
    test.beforeEach(async ({page}) => {
        await mockSlasToken(page)
        await mockRequestCode(page)
    })

    test('Step 1 with expiry banner has zero critical axe violations', async ({page}) => {
        await page.goto(FEATURE_ON_BASE_URL + '/order-lookup?expired=1')
        await answerConsentTrackingForm(page)

        await expect(page.getByRole('heading', {name: /look up your order/i})).toBeVisible()

        const results = await new AxeBuilder({page})
            .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
            .analyze()

        const criticalViolations = results.violations.filter((v) => v.impact === 'critical')
        expect(
            criticalViolations,
            `Critical a11y violations on Step 1 with expiry banner: ${JSON.stringify(
                criticalViolations.map((v) => v.id)
            )}`
        ).toHaveLength(0)
    })

    test('Step 2 with 404 server error has zero critical axe violations', async ({page}) => {
        await page.route('**/api/order-lookup/verify', (route) => {
            route.fulfill({status: 404, contentType: 'application/json', body: '{}'})
        })

        await navigateToStep2(page)

        // Trigger the error state
        await fillOtpCode(page, '000000')
        await page.getByRole('button', {name: /verify code/i}).click()

        await expect(page.getByRole('alert')).toBeVisible()

        const results = await new AxeBuilder({page})
            .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
            .analyze()

        const criticalViolations = results.violations.filter((v) => v.impact === 'critical')
        expect(
            criticalViolations,
            `Critical a11y violations on Step 2 error state: ${JSON.stringify(
                criticalViolations.map((v) => v.id)
            )}`
        ).toHaveLength(0)
    })

    test('Step 3 order details page has zero critical axe violations', async ({page}) => {
        await page.route('**/api/order-lookup/verify', (route) => {
            route.fulfill({status: 200, contentType: 'application/json', body: '{}'})
        })
        await page.route('**/api/order-lookup/order**', (route) => {
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    orderNo: 'ORD-001234',
                    status: 'Open',
                    creationDate: '2024-01-15T10:00:00.000Z',
                    currency: 'USD',
                    productSubTotal: 49.99,
                    shippingTotal: 5.99,
                    taxTotal: 4.0,
                    orderTotal: 59.98,
                    productItems: [
                        {
                            itemId: 'item-1',
                            productName: 'Cotton Turtleneck Sweater',
                            quantity: 1,
                            price: 49.99,
                            adjustedPrice: 49.99
                        }
                    ],
                    shipments: [
                        {
                            shipmentId: 'shipment-1',
                            shippingStatus: 'Shipped',
                            shippingAddress: {postalCode: '10001'},
                            trackingNumber: 'TRACK123456',
                            expectedDeliveryDate: '2024-01-20T00:00:00.000Z'
                        }
                    ]
                })
            })
        })

        await navigateToStep2(page)

        await fillOtpCode(page, '123456')

        await Promise.all([
            page.waitForURL('**/order-lookup/order/**'),
            page.getByRole('button', {name: /verify code/i}).click()
        ])

        await expect(page.getByRole('heading', {name: /order details/i})).toBeVisible()

        const results = await new AxeBuilder({page})
            .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
            .analyze()

        const criticalViolations = results.violations.filter((v) => v.impact === 'critical')
        expect(
            criticalViolations,
            `Critical a11y violations on Step 3: ${JSON.stringify(
                criticalViolations.map((v) => v.id)
            )}`
        ).toHaveLength(0)
    })
})
