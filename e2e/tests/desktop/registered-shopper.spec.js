/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {wishlistFlow} from '../../scripts/pageHelpers'

const {test, expect} = require('@playwright/test')
const {
    navigateToPDPDesktopSocial,
    socialLoginShopper,
    registeredUserHappyPath
} = require('../../scripts/pageHelpers')
const {generateUserCredentials} = require('../../scripts/utils.js')
let registeredUserCredentials = {}

test.beforeAll(async () => {
    // Generate credentials once and use throughout tests to avoid creating a new account
    registeredUserCredentials = generateUserCredentials()
})

/**
 * Test that registered shoppers can add a product to cart and go through the entire checkout process,
 * validating that shopper is able to get to the order summary section,
 * and that order shows up in order history
 */
test('Registered shopper can checkout items', async ({page}) => {
    await registeredUserHappyPath({page, registeredUserCredentials})
})

/**
 * Test that registered shoppers can navigate to PDP and add a product to wishlist
 */
test('Registered shopper can add item to wishlist', async ({page}) => {
    await wishlistFlow({page, registeredUserCredentials})
})

/**
 * Test that social login persists a user's shopping cart
 * TODO: Fix flaky test
 * Skipping this test for now because Google login requires 2FA, which Playwright cannot get past.
 */
test.skip('Registered shopper logged in through social retains persisted cart', async ({page}) => {
    navigateToPDPDesktopSocial({
        page,
        productName: 'Floral Ruffle Top',
        productColor: 'Cardinal Red Multi',
        productPrice: '£35.19'
    })

    // Add to Cart
    await expect(page.getByRole('heading', {name: /Floral Ruffle Top/i})).toBeVisible({
        timeout: 15000
    })
    await page.getByRole('radio', {name: 'L', exact: true}).click()

    await page.locator("button[data-testid='quantity-increment']").click()

    // Selected Size and Color texts are broken into multiple elements on the page.
    // So we need to look at the page URL to verify selected variants
    const updatedPageURL = await page.url()
    const params = updatedPageURL.split('?')[1]
    expect(params).toMatch(/size=9LG/i)
    expect(params).toMatch(/color=JJ9DFXX/i)
    await page.getByRole('button', {name: /Add to Cart/i}).click()

    const addedToCartModal = page.getByText(/2 items added to cart/i)

    await addedToCartModal.waitFor()

    await page.getByLabel('Close', {exact: true}).click()

    // Social Login
    await socialLoginShopper({
        page
    })

    // Check Items in Cart
    await page.getByLabel(/My cart/i).click()
    await page.waitForLoadState()
    await expect(page.getByRole('link', {name: /Floral Ruffle Top/i})).toBeVisible()
})

export {registeredUserHappyPath}
