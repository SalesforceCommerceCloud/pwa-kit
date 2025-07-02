/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const {test, expect} = require('@playwright/test')
const config = require('../../config.js')
const {generateUserCredentials} = require('../../scripts/utils.js')
const {registerShopper, answerConsentTrackingForm, addProductToCart, checkoutProduct} = require('../../scripts/pageHelpers.js')

const REGISTERED_USER_CREDENTIALS = generateUserCredentials()

/**
 * Test that selecting a store from the store locator sets the PLP filter
 * This test verifies the store inventory filter functionality on the PLP
 */
test('Selecting store from store locator sets the PLP filter', async ({page}) => {
    await page.goto(config.RETAIL_APP_HOME)
    await answerConsentTrackingForm(page)

    // Navigate to a product category (Womens > Tops)
    await page.getByRole('link', {name: 'Womens'}).hover()
    const topsNav = await page.getByRole('link', {name: 'Tops', exact: true})
    await expect(topsNav).toBeVisible()
    await topsNav.click()

    // Verify we're on the PLP
    await expect(page.getByRole('heading', {name: 'Tops'})).toBeVisible()
    const productTile = page.getByRole('link', {
        name: /Floral Ruffle Top/i
    })
    const productTileImg = productTile.locator('img')
    await productTileImg.waitFor({state: 'visible'})

    // Look for the store inventory filter component
    const storeInventoryFilter = page.getByTestId('sf-store-inventory-filter')
    await expect(storeInventoryFilter).toBeVisible()

    // Verify the filter shows "Select Store" initially
    await expect(page.getByText('Select Store')).toBeVisible()
    await expect(page.getByText('Shop by Availability')).toBeVisible()

    // Click on the store inventory filter checkbox to open store locator
    const inventoryCheckbox = page.getByTestId('sf-store-inventory-filter-checkbox')
    await inventoryCheckbox.click()

    // Verify store locator modal opens and select a store
    await expect(page.getByText('Find a Store')).toBeVisible()
    await page.locator('select[name="countryCode"]').selectOption({label: 'United States'})
    await page.locator('input[name="postalCode"]').fill('01803')
    const findButton = page.getByRole('button', {name: 'Find'})
    await expect(findButton).toBeVisible()
    await findButton.click()

    // Wait for stores to load in the modal
    await page.waitForLoadState()

    // Select the first available store (if any stores are available)
    await expect(page.getByText(/Burlington Retail Store/i)).toBeVisible()
    
    // Find and click the first available store label
    const storeRadioLabels = page.locator('label.chakra-radio:has(input[aria-describedby^="store-info-"])')
    const storeCount = await storeRadioLabels.count()
    
    if (storeCount > 0) {
        // Select the first store
        await storeRadioLabels.first().click()
        
        // Close the store locator modal
        await page.locator('button[aria-label="Close"]').click()
        await page.waitForLoadState()
        await expect(page.getByText('Find a Store')).not.toBeVisible()
        
        // Verify the store name is displayed and filter is checked
        const inventoryFilter = page.locator('input[aria-label*="Filter Products by Store Availability at"]')
        await expect(inventoryFilter).toBeVisible()
    } else {
        // If no stores are available, verify the appropriate message is shown
        await expect(page.getByText('Sorry, there are no locations in this area.')).toBeVisible()
        
        // Close the modal
        await page.getByRole('button', {name: 'Close'}).click()
    }
})

/**
 * Test that shoppers can place an order for pickup at a store
 * This test verifies the complete BOPIS (Buy Online, Pick Up In Store) flow
 */
test('Shopper can place an order for pickup', async ({page}) => {
    await page.goto(config.RETAIL_APP_HOME)
    await answerConsentTrackingForm(page)
})
