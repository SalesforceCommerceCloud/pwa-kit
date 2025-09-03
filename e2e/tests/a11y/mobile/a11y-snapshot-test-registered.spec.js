/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const {test, expect} = require('@playwright/test')
const config = require('../../../config')
const {
    answerConsentTrackingForm,
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
        // Sometimes the consent form does not stick after registration, run it once more here
        await page.waitForLoadState()
        await answerConsentTrackingForm(page)

        await expect(page.getByRole('heading', {name: /Account Details/i})).toBeVisible()

        // There are two buttons in a page, click the one on mobile to expand the menu
        page.getByRole('button', {name: 'My Account'}).nth(1).click()
        await expect(page.getByTestId('account-nav').getByText(/Log Out/i)).toBeVisible()

        await runAccessibilityTest(page, ['registered', 'account-details-a11y-violations.json'])
    })
})
