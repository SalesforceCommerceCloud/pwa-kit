/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import logger from '../../utils/logger-instance'

// Matches the same regex used client-side in commerce-sdk-react CookieStorage so
// support tickets surface the same warning text on both sides.
export const INVALID_COOKIE_DOMAIN_PATTERN = /[*,;=\s]/

/**
 * Reads `commerceAPI.cookieDomain` from the runtime options. Returns the value
 * when present and well-formed, or `undefined` (with a warning) when it
 * contains characters the browser will reject. Mirrors the validation in
 * commerce-sdk-react/src/auth/storage/cookie.ts.
 */
export function getValidatedCookieDomain(options) {
    const cookieDomain = options?.mobify?.app?.commerceAPI?.cookieDomain
    if (!cookieDomain) return undefined
    if (INVALID_COOKIE_DOMAIN_PATTERN.test(cookieDomain)) {
        logger.warn(
            `Invalid cookieDomain "${cookieDomain}". ` +
                'Cookie domains must not contain wildcards or special characters. ' +
                'Example: ".example.com"'
        )
        return undefined
    }
    return cookieDomain
}
