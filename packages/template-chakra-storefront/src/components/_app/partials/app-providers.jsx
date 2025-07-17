/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'
import {StorefrontPreview} from '@salesforce/commerce-sdk-react/components'
import {IntlProvider} from 'react-intl'
import {CurrencyProvider} from '../../../contexts'
import {useAppConfig} from '../hooks'
import logger from '../../../utils/logger-instance'

/**
 * AppProviders component that wraps the app with all necessary context providers
 * Handles StorefrontPreview, IntlProvider, and CurrencyProvider setup
 */
const AppProviders = ({children, getTokenWhenReady, targetLocale, messages, currency}) => {
    const {appConfig} = useAppConfig()

    return (
        <StorefrontPreview getToken={getTokenWhenReady}>
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
                // NOTE: if you update this value, please also update the following npm scripts in `template-chakra-storefront/package.json`:
                // - "extract-default-translations"
                // - "compile-translations:pseudo"
                defaultLocale={appConfig.defaultAppLocale}
            >
                <CurrencyProvider currency={currency}>{children}</CurrencyProvider>
            </IntlProvider>
        </StorefrontPreview>
    )
}

AppProviders.propTypes = {
    children: PropTypes.node.isRequired,
    getTokenWhenReady: PropTypes.func.isRequired,
    targetLocale: PropTypes.string.isRequired,
    messages: PropTypes.object,
    currency: PropTypes.string.isRequired
}

export default AppProviders
