/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const {test, expect} = require('@playwright/test')
const config = require('../../config.js')
const {generateUserCredentials} = require('../../scripts/utils.js')
const {answerConsentTrackingForm} = require('../../scripts/pageHelpers.js')

const GUEST_USER_CREDENTIALS = generateUserCredentials()

/**
 * Test that a user can login with passwordless login on mobile. There is no programmatic way to check the email,
 * so we will check that the necessary API call is being made and expected UI is shown
 */
test('Verify passwordless login request on mobile', async ({page}) => {
    let interceptedRequest = null

    await page.route(
        '**/mobify/slas/private/shopper/auth/v1/organizations/*/oauth2/passwordless/login',
        (route) => {
            interceptedRequest = route.request()
            route.continue()
        }
    )

    await page.goto(config.EXTRA_FEATURES_E2E_RETAIL_APP_HOME + '/login')
    await answerConsentTrackingForm(page)

    await page.locator('#email').scrollIntoViewIfNeeded()
    await page.fill('#email', config.PWA_E2E_USER_EMAIL)

    await page.getByRole('button', {name: 'Continue'}).scrollIntoViewIfNeeded()
    await page.getByRole('button', {name: 'Continue'}).click()

    await page.waitForResponse(
        '**/mobify/slas/private/shopper/auth/v1/organizations/*/oauth2/passwordless/login'
    )

    // Verify the passwordless login request
    expect(interceptedRequest).toBeTruthy()
    expect(interceptedRequest.method()).toBe('POST')

    let postData = interceptedRequest.postData()
    expect(postData).toBeTruthy()

    let params = new URLSearchParams(postData)

    expect(params.get('user_id')).toBe(config.PWA_E2E_USER_EMAIL)
    expect(params.get('mode')).toBe('email')
    expect(params.get('channel_id')).toBe(config.EXTRA_FEATURES_E2E_RETAIL_APP_HOME_SITE)

    await page.route(
        '**/mobify/slas/private/shopper/auth/v1/organizations/*/oauth2/passwordless/token',
        (route) => {
            interceptedRequest = route.request()
            route.continue()
        }
    )

    // Wait for OTP input fields to appear and fill the 8-digit code
    const otpCode = '12345678' // Replace with actual OTP code
    const otpInputs = page.locator('input[inputmode="numeric"][maxlength="1"]')
    await otpInputs.first().waitFor()

    // Fill each input field with one digit
    for (let i = 0; i < 8; i++) {
        await otpInputs.nth(i).fill(otpCode[i])
    }

    await page.waitForResponse(
        '**/mobify/slas/private/shopper/auth/v1/organizations/*/oauth2/passwordless/token'
    )

    // Verify the passwordless login token request
    expect(interceptedRequest).toBeTruthy()
    expect(interceptedRequest.method()).toBe('POST')
    postData = interceptedRequest.postData()
    expect(postData).toBeTruthy()
    params = new URLSearchParams(postData)
    expect(params.get('pwdless_login_token')).toBe(otpCode)
    expect(params.get('hint')).toBe('pwdless_login')
})

test('Verify password reset request on mobile (extra features enabled)', async ({page}) => {
    let interceptedRequest = null

    await page.route(
        '**/mobify/slas/private/shopper/auth/v1/organizations/*/oauth2/password/reset',
        (route) => {
            interceptedRequest = route.request()
            route.continue()
        }
    )

    await page.goto(config.EXTRA_FEATURES_E2E_RETAIL_APP_HOME + '/login')
    await answerConsentTrackingForm(page)

    await page.locator('#email').scrollIntoViewIfNeeded()
    await page.fill('#email', config.PWA_E2E_USER_EMAIL)

    await page.getByRole('button', {name: 'Password'}).click()
    await page.getByRole('button', {name: 'Forgot password?'}).click()

    await page.fill('#email', config.PWA_E2E_USER_EMAIL)
    await page.getByRole('button', {name: /reset password/i}).click()

    await page.waitForResponse(
        '**/mobify/slas/private/shopper/auth/v1/organizations/*/oauth2/password/reset'
    )

    expect(interceptedRequest).toBeTruthy()
    expect(interceptedRequest.method()).toBe('POST')

    const postData = interceptedRequest.postData()
    expect(postData).toBeTruthy()

    const params = new URLSearchParams(postData)

    expect(params.get('user_id')).toBe(config.PWA_E2E_USER_EMAIL)
    expect(params.get('mode')).toBe('email')
    expect(params.get('channel_id')).toBe(config.EXTRA_FEATURES_E2E_RETAIL_APP_HOME_SITE)
    expect(params.get('hint')).toBe('cross_device')
})

test('Verify password reset request on mobile when extra login features are not enabled', async ({
    page
}) => {
    let interceptedRequest = null

    await page.route(
        '**/mobify/proxy/api/shopper/auth/v1/organizations/*/oauth2/password/reset',
        (route) => {
            interceptedRequest = route.request()
            route.continue()
        }
    )

    await page.goto(config.RETAIL_APP_HOME + '/login')
    await answerConsentTrackingForm(page)

    await page.locator('#email').scrollIntoViewIfNeeded()
    await page.fill('#email', config.PWA_E2E_USER_EMAIL)

    await page.getByRole('button', {name: 'Forgot password?'}).click()

    await page.waitForSelector('form[data-testid="sf-auth-modal-form"] >> text=Reset Password')
    await page.fill('form[data-testid="sf-auth-modal-form"] #email', config.PWA_E2E_USER_EMAIL)
    await page.getByRole('button', {name: /reset password/i}).click()

    await page.waitForResponse(
        '**/mobify/proxy/api/shopper/auth/v1/organizations/*/oauth2/password/reset'
    )

    expect(interceptedRequest).toBeTruthy()
    expect(interceptedRequest.method()).toBe('POST')

    const postData = interceptedRequest.postData()
    expect(postData).toBeTruthy()

    const params = new URLSearchParams(postData)

    expect(params.get('user_id')).toBe(config.PWA_E2E_USER_EMAIL)
    expect(params.get('mode')).toBe('email')
    expect(params.get('channel_id')).toBe(config.RETAIL_APP_HOME_SITE)
    expect(params.get('hint')).toBe('cross_device')
})

test('Verify password reset action request on mobile', async ({page}) => {
    let interceptedRequest = null
    await page.route(
        '**/mobify/slas/private/shopper/auth/v1/organizations/*/oauth2/password/action',
        (route) => {
            interceptedRequest = route.request()
            route.continue()
        }
    )

    await page.goto(
        config.EXTRA_FEATURES_E2E_RETAIL_APP_HOME +
            `/reset-password-landing?token=1234567&email=${GUEST_USER_CREDENTIALS.email}`
    )
    await answerConsentTrackingForm(page)

    await page.locator('#password').scrollIntoViewIfNeeded()
    await page.fill('#password', GUEST_USER_CREDENTIALS.password)

    await page.locator('#confirmPassword').scrollIntoViewIfNeeded()
    await page.fill('#confirmPassword', GUEST_USER_CREDENTIALS.password)

    expect(await page.inputValue('#password')).toBe(GUEST_USER_CREDENTIALS.password)
    expect(await page.inputValue('#confirmPassword')).toBe(GUEST_USER_CREDENTIALS.password)

    await page.getByRole('button', {name: 'Reset Password'}).scrollIntoViewIfNeeded()
    await page.getByRole('button', {name: 'Reset Password'}).click()

    await page.waitForResponse(
        '**/mobify/slas/private/shopper/auth/v1/organizations/*/oauth2/password/action'
    )

    expect(interceptedRequest).toBeTruthy()
})
