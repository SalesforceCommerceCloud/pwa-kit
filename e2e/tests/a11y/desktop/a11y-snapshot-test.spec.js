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
    navigateToPDPDesktop,
    addProductToCart,
    checkoutProduct,
    registeredUserHappyPath,
    wishlistFlow,
    loginShopper,
    registerShopper
} = require('../../../scripts/pageHelpers')
const {generateUserCredentials, runAccessibilityTest} = require('../../../scripts/utils')

test.describe('Accessibility Tests with Snapshots for guest user', () => {
    const GUEST_USER_CREDENTIALS = generateUserCredentials()

    test('Homepage should not have new accessibility issues', async ({page}) => {
        // Go to the homepage
        await page.goto(config.RETAIL_APP_HOME)

        // Handle the consent tracking form using the existing helper
        await answerConsentTrackingForm(page)

        // wait until product tiles are fully load before analyzing
        await expect(page.getByRole('link', {name: /Denim slim skirt/i})).toBeVisible()

        // Run the a11y test
        await runAccessibilityTest(page, ['guest', 'homepage-a11y-violations.json'])
    })

    test('Product Listing Page should not have new accessibility issues', async ({page}) => {
        await page.goto(config.RETAIL_APP_HOME)
        await answerConsentTrackingForm(page)

        await page.getByRole('link', {name: 'Womens'}).hover()
        const topsNav = await page.getByRole('link', {name: 'Tops', exact: true})
        await expect(topsNav).toBeVisible()

        await topsNav.click()
        const productTile = page.getByRole('link', {
            name: /Cotton Turtleneck Sweater/i
        })
        await expect(productTile.getByText(/From \$39\.99/i)).toBeVisible()

        // Run the a11y test
        await runAccessibilityTest(page, ['guest', 'plp-a11y-violations.json'])
    })

    test('Product Detail Page should not have new accessibility issues', async ({page}) => {
        await navigateToPDPDesktop({page})

        await page.waitForLoadState()

        // Run the a11y test
        await runAccessibilityTest(page, ['guest', 'pdp-a11y-violations.json'])
    })

    test('Cart should not have new accessibility issues', async ({page}) => {
        await addProductToCart({page})

        // cart
        await page.getByLabel(/My cart/i).click()
        await page.waitForLoadState()

        // make sure the cart is fully load
        await expect(page.getByRole('link', {name: /Cotton Turtleneck Sweater/i})).toBeVisible()

        // Run the a11y test
        await runAccessibilityTest(page, ['guest', 'cart-a11y-violations.json'])
    })

    test('Checkout should not have new accessibility issues', async ({page}) => {
        await addProductToCart({page})

        // cart
        await page.getByLabel(/My cart/i).click()
        await page.waitForLoadState()

        // make sure the cart is fully load
        await expect(page.getByRole('link', {name: /Cotton Turtleneck Sweater/i})).toBeVisible()

        await checkoutProduct({
            page,
            userCredentials: GUEST_USER_CREDENTIALS,
            a11y: {checkA11y: true, snapShotName: 'guest'}
        })
    })
})

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
        // The consent form does not stick after registration
        await answerConsentTrackingForm(page)
        await page.waitForLoadState()

        await expect(page.getByRole('heading', {name: /Account Details/i})).toBeVisible({
            timeout: 20000
        })
        await runAccessibilityTest(page, ['registered', 'account-details-a11y-violations.json'])

        await page.getByRole('link', {name: 'Addresses'}).click()

        await runAccessibilityTest(page, ['registered', 'account-addresses-a11y-violations.json'])
    })
})
