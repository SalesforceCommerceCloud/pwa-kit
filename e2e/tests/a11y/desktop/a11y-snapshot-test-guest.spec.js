/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const {test, expect} = require('@playwright/test')
const {generateUserCredentials, runAccessibilityTest} = require('../../../scripts/utils')
const config = require('../../../config')
const {
    answerConsentTrackingForm,
    navigateToPDPDesktop,
    addProductToCart,
    checkoutProduct
} = require('../../../scripts/pageHelpers')

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

        const getProductPromise = page.waitForResponse(
            '**/shopper-products/v1/organizations/**/products/25518241M**',
            {timeout: 10000}
        )

        await getProductPromise
        const getProductRes = await getProductPromise
        expect(getProductRes.status()).toBe(200)
        // ensure that the page is fully loaded before starting a11y scan
        await expect(page.getByRole('heading', {name: /Cotton Turtleneck Sweater/i})).toBeVisible()
        await expect(page.getByText(/From \$39\.99/i).nth(1)).toBeVisible()

        const addToWishlistButton = page.getByRole('button', {name: /Add to Wishlist/i})
        await expect(addToWishlistButton).toBeVisible()
        await expect(addToWishlistButton).toBeEnabled()
        // NOTE: Chakra Skeleton has animation when it is visible in the DOME,
        // sometimes axe can't detect if the transition from skeleton to element is completed or not
        // which cause the a11y scan to detect false positive violations
        // here, we want to ensure skeleton is completely gone before running a11y scan
        await page
            .waitForFunction(
                () => {
                    const skeletons = Array.from(document.querySelectorAll('.chakra-skeleton'))
                    return skeletons.every((skeleton) => {
                        // Check if skeleton has data-loaded attribute (Chakra UI sets this when loaded)
                        const hasDataLoaded = skeleton.hasAttribute('data-loaded')

                        // Check if skeleton animation has stopped
                        const computedStyle = getComputedStyle(skeleton)
                        const hasNoAnimation = computedStyle.animationName === 'none'

                        // Consider it loaded if either condition is met
                        return hasDataLoaded || hasNoAnimation
                    })
                },
                {timeout: 10000}
            )
            .catch(() => {
                console.warn('Skeleton loading wait timed out, proceeding with test')
            })

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
