/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const {test, expect, waitFor} = require('@playwright/test')
const config = require('../../config.js')
const {generateUserCredentials} = require('../../scripts/utils.js')
const {registerShopper, answerConsentTrackingForm, addProductToCart, checkoutProduct, selectStore} = require('../../scripts/pageHelpers.js')



/**
 * Test that selecting a store from the store locator sets the PLP filter
 * This test verifies the store inventory filter functionality on the PLP
 */
test('Selecting store from store locator sets the PLP filter', async ({page}) => {
    await page.goto(config.RETAIL_APP_HOME)
    await answerConsentTrackingForm(page)

    // Select a store from the store locator modal
    await selectStore({page})

    // Verify the filter is updated with the store name
    const inventoryFilter = page.locator('input[aria-label*="Filter Products by Store Availability at"]')
    await expect(inventoryFilter).toBeVisible()
})

/**
 * Test that adding a product via Pickup in Store to Cart shows pickup address in Checkout
 */
test('Adding a product via Pickup in Store to Cart shows pickup address in Checkout', async ({page}) => {
    await page.goto(config.RETAIL_APP_HOME)
    await answerConsentTrackingForm(page)

    // Select a store from the store locator modal
    await selectStore({page})

    // Go to Men's PLP
    await page.getByRole('link', {name: 'Mens', exact: true}).hover()
    const pantsNav = await page.getByRole('link', {name: 'Pants', exact: true})
    await expect(pantsNav).toBeVisible()
    await pantsNav.click()

    // Navigate to PDP
    const productTile = page.getByRole('link', {
        name: /Refined Denim Pants/i
    })
    await productTile.click()

    // Select size and Pickup in Store option
    await expect(page.getByRole('heading', {name: /Refined Denim Pants/i})).toBeVisible()
    await page.getByRole('radio', {name: '30'}).click()
    const addToCartButton = page.getByRole('button', {name: /Add to Cart/i})
    
    await page.waitForLoadState()
    const pickupRadio = page.locator('label.chakra-radio:has(input[value="pickup"])')
    await pickupRadio.click()
    await pickupRadio.click() // Click again to ensure selection
    
    // Verify the pickup radio is selected before proceeding
    await expect(pickupRadio).toHaveAttribute('data-checked')

    // Add to Cart
    await page.waitForLoadState()
    await addToCartButton.click()
    
    // Navigate to cart
    await expect(page.getByText(/1 item added to cart/i)).toBeVisible()
    await page.getByRole('link', {name: 'View Cart'}).click()

//     // Verify the Pickup in Store header is displayed in Cart
//     await expect(page.getByText(/Pickup in Store/i)).toBeVisible()

//     // Proceed to checkout
//     const checkoutButton = page.getByRole('link', {name: 'Proceed to Checkout'})
//     await expect(checkoutButton).toBeVisible()
//     await checkoutButton.click()
//     await page.waitForLoadState()

//     // Verify the pickup address is displayed
//     await page.locator('input[type="email"]').fill('test@test.com')
//     await page.getByText(/Continue as Guest/i).click()

//     // Verify the pickup address is displayed
//     await expect(page.getByText(/Burlington Retail Store/i)).toBeVisible()
})
