/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import PropTypes from 'prop-types'
import {getAssetUrl} from '@salesforce/pwa-kit-react-sdk/ssr/universal/utils'
import {getAppOrigin} from '@salesforce/pwa-kit-react-sdk/utils/url'
import fetch from 'cross-fetch'

/**
 * Dynamically import the translations/messages for a given locale
 * @param {string} locale
 * @returns {Promise<Object>} The messages (compiled in AST format) in the given locale.
 *      If the translation file is not found, return an empty object (so react-intl would fall back to the inline messages)
 */
export const fetchTranslations = async (locale) => {
    const targetLocale =
        typeof window === 'undefined'
            ? process.env.USE_PSEUDOLOCALE === 'true'
                ? 'en-XA'
                : locale
            : locale

    try {
        const file = `${getAppOrigin()}${getAssetUrl(
            `static/translations/compiled/${targetLocale}.json`
        )}`
        const response = await fetch(file)

        if (!response.ok) {
            throw new Error(
                `Failed to fetch ${file}. Received the response: ${response.status} ${response.statusText}`
            )
        }

        return await response.json()
    } catch (err) {
        console.error(err)
        console.log(
            'Translation not found. Loading empty messages, so that react-intl would fall back to the inline default messages'
        )
        return {}
    }
}

/**
 * Determine the target locale by comparing the users' preferred locales with the app's supported locales
 * @param {Object} options
 * @param {function} [options.getUserPreferredLocales] - Identify what set of locales the user prefers
 * @param {object} [options.l10nConfig] - The current site's l10n configuration object
 * @returns {string} The target locale's short code
 */
export const getTargetLocale = ({getUserPreferredLocales, l10nConfig = {}} = {}) => {
    const userPreferredLocales = getUserPreferredLocales ? getUserPreferredLocales() : []
    const supportedLocales = l10nConfig.supportedLocales.map((locale) => locale.id)
    const defaultLocale = l10nConfig.defaultLocale

    const targetLocale = determineTargetLocale(
        userPreferredLocales,
        supportedLocales,
        defaultLocale
    )
    return targetLocale
}

/**
 * Decide which locale to load
 * @private
 * @param {string[]} preferredLocales - All locales that the user prefers
 * @param {string[]} supportedLocales - All locales that your app supports
 * @param {string} fallbackLocale - App's default locale
 * @returns {string} The target locale if there's a match. Otherwise, returns `fallbackLocale`.
 */
export const determineTargetLocale = (preferredLocales, supportedLocales, fallbackLocale) => {
    const targetLocale = preferredLocales.filter((locale) => supportedLocales.includes(locale))[0]
    return targetLocale || fallbackLocale
}

export const MESSAGE_PROPTYPE = PropTypes.shape({
    // NOTE: defaultMessage is typically written as a string
    // but its value can be an array when it comes from the compiled AST version
    defaultMessage: PropTypes.oneOfType([PropTypes.string, PropTypes.array]).isRequired,
    id: PropTypes.string
})
