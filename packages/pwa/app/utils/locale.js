/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import PropTypes from 'prop-types'

/**
 * @returns {string[]} short codes of all the app's supported locales
 */
export const getSupportedLocalesIds = (supportedLocales = []) =>
    supportedLocales.map((locale) => locale.id)

/**
 * Dynamically import the translations/messages for a given locale
 * @private
 * @param {string} locale - The locale code
 * @param {object} defaultLocale
 * @param {object} supportedLocales - supporte locales list
 * @returns {Promise<Object>} The messages (compiled in AST format) in the given locale. If locale is not found, returns the default locale's messages.
 */
export const loadLocaleData = async (locale, defaultLocale, supportedLocales) => {
    // NOTE: the pseudo locale in this case is actually `en-XB` from react-intl. For more details:
    // - see our npm script `compile-translations:pseudo`
    // - and this react-intl PR: https://github.com/formatjs/formatjs/pull/2708
    const locales = [...supportedLocales, 'en-XB']
    let localeToLoad

    if (locales.includes(locale)) {
        localeToLoad = locale
    } else {
        console.warn(
            `Not expecting to see locale '${locale}'. Loading the default locale '${defaultLocale}' instead.`
        )
        localeToLoad = defaultLocale
    }

    let module
    try {
        module = await import(`../translations/compiled/${localeToLoad}.json`)
    } catch (err) {
        console.error(err)
        console.log(`Loading the default locale '${defaultLocale}' instead`)
        module = await import(`../translations/compiled/${defaultLocale}.json`)
    }

    return module.default
}

/**
 * Get all of the locale-related configuration data
 * @param {Object} options
 * @param {function} [options.getUserPreferredLocales] - Identify what set of locales the user prefers
 * @param {object} [options.l10nConfig] - l10n configuration object
 * @returns {Promise<Object>} The configuration data
 */

export const getLocaleConfig = async ({getUserPreferredLocales, l10nConfig = {}} = {}) => {
    const defaultLocale = l10nConfig.defaultLocale
    const preferredLocales = getUserPreferredLocales ? getUserPreferredLocales() : [defaultLocale]

    const supportedLocales = getSupportedLocalesIds(l10nConfig.supportedLocales)

    const targetLocale = whichLocaleToLoad(preferredLocales, supportedLocales, defaultLocale)

    const messages = await loadLocaleData(
        typeof window === 'undefined'
            ? process.env.USE_PSEUDOLOCALE === 'true'
                ? 'en-XB'
                : targetLocale
            : targetLocale,
        defaultLocale,
        supportedLocales
    )

    return {
        app: {
            supportedLocales,
            defaultLocale,
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
 * @private
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
 * Get the preferred currency for a given locale
 * @param locale The locale that we want the currency
 * @param supportedLocales The supported locales array that has preferredCurrency
 * @returns {string} The specific currency for the locale
 */
export const getPreferredCurrency = (locale, supportedLocales) => {
    return supportedLocales.find((supportedLocale) => supportedLocale.id === locale)
        ?.preferredCurrency
}

export const MESSAGE_PROPTYPE = PropTypes.shape({
    // NOTE: defaultMessage is typically written as a string
    // but its value can be an array when it comes from the compiled AST version
    defaultMessage: PropTypes.oneOfType([PropTypes.string, PropTypes.array]).isRequired,
    id: PropTypes.string
})
