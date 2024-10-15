/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {useQuery} from '@tanstack/react-query'
import {useLocation} from 'react-router-dom'

// Localization
import {IntlProvider} from 'react-intl'

// Others
import {getTargetLocale, fetchTranslations} from '../utils/locale'

// Define a type for the HOC props
type WithExtendedApp = React.ComponentPropsWithoutRef<any>

// Define the HOC function
const withExtendedApp = <P extends object>(WrappedComponent: React.ComponentType<P>) => {
    const App: React.FC<P> = (props: WithExtendedApp) => {
        const location = useLocation()
        const DEFAULT_LOCALE = 'en-US'

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
                return [DEFAULT_LOCALE]
            },
            // TODO
            l10nConfig: {
                supportedCurrencies: ['GBP', 'EUR', 'CNY', 'JPY'],
                defaultCurrency: 'GBP',
                supportedLocales: [
                    {
                        id: 'de-DE',
                        preferredCurrency: 'EUR'
                    },
                    {
                        id: 'en-GB',
                        preferredCurrency: 'GBP'
                    },
                    {
                        id: 'es-MX',
                        preferredCurrency: 'MXN'
                    },
                    {
                        id: 'fr-FR',
                        preferredCurrency: 'EUR'
                    },
                    {
                        id: 'it-IT',
                        preferredCurrency: 'EUR'
                    },
                    {
                        id: 'ja-JP',
                        preferredCurrency: 'JPY'
                    },
                    {
                        id: 'ko-KR',
                        preferredCurrency: 'KRW'
                    },
                    {
                        id: 'pt-BR',
                        preferredCurrency: 'BRL'
                    },
                    {
                        id: 'zh-CN',
                        preferredCurrency: 'CNY'
                    },
                    {
                        id: 'zh-TW',
                        preferredCurrency: 'TWD'
                    }
                ],
                defaultLocale: 'en-GB'
            }
        })

        // If the translation file exists, it'll be served directly from static folder (and won't reach this code here).
        // However, if the file is missing, the App would render a 404 page.
        const is404ForMissingTranslationFile =
            /\/static\/translations\/compiled\/[^.]+\.json$/.test(location?.pathname)

        const isServer = typeof window === 'undefined'
        // Fetch the translation message data using the target locale.
        const {data: messages} = useQuery({
            queryKey: ['app', 'translations', 'messages', targetLocale],
            queryFn: () => {
                if (is404ForMissingTranslationFile) {
                    // Return early to prevent an infinite loop
                    // Otherwise, it'll continue to fetch the missing translation file again
                    return {}
                }
                return fetchTranslations(targetLocale)
            },
            enabled: isServer
        })

        return (
            <IntlProvider
                onError={(err) => {
                    if (!messages) {
                        // During the ssr prepass phase the messages object has not loaded, so we can suppress
                        // errors during this time.
                        return
                    }
                    if (err.code === 'MISSING_TRANSLATION') {
                        // NOTE: Remove the console error for missing translations during development,
                        // as we knew translations would be added later.
                        console.warn('Missing translation', {
                            namespace: 'App.IntlProvider',
                            additionalProperties: {
                                errorMessage: err.message
                            }
                        })
                        return
                    }
                    throw err
                }}
                locale={targetLocale}
                messages={messages}
                // For react-intl, the _default locale_ refers to the locale that the inline `defaultMessage`s are written for.
                // NOTE: if you update this value, please also update the following npm scripts in `template-retail-react-app/package.json`:
                // - "extract-default-translations"
                // - "compile-translations:pseudo"
                defaultLocale={DEFAULT_LOCALE}
            >
                <WrappedComponent {...(props as P)} />
            </IntlProvider>
        )
    }

    return App
}

export default withExtendedApp
