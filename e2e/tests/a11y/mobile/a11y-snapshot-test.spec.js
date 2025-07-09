/*
 * Copyright (c) 2023, Salesforce, Inc.
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

// NOTE: we do not want to run every test from Desktop again, only check some pages that has separated mobile versions
test.describe('Accessibility Tests with Snapshots for guest user', () => {
    test('Product Listing Page should not have new accessibility issues', async ({page}) => {
        await page.goto(config.RETAIL_APP_HOME)
        await answerConsentTrackingForm(page)

        await page.getByLabel('Menu', {exact: true}).click()

        // SSR nav loads top level categories as direct links so we wait till all sub-categories load in the accordion
        const categoryAccordion = page.locator(
            "#category-nav .chakra-accordion__button svg+:text('Womens')"
        )
        await categoryAccordion.waitFor()

        await page.getByRole('button', {name: 'Womens'}).click()

        const clothingNav = page.getByRole('button', {name: 'Clothing'})

        await clothingNav.waitFor()

        await clothingNav.click()

        const topsLink = page.getByLabel('Womens').getByRole('link', {name: 'Tops'})
        await topsLink.click()
        // Wait for the nav menu to close first
        await topsLink.waitFor({state: 'hidden'})

        await expect(page.getByRole('heading', {name: 'Tops'})).toBeVisible()

        // PLP
        const productTile = page.getByRole('link', {
            name: /Cotton Turtleneck Sweater/i
        })
        await expect(productTile.getByText(/From \$39\.99/i)).toBeVisible()

        // open the filter which has mobile version
        page.getByRole('button', {name: 'Filter'}).click()

        // Run the a11y test when filter is open on mobile view
        await runAccessibilityTest(page, ['guest', 'plp-a11y-violations.json'])
    })
})

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
