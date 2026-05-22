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

// Tracks cookieDomain values we've already warned about so a misconfigured
// merchant doesn't get a per-request warning. The set persists for the
// process lifetime; serverless cold starts reset it naturally.
const warnedDomains = new Set()

/**
 * Test-only: clears the warned-domains memo so a test that asserts
 * `logger.warn` was called can rely on the warning firing on each run.
 * Not exported via package index — intended for jest only.
 */
export function _resetWarnedDomainsForTesting() {
    warnedDomains.clear()
}

/**
 * Reads `commerceAPI.cookieDomain` from the runtime options. Returns the value
 * when present and well-formed, or `undefined` (with a warning) when it
 * contains characters the browser will reject. The warning is emitted at
 * most once per distinct invalid value to avoid per-request log spam in
 * code paths (e.g. preview-context middleware) that run on every request.
 * Mirrors the validation in commerce-sdk-react/src/auth/storage/cookie.ts.
 */
export function getValidatedCookieDomain(options) {
    const cookieDomain = options?.mobify?.app?.commerceAPI?.cookieDomain
    if (!cookieDomain) return undefined
    if (INVALID_COOKIE_DOMAIN_PATTERN.test(cookieDomain)) {
        if (!warnedDomains.has(cookieDomain)) {
            warnedDomains.add(cookieDomain)
            logger.warn(
                `Invalid cookieDomain "${cookieDomain}". ` +
                    'Cookie domains must not contain wildcards or special characters. ' +
                    'Example: ".example.com"'
            )
        }
        return undefined
    }
    return cookieDomain
}
