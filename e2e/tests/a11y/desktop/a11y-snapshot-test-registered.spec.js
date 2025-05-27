/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const {test, expect} = require('@playwright/test')
const {
    answerConsentTrackingForm,
    registeredUserHappyPath,
    wishlistFlow,
    loginShopper,
    registerShopper
} = require('../../../scripts/pageHelpers')
const {generateUserCredentials, runAccessibilityTest} = require('../../../scripts/utils')

test.describe('Accessibility Tests with Snapshots for a registered user', async () => {
    let registeredUserCredentials = {}

    test.beforeAll(async () => {
        // Generate credentials once and use throughout tests to avoid creating a new account
        registeredUserCredentials = generateUserCredentials()
    })

    test('Registered shopper happy path flow should not have new accessibility issues', async ({
        page
    }) => {
        await registeredUserHappyPath({
            page,
            registeredUserCredentials,
            a11y: {checkA11y: true, snapShotName: 'registered'}
        })
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
