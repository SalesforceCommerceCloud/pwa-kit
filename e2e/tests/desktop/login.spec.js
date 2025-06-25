/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const {test, expect} = require('@playwright/test')
const config = require('../../config')
const {generateUserCredentials} = require('../../scripts/utils.js')
const {addProductToCart, searchProduct, checkoutProduct} = require('../../scripts/pageHelpers.js')
const {registerShopper, answerConsentTrackingForm} = require('../../scripts/pageHelpers.js')

const GUEST_USER_CREDENTIALS = generateUserCredentials()

/**
 * Test that a user can login with passwordless login. There is no programmatic way to check the email,
 * so we will check that the necessary API call is being made and expected UI is shown
 */
test('Verify passwordless login request', async ({page}) => {
    // Set up API interception to capture the passwordless login request
    let interceptedRequest = null
    
    await page.route('**/mobify/slas/private/shopper/auth/v1/organizations/*/oauth2/passwordless/login', (route) => {
        interceptedRequest = route.request()
        // Continue with the original request
        route.continue()
    })

    await page.goto(config.MORE_LOGIN_OPTIONS_RETAIL_APP_HOME + '/login')
    await answerConsentTrackingForm(page)

    // fill in email
    console.log('config', config)
    await page.fill('input[type="email"]', config.PWA_E2E_USER_EMAIL)

    // click sign in
    await page.getByRole('button', {name: 'Continue Securely'}).click()
    
    // Wait for the API call to be intercepted
    await page.waitForResponse('**/mobify/slas/private/shopper/auth/v1/organizations/*/oauth2/passwordless/login')
    
    // Verify that the request was intercepted
    expect(interceptedRequest).toBeTruthy()
    
    // Verify the request method
    expect(interceptedRequest.method()).toBe('POST')
    
    // Get and verify the payload
    const postData = interceptedRequest.postData()
    expect(postData).toBeTruthy()
    
    // Parse the URL-encoded payload and verify individual parameters (excluding usid)
    const params = new URLSearchParams(postData)
    
    // Verify specific parameters (excluding usid which is dynamic)
    expect(params.get('user_id')).toBe(config.PWA_E2E_USER_EMAIL)
    expect(params.get('mode')).toBe('callback')
    expect(params.get('channel_id')).toBe('RefArch')
    expect(params.get('callback_uri')).toMatch(/.*\/passwordless-login-callback$/)
})

test('Verify password reset callback request', async ({page}) => {
    // Set up API interception to capture the passwordless login request
    let interceptedRequest = null

    await page.route('**/mobify/slas/private/shopper/auth/v1/organizations/*/oauth2/password/reset', (route) => {
        interceptedRequest = route.request()
        // Continue with the original request
        route.continue()
    })

    await page.goto(config.MORE_LOGIN_OPTIONS_RETAIL_APP_HOME + '/login')
    await answerConsentTrackingForm(page)

    // fill in email
    console.log('config', config)
    await page.fill('input[type="email"]', config.PWA_E2E_USER_EMAIL)

    // click sign in
    await page.getByRole('button', {name: 'Password'}).click()
    await page.getByRole('button', {name: 'Forgot password?'}).click()

    await page.fill('input[type="email"]', config.PWA_E2E_USER_EMAIL)
    await page.getByRole('button', {name: 'Reset Password'}).click()
    
    // Wait for the API call to be intercepted
    await page.waitForResponse('**/mobify/slas/private/shopper/auth/v1/organizations/*/oauth2/password/reset')
    
    // Verify that the request was intercepted
    expect(interceptedRequest).toBeTruthy()
    
    // Verify the request method
    expect(interceptedRequest.method()).toBe('POST')
    
    // Get and verify the payload
    const postData = interceptedRequest.postData()
    expect(postData).toBeTruthy()
    
    // Parse the URL-encoded payload and verify individual parameters (excluding usid)
    const params = new URLSearchParams(postData)
    
    // Verify specific parameters (excluding usid which is dynamic)
    expect(params.get('user_id')).toBe(config.PWA_E2E_USER_EMAIL)
    expect(params.get('mode')).toBe('callback')
    expect(params.get('channel_id')).toBe('RefArch')
    expect(params.get('callback_uri')).toMatch(/.*\/reset-password-callback$/)
    expect(params.get('hint')).toBe('cross_device')
})

test('Verify password reset request', async ({page}) => {
    // Set up API interception to capture the passwordless login request
    let interceptedRequest = null
    await page.route('**/mobify/slas/private/shopper/auth/v1/organizations/*/oauth2/password/action', (route) => {
        interceptedRequest = route.request()
        // Continue with the original request
        route.continue()
    })

    await page.goto(config.MORE_LOGIN_OPTIONS_RETAIL_APP_HOME + `/reset-password-landing?token=1234567&email=${GUEST_USER_CREDENTIALS.email}`)
    await answerConsentTrackingForm(page)

    // Fill in the new password field
    await page.fill('#password', GUEST_USER_CREDENTIALS.password)
    // Alternative selectors:
    // await page.fill('input[autocomplete="new-password"]', newPassword)
    // await page.getByLabel('New Password').fill(newPassword)
    
    // Fill in the confirm password field
    await page.fill('#confirmPassword', GUEST_USER_CREDENTIALS.password)
    // Alternative selectors:
    // await page.fill('input[id="confirmPassword"]', newPassword)
    // await page.getByLabel('Confirm New Password').fill(newPassword)
    
    // Verify the password fields are filled
    expect(await page.inputValue('#password')).toBe(GUEST_USER_CREDENTIALS.password)
    expect(await page.inputValue('#confirmPassword')).toBe(GUEST_USER_CREDENTIALS.password)
    await page.getByRole('button', {name: 'Reset Password'}).click()

    await page.waitForResponse('**/mobify/slas/private/shopper/auth/v1/organizations/*/oauth2/password/action')

    // Verify that the request was intercepted
    expect(interceptedRequest).toBeTruthy()
})
