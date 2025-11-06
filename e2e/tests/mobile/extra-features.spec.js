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

    await page.getByRole('button', {name: 'Continue Securely'}).scrollIntoViewIfNeeded()
    await page.getByRole('button', {name: 'Continue Securely'}).click()

    await page.waitForResponse(
        '**/mobify/slas/private/shopper/auth/v1/organizations/*/oauth2/passwordless/login'
    )

    expect(interceptedRequest).toBeTruthy()
    expect(interceptedRequest.method()).toBe('POST')

    const postData = interceptedRequest.postData()
    expect(postData).toBeTruthy()

    const params = new URLSearchParams(postData)

    expect(params.get('user_id')).toBe(config.PWA_E2E_USER_EMAIL)
    expect(params.get('mode')).toBe('callback')
    expect(params.get('channel_id')).toBe(config.EXTRA_FEATURES_E2E_RETAIL_APP_HOME_SITE)
    expect(params.get('callback_uri')).toMatch(/.*\/passwordless-login-callback$/)
})

test('Verify password reset callback request on mobile (extra features enabled)', async ({
    page
}) => {
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
    expect(params.get('mode')).toBe('callback')
    expect(params.get('channel_id')).toBe(config.EXTRA_FEATURES_E2E_RETAIL_APP_HOME_SITE)
    expect(params.get('callback_uri')).toMatch(/.*\/reset-password-callback$/)
    expect(params.get('hint')).toBe('cross_device')
})

test('Verify password reset callback request on mobile when extra login features are not enabled', async ({
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
    expect(params.get('mode')).toBe('callback')
    expect(params.get('channel_id')).toBe(config.RETAIL_APP_HOME_SITE)
    expect(params.get('callback_uri')).toMatch(/.*\/reset-password-callback$/)
    expect(params.get('hint')).toBe('cross_device')
})

test('Verify password reset request on mobile', async ({page}) => {
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
