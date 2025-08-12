/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useLocation} from 'react-router-dom'
import {useQuery} from '@tanstack/react-query'
import {useAppOrigin} from '../../../hooks/use-app-origin'
import {useMultiSite} from '../../../hooks/use-multi-site'
import {getTargetLocale, fetchTranslations} from '../../../utils/locale'
import {isServer} from '../../../utils/utils'
import {useAppConfig} from './use-app-config'

/**
 * Custom hook for managing internationalization and translations
 * Handles locale determination, translation fetching, and multi-site configuration
 *
 * @returns {Object} Localization data including messages, locale, and site info
 */
export const useAppLocalization = () => {
    const {appConfig} = useAppConfig()
    const appOrigin = useAppOrigin()
    const location = useLocation()
    const {site, locale, buildUrl} = useMultiSite()

    const targetLocale = getTargetLocale({
        getUserPreferredLocales: () => {
            // CONFIG: This function should return an array of preferred locales. They can be
            // derived from various sources. Below are some examples of those:
            //
            // - client side: window.navigator.languages
            // - the page URL they're on (example.com/en-GB/home)
            // - cookie (if their previous preference is saved there)
            //
            // If this function returns an empty array (e.g. there isn't locale in the page url),
            // then the app would use the default locale as the fallback.

            // NOTE: Your implementation may differ, this is just what we did.
            return [locale?.id || appConfig.defaultAppLocale]
        },
        l10nConfig: site.l10n
    })

    // If the translation file exists, it'll be served directly from static folder (and won't reach this code here).
    // However, if the file is missing, the App would render a 404 page.
    const is404ForMissingTranslationFile = /\/static\/translations\/compiled\/[^.]+\.json$/.test(
        location?.pathname
    )

    // Fetch the translation message data using the target locale.
    const {data: messages} = useQuery({
        queryKey: ['static', 'translations', 'messages', targetLocale],
        queryFn: () => {
            if (is404ForMissingTranslationFile) {
                // Return early to prevent an infinite loop
                // Otherwise, it'll continue to fetch the missing translation file again
                return {}
            }
            return fetchTranslations(targetLocale, appOrigin)
        },
        enabled: isServer
    })

    const {l10n} = site
    // Get the current currency to be used through out the app
    const currency = locale.preferredCurrency || l10n.defaultCurrency

    return {
        targetLocale,
        messages,
        site,
        locale,
        buildUrl,
        currency,
        appOrigin
    }
}
