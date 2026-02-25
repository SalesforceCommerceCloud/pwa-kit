/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * LocalStorage key used to temporarily disable captcha (Turnstile or reCAPTCHA) from the browser console.
 * When set to a truthy value, the app will not load the captcha widget or send the token.
 *
 * From the browser console:
 *   // Disable captcha (then refresh the page)
 *   localStorage.setItem('pwaKitDisableTurnstile', '1')
 *
 *   // Re-enable captcha (then refresh the page)
 *   localStorage.removeItem('pwaKitDisableTurnstile')
 *
 * Note: If the server has TURNSTILE_SECRET_KEY or RECAPTCHA_SECRET_KEY set, disabling on the client
 * means no token is sent and the server will respond 403. Unset the secret on the server for testing.
 */
export const TURNSTILE_DISABLE_STORAGE_KEY = 'pwaKitDisableTurnstile'

/**
 * Returns true if captcha (Turnstile or reCAPTCHA) is disabled via localStorage (for testing/debugging).
 * Safe to call in SSR (returns false when window is undefined).
 */
export function isTurnstileDisabled() {
    return (
        typeof window !== 'undefined' &&
        !!window.localStorage.getItem(TURNSTILE_DISABLE_STORAGE_KEY)
    )
}
