/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

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

    let module
    try {
        module = await import(`../../../translations/compiled/${targetLocale}.json`)
    } catch (err) {
        console.error(err)
        console.log(
            'Loading empty messages, so that react-intl would fall back to the inline default messages'
        )
        return {}
    }

    return module.default
}
