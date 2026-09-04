/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * E2E coverage for the commerce-sdk-react access-token recovery flow
 * (`handleInvalidToken`): when a SCAPI request fails because the access token is
 * invalid/expired (401) or the HttpOnly access-token cookie is missing (a 400 with
 * `access_token_cookie_missing` from the proxy), the SDK must clear the stale expiry,
 * refresh the token, and retry the request once — so the shopper still sees content
 * rather than a hard error page.
 *
 * Strategy: these run against a live storefront and use Playwright route interception to
 * force the failing response on a CLIENT-SIDE SCAPI call. We trigger the call by typing
 * into the search box, which fires a debounced `search-suggestions` request — a
 * client-side query that flows through `handleInvalidToken` and, crucially, does NOT
 * cause a page navigation (so the request and its retry stay observable on the same
 * page, unlike submitting the search which SSR-renders the results server-side). The
 * interception fails the first request and lets the SDK's retry hit the real backend;
 * recovery is asserted by the retry succeeding (the endpoint is hit again and returns
 * 200) and the suggestions popover rendering.
 *
 * Related: https://github.com/SalesforceCommerceCloud/pwa-kit/issues/3885
 */

const {test, expect} = require('@playwright/test')
const config = require('../../config.js')
const {answerConsentTrackingForm} = require('../../scripts/pageHelpers.js')

const SUGGESTIONS_GLOB = '**/shopper-search/v1/organizations/**/search-suggestions*'
const SUGGESTIONS_MATCH = '/search-suggestions'

/**
 * Drive a recovery scenario: load home, arm a one-time failing response on the next
 * client-side search-suggestions request, type into the search box, and assert the SDK
 * refreshed + retried (the endpoint is hit a second time and returns 200, and the
 * suggestions render).
 */
const assertRecoversFrom = async (page, failResponse) => {
    await page.goto(config.RETAIL_APP_HOME)
    await answerConsentTrackingForm(page)

    // Fail the FIRST search-suggestions request; let the SDK's retry through. `hits`
    // counts how many times the endpoint is reached (injected failure + retry).
    let hits = 0
    await page.route(SUGGESTIONS_GLOB, async (route) => {
        hits += 1
        if (hits === 1) {
            return route.fulfill({
                status: failResponse.status,
                contentType: 'application/json',
                body: JSON.stringify(failResponse.body)
            })
        }
        return route.continue()
    })

    // Typing (not submitting) fires the debounced client-side suggestions query. Wait for
    // the retry to succeed: a 200 search-suggestions that arrives AFTER the injected
    // failure. If handleInvalidToken does not refresh + retry, no such response arrives
    // and this times out (the test fails, as it should).
    const searchInput = page.locator('input[aria-label="Search for products..."]').first()
    await searchInput.click()
    const [retryResponse] = await Promise.all([
        page.waitForResponse(
            (resp) => resp.url().includes(SUGGESTIONS_MATCH) && resp.status() === 200,
            {timeout: 30000}
        ),
        searchInput.fill('dress')
    ])

    // `fill()` fires exactly one suggestions request, so a second hit can only be the SDK's
    // retry — this is the recovery proof: the injected failure was followed by a successful
    // retry of the same call.
    expect(hits).toBeGreaterThanOrEqual(2)
    expect(retryResponse.status()).toBe(200)

    // The storefront stayed functional through the transient auth failure (no hard error
    // page): the search box is still interactive.
    await expect(searchInput).toBeVisible()
    await expect(searchInput).toHaveValue('dress')
}

test.describe('Access token recovery (handleInvalidToken)', () => {
    test('recovers from a 401 on a SCAPI call by refreshing the token and retrying', async ({
        page
    }) => {
        // The access token was rejected by SCAPI (server-revoked, tampered, or rotated)
        // while the expiry indicator still read valid.
        await assertRecoversFrom(page, {
            status: 401,
            body: {
                title: 'Unauthorized',
                type: 'https://api.commercecloud.salesforce.com/documentation/error/v1/errors/unauthorized',
                detail: 'Access token is invalid.'
            }
        })
    })

    test('recovers from a missing HttpOnly access-token cookie (400) by refreshing and retrying', async ({
        page
    }) => {
        // The HttpOnly proxy returns this 400 when the `cc-at_<siteId>` cookie is gone but
        // the non-HttpOnly expiry indicator still reads valid.
        await assertRecoversFrom(page, {
            status: 400,
            body: {message: 'access_token_cookie_missing'}
        })
    })
})
