/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {SUPPORTED_LOCALES, DEFAULT_LOCALE} from '../constants'

/**
 * Dynamically import the translations/messages for a given locale
 * @param {string} locale - The locale code
 * @returns {Promise<Object>} The messages (compiled in AST format) in the given locale. If locale is not found, returns the default locale's messages.
 */
export const loadLocaleData = async (locale) => {
    // NOTE: the pseudo locale in this case is actually `en-XB` from react-intl. For more details:
    // - see our npm script `compile-messages:pseudo`
    // - and this react-intl PR: https://github.com/formatjs/formatjs/pull/2708
    const locales = [...SUPPORTED_LOCALES, 'en-XB']
    let localeToLoad

    if (locales.includes(locale)) {
        localeToLoad = locale
    } else {
        console.warn(
            `Not expecting to see locale '${locale}'. Loading the default locale '${DEFAULT_LOCALE}' instead.`
        )
        localeToLoad = DEFAULT_LOCALE
    }

    let module
    try {
        module = await import(`../translations/compiled/${localeToLoad}.json`)
    } catch (err) {
        console.error(err)
        console.log(`Loading the default locale '${DEFAULT_LOCALE}' instead`)
        module = await import(`../translations/compiled/${DEFAULT_LOCALE}.json`)
    }

    return module.default
}

/**
 * Get all of the locale-related configuration data
 * @param {Object} options
 * @param {function} [options.getUserPreferredLocales] - Identify what set of locales the user prefers
 * @returns {Promise<Object>} The configuration data
 */
export const getLocaleConfig = async ({getUserPreferredLocales} = {}) => {
    const preferredLocales = getUserPreferredLocales ? getUserPreferredLocales() : [DEFAULT_LOCALE]
    const targetLocale = getTargetLocale(preferredLocales, SUPPORTED_LOCALES, DEFAULT_LOCALE)
    const messages = await loadLocaleData(targetLocale)

    return {
        app: {
            supportedLocales: SUPPORTED_LOCALES,
            defaultLocale: DEFAULT_LOCALE,
            targetLocale
        },
        user: {
            preferredLocales
        },
        messages
    }
}

/**
 * Decide which locale to load
 * @param {string[]} preferredLocales - All locales that the user prefers
 * @param {string[]} supportedLocales - All locales that your app supports
 * @param {string} fallbackLocale - App's default locale
 * @returns {string} The target locale if there's a match. Otherwise, returns `fallbackLocale`.
 */
export const whichLocaleToLoad = (preferredLocales, supportedLocales, fallbackLocale) => {
    const targetLocale = preferredLocales.filter((locale) => supportedLocales.includes(locale))[0]

    return targetLocale || fallbackLocale
}

/**
 * Get the target locale
 * @param {string[]} preferredLocales - All locales that the user prefers
 * @param {string[]} supportedLocales - All locales that your app supports
 * @param {string} defaultLocale - App's default locale
 * @returns {string} Either `TARGET_LOCALE` environment variable if it's set OR the calculated target locale
 */
export const getTargetLocale = (preferredLocales, supportedLocales, defaultLocale) => {
    return (
        process.env.TARGET_LOCALE ||
        whichLocaleToLoad(preferredLocales, supportedLocales, defaultLocale)
    )
}
