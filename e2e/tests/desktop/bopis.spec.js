/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const {test, expect} = require('@playwright/test')
const config = require('../../config.js')
const {answerConsentTrackingForm, selectStoreFromPLP} = require('../../scripts/pageHelpers.js')

/**
 * Test that selecting a store from the store locator sets the PLP filter
 * This test verifies the store inventory filter functionality on the PLP
 */
test('Selecting store from store locator sets the PLP filter', async ({page}) => {
    await page.goto(config.RETAIL_APP_HOME)
    await answerConsentTrackingForm(page)

    // Select a store from the store locator modal
    await selectStoreFromPLP({page})

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
    await selectStoreFromPLP({page})

    // Go to Men's PLP
    await page.getByRole('link', {name: 'Mens', exact: true}).hover()
    const pantsNav = page.getByRole('link', {name: 'Pants', exact: true})
    await expect(pantsNav).toBeVisible()
    await pantsNav.click()

    // Navigate to PDP
    const productTile = page.getByRole('link', {
        name: /Casual To Dressy Trousers/i
    }).first()
    await productTile.click()

    // Select size and Pickup in Store option
    await expect(page.getByRole('heading', {name: /Casual To Dressy Trousers/i}).first()).toBeVisible()
    await page.getByRole('radio', {name: '30'}).click()
    await page.waitForLoadState()
    
    // Select pickup option immediately after size selection
    const pickupRadio = page.locator('label.chakra-radio:has(input[value="pickup"])')
    await pickupRadio.click()
    await page.waitForLoadState()
    
    // Verify the pickup radio is selected
    await expect(pickupRadio).toHaveAttribute('data-checked')
    
    const addToCartButton = page.getByRole('button', {name: /Add to Cart/i})
    await page.waitForLoadState()

    // Add to Cart
    await addToCartButton.click()
    
    // Navigate to cart
    await expect(page.getByText(/1 item added to cart/i)).toBeVisible()
    await page.getByRole('link', {name: 'View Cart'}).click()
    await expect(page.getByText(/Order Summary/i)).toBeVisible()

    // Proceed to checkout
    const checkoutButton = page.getByRole('link', {name: 'Proceed to Checkout'})
    await expect(checkoutButton).toBeVisible()
    await checkoutButton.click()
    await page.waitForLoadState()

    // Verify the pickup address is displayed
    await page.locator('input[type="email"]').fill('test@test.com')
    await page.getByRole('button', {name: /Checkout as guest/i}).click()

    // Confirm the email input toggles to show edit button on clicking "Checkout as guest"
    const step0Card = page.locator("div[data-testid='sf-toggle-card-step-0']")
    await expect(step0Card.getByRole('button', {name: /Edit/i})).toBeVisible()
})
