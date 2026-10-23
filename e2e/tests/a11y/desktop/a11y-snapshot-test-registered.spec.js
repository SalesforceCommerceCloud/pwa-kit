/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const {test} = require('@playwright/test')
const {
    answerConsentTrackingForm,
    registeredUserHappyPath,
    validateOrderHistory,
    wishlistFlow,
    loginShopper,
    registerShopper
} = require('../../../scripts/pageHelpers')
const {generateUserCredentials, runAccessibilityTest} = require('../../../scripts/utils')

const runTimedPhase = async (name, action) => {
    const startedAt = Date.now()
    try {
        await action()
    } finally {
        console.log(`[a11y] ${name}: ${Date.now() - startedAt}ms`)
    }
}

test.describe('Accessibility Tests with Snapshots for a registered user', async () => {
    let registeredUserCredentials = {}

    test.beforeAll(async () => {
        // Generate credentials once and use throughout tests to avoid creating a new account
        registeredUserCredentials = generateUserCredentials()
    })

    test('Registered shopper checkout should not have new accessibility issues', async ({page}) => {
        await runTimedPhase('registered checkout', () =>
            registeredUserHappyPath({
                page,
                registeredUserCredentials,
                a11y: {checkA11y: true, snapShotName: 'registered'},
                includeOrderHistory: false
            })
        )
    })

    test('Registered shopper order history should not have new accessibility issues', async ({
        page
    }) => {
        const orderHistoryCredentials = generateUserCredentials()

        await runTimedPhase('registered checkout setup for order history', () =>
            registeredUserHappyPath({
                page,
                registeredUserCredentials: orderHistoryCredentials,
                includeOrderHistory: false
            })
        )

        await runTimedPhase('registered order history', () =>
            validateOrderHistory({
                page,
                a11y: {checkA11y: true, snapShotName: 'registered'}
            })
        )
    })

    test('Wishlist page should not have any new a11y issues', async ({page}) => {
        await wishlistFlow({
            page,
            registeredUserCredentials,
            a11y: {checkA11y: true, snapShotName: 'registered'}
        })
    })
})

test.describe('Registered Account pages', () => {
    let registeredUserCredentials = {}

    test.beforeAll(async () => {
        // Generate credentials once and use throughout tests to avoid creating a new account
        registeredUserCredentials = generateUserCredentials()
    })
    test('Account pages should not have any new a11y issues', async ({page}) => {
        const isLoggedIn = await loginShopper({
            page,
            userCredentials: registeredUserCredentials
        })

        if (!isLoggedIn) {
            await registerShopper({
                page,
                userCredentials: registeredUserCredentials
            })
        }

        // The consent form shows up again after registration
        await answerConsentTrackingForm(page)

        await runAccessibilityTest(page, ['registered', 'account-details-a11y-violations.json'])

        await page.getByRole('link', {name: 'Addresses'}).click()

        await runAccessibilityTest(page, ['registered', 'account-addresses-a11y-violations.json'])
    })
})
