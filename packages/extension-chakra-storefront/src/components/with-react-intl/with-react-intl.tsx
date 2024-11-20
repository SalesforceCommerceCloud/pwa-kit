/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {IntlProvider} from 'react-intl'
import {useQuery} from '@tanstack/react-query'
import {useLocation} from 'react-router-dom'

// CONSTANTS
import {DEFAULT_LOCALE} from '../../constants'

// Local Imports
import {getTargetLocale, fetchTranslations} from '../../utils/locale'
import {isServer} from '../../utils/utils'
import logger from '../../utils/logger-instance'
import useMultiSite from '../../hooks/use-multi-site'

// Define a type for the HOC props
type WithReactIntlProps = React.ComponentPropsWithoutRef<any>

// Define the HOC function
const withReactIntl = <P extends object>(WrappedComponent: React.ComponentType<P>) => {
    const WithReactIntl: React.FC<P> = (props: WithReactIntlProps) => {
        const {site, locale} = useMultiSite()
        const location = useLocation()

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
                return [locale?.id || DEFAULT_LOCALE]
            },
            l10nConfig: site.l10n
        })

        // If the translation file exists, it'll be served directly from static folder (and won't reach this code here).
        // However, if the file is missing, the App would render a 404 page.
        const is404ForMissingTranslationFile =
            /\/static\/translations\/compiled\/[^.]+\.json$/.test(location?.pathname)

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
                        logger.warn('Missing translation', {
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

    return WithReactIntl
}

export default withReactIntl
