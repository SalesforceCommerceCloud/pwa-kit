/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// TODO: Might want to make this a dynamic import, but at the least we'll error out if there,
// is no configuration found.
import pwakitConfig from 'pwa-kit-config'
import {defineMessages} from 'react-intl'

const SUPPORTED_LOCALES = pwakitConfig.l10n.supportedLocales
const DEFAULT_LOCALE = pwakitConfig.l10n.defaultLocale

/**
 *  Default messages for the supported locales.
 *  NOTE: Because the messages are statically analyzed, we have to maintain the list of locales asynchronously
 *  to those in the package.json.
 *  `locale` parameter format for OCAPI and Commerce API: <language code>-<country code>
 *  https://documentation.b2c.commercecloud.salesforce.com/DOC1/topic/com.demandware.dochelp/OCAPI/current/usage/Localization.html
 *  */
// TODO: There is probably a better place for this is it belongs in the SDK at all. Think about it more.
export const defaultLocaleMessages = defineMessages({
    'en-GB': {defaultMessage: 'English (United Kingdom)'},
    'fr-FR': {defaultMessage: 'French (France)'},
    'it-IT': {defaultMessage: 'Italian (Italy)'},
    'zh-CN': {defaultMessage: 'Chinese (China)'},
    'ja-JP': {defaultMessage: 'Japanese (Japan)'}
})

export const supportedLocales = SUPPORTED_LOCALES

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
        // TODO: This import doesn't work. It also causes a warning in webpack.
        // This is probably a result of use compiling the sdk with webpack and it not being
        // in the context of the pwa.
        module = await import(`./app/translations/compiled/${localeToLoad}.json`)
    } catch (err) {
        console.error(err)
        console.log(`Loading the default locale '${DEFAULT_LOCALE}' instead`)
        module = await import(`./app/translations/compiled/${DEFAULT_LOCALE}.json`)
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
    // const messages = await loadLocaleData(targetLocale)

    // TODO: Lets revisit this object structure.
    return {
        app: {
            supportedLocales: SUPPORTED_LOCALES,
            defaultLocale: DEFAULT_LOCALE,
            targetLocale
        },
        user: {
            preferredLocales
        }
        // ,
        // messages
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
    // TODO: Rework `process.env.TARGET_LOCALE` into this logic.
    return whichLocaleToLoad(preferredLocales, supportedLocales, defaultLocale)
}
