/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* global globalThis */

import React, {useState} from 'react'
import PropTypes from 'prop-types'
import {ChakraProvider} from '@chakra-ui/react'

// Removes focus for non-keyboard interactions for the whole application
import 'focus-visible/dist/focus-visible'

import theme from '../../theme'
import CommerceAPI from '../../commerce-api'
import {
    CommerceAPIProvider,
    CustomerProvider,
    BasketProvider,
    CustomerProductListsProvider
} from '../../commerce-api/contexts'
import {commerceAPIConfig} from '../../commerce-api.config'
import {einsteinAPIConfig} from '../../einstein-api.config'
import {DEFAULT_CURRENCY} from '../../constants'
import {getLocaleConfig, getPreferredCurrency} from '../../utils/locale'

const apiConfig = {
    ...commerceAPIConfig,
    einsteinConfig: einsteinAPIConfig
}

/**
 * Use the AppConfig component to inject extra arguments into the getProps
 * methods for all Route Components in the app – typically you'd want to do this
 * to inject a connector instance that can be used in all Pages.
 *
 * You can also use the AppConfig to configure a state-management library such
 * as Redux, or Mobx, if you like.
 */
const AppConfig = ({children, locals = {}}) => {
    const [basket, setBasket] = useState(null)
    const [customer, setCustomer] = useState(null)

    return (
        <CommerceAPIProvider value={locals.api}>
            <CustomerProvider value={{customer, setCustomer}}>
                <BasketProvider value={{basket, setBasket}}>
                    <CustomerProductListsProvider>
                        <ChakraProvider theme={theme}>{children}</ChakraProvider>
                    </CustomerProductListsProvider>
                </BasketProvider>
            </CustomerProvider>
        </CommerceAPIProvider>
    )
}

AppConfig.restore = (locals = {}) => {
    const {locale} = locals
    const currency = getPreferredCurrency(locale) || DEFAULT_CURRENCY

    locals.api = new CommerceAPI({...apiConfig, locale, currency})
}

AppConfig.freeze = () => undefined

AppConfig.extraGetPropsArgs = (locals = {}) => {
    return {
        api: locals.api
    }
}

AppConfig.getIntlConfig = async ({location}) => {
    // If `__INTL_CONFIG__` exists in the global, use it otherwise get the config using our utils, it will
    // later be frozen into the global object for client-side use.
    const localeConfig =
        typeof globalThis.__INTL_CONFIG__ === 'undefined'
            ? await getLocaleConfig({
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

                      // eslint-disable-next-line no-unused-vars
                      let [_, locale] = location.pathname.split('/')

                      return [locale]
                  }
              })
            : globalThis.__INTL_CONFIG__

    // Some of the `localeConfig` properties cannot be serialized (maining the function handlers), for this reason
    // always return them as they donot exist in the frozen state.
    return {
        ...localeConfig,
        onError: (err) => {
            if (err.code === 'MISSING_TRANSLATION') {
                // NOTE: Remove the console error for missing translations during development,
                // as we knew translations would be added later.
                console.warn('Missing translation', err.message)
                return
            }
            throw err
        }
    }
}

AppConfig.propTypes = {
    children: PropTypes.node,
    locals: PropTypes.object
}

export default AppConfig
