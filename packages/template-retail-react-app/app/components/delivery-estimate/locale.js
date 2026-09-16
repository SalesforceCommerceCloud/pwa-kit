/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const normalizeLocaleRegion = (value) =>
    typeof value === 'string' && /^[A-Za-z]{2}$/.test(value) ? value.toUpperCase() : undefined

export const getCountryCodeFromLocale = (locale) => {
    if (typeof locale !== 'string') return undefined

    const normalizedLocale = locale.trim()
    if (!normalizedLocale) return undefined

    try {
        if (typeof Intl !== 'undefined' && Intl.Locale) {
            return normalizeLocaleRegion(new Intl.Locale(normalizedLocale).region)
        }
    } catch {
        // Use the BCP-47 region subtag when Intl.Locale is unavailable in older browsers.
    }

    const region = normalizedLocale.match(
        /^[A-Za-z]{2,8}(?:-[A-Za-z]{4})?-([A-Za-z]{2}|\d{3})(?:-|$)/
    )?.[1]
    return normalizeLocaleRegion(region)
}
