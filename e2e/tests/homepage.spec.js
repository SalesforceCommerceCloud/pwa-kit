/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const {test, expect} = require('@playwright/test')
const config = require('../config')
const {answerConsentTrackingForm} = require('../scripts/pageHelpers.js')

test.describe('Retail app home page loads', () => {
    test.beforeEach(async ({page}) => {
        await page.goto(config.RETAIL_APP_HOME)
        await answerConsentTrackingForm(page)
    })

    test('has title', async ({page}) => {
        await expect(page).toHaveTitle(/Home Page/)
    })

    test('get started link', async ({page}) => {
        const getStartedLink = page.getByRole('link', {name: 'Get started'})
        await expect(getStartedLink).toBeVisible()

        const popupPromise = page.waitForEvent('popup', { timeout: 30000 })
        await getStartedLink.click()

        const getStartedPage = await popupPromise
        await expect(getStartedPage).toHaveURL(/.*getting-started/, { timeout: 15000 })

        await expect(getStartedPage.getByRole('heading').first()).toBeVisible({ timeout: 10000 })
    })
})
