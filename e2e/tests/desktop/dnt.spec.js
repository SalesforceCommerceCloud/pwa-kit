/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const {test, expect} = require('@playwright/test')
const config = require('../../config.js')
const {generateUserCredentials} = require('../../scripts/utils.js')
const {registerShopper} = require('../../scripts/pageHelpers.js')

const REGISTERED_USER_CREDENTIALS = generateUserCredentials()

const checkDntCookie = async (page, expectedValue) => {
    var cookies = await page.context().cookies()
    var cookieName = 'dw_dnt'
    var cookie = cookies.find((cookie) => cookie.name === cookieName)
    expect(cookie).toBeTruthy()
    expect(cookie.value).toBe(expectedValue)
}

test('Shopper can use the consent tracking form', async ({page}) => {
    await page.context().clearCookies()

    await page.goto(config.RETAIL_APP_HOME)

    const modalSelector = '[aria-label="Close consent tracking form"]'
    page.locator(modalSelector).waitFor()
    await expect(page.getByText(/Tracking Consent/i)).toBeVisible({timeout: 10000})

    // Decline Tracking
    const declineButton = page.locator('button:visible', {hasText: 'Decline'})
    await expect(declineButton).toBeVisible()
    await declineButton.click()
    await page.waitForTimeout(5000)

    // Intercept einstein request
    let apiCallsMade = false
    await page.route(
        'https://api.cquotient.com/v3/activities/aaij-MobileFirst/viewCategory',
        (route) => {
            apiCallsMade = true
            route.continue()
        }
    )

    await checkDntCookie(page, '1')

    // Trigger einstein events
    await page.click('text=Womens')
    // Reloading the page after setting DNT makes the form not appear again
    await page.reload()
    await expect(page.getByText(/Tracking Consent/i)).toBeHidden()

    // Registering after setting DNT persists the preference
    await registerShopper({page, userCredentials: REGISTERED_USER_CREDENTIALS})
    await checkDntCookie(page, '1')

    // Logging out clears the preference
    const buttons = await page.getByText(/Log Out/i).elementHandles()
    for (const button of buttons) {
        if (await button.isVisible()) {
            await button.click()
            break
        }
    }
    var cookies = await page.context().cookies()
    if (cookies.some((item) => item.name === 'dw_dnt')) {
        throw new Error('dw_dnt still exists in the cookies')
    }
    await page.reload()
    await expect(page.getByText(/Tracking Consent/i)).toBeVisible({timeout: 10000})
    expect(apiCallsMade).toBe(false)
})
