/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * LocalStorage key used to temporarily disable Turnstile from the browser console.
 * When set to a truthy value, the app will not load the Turnstile widget or send turnstileResponse.
 *
 * From the browser console:
 *   // Disable Turnstile (then refresh the page)
 *   localStorage.setItem('pwaKitDisableTurnstile', '1')
 *
 *   // Re-enable Turnstile (then refresh the page)
 *   localStorage.removeItem('pwaKitDisableTurnstile')
 *
 * Note: If the server has TURNSTILE_SECRET_KEY set, disabling Turnstile on the client means
 * no token is sent and the server will respond 403 (Turnstile token required). Unset
 * TURNSTILE_SECRET_KEY on the server for testing without Turnstile.
 */
export const TURNSTILE_DISABLE_STORAGE_KEY = 'pwaKitDisableTurnstile'

/**
 * Returns true if Turnstile is disabled via localStorage (for testing/debugging).
 * Safe to call in SSR (returns false when window is undefined).
 */
export function isTurnstileDisabled() {
    return (
        typeof window !== 'undefined' &&
        !!window.localStorage.getItem(TURNSTILE_DISABLE_STORAGE_KEY)
    )
}
