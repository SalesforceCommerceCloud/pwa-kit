/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useContext, useState} from 'react'
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
import {DEFAULT_LOCALE, DEFAULT_CURRENCY} from '../../constants'
import {getPreferredCurrency, getSupportedLocalesIds} from '../../utils/locale'

import {AppContext} from 'pwa-kit-react-sdk/ssr/universal/contexts'

const apiConfig = {
    ...commerceAPIConfig,
    einsteinConfig: einsteinAPIConfig
}

/**
 * Returns the validated locale short code parsed from the url.
 * @private
 * @param locals the request locals (only defined when executing on the server.)
 * @returns {String} the locale short code
 */
const getLocale = (originalRequest = {}) => {
    let {url} = originalRequest

    // Parse the pathname from the partial using the URL object and a placeholder host
    const {pathname} = new URL(`http://hostname${url}`)
    let shortCode = pathname.split('/')[1]

    // Ensure that the locale is in the supported list, otherwise return the default.
    shortCode = getSupportedLocalesIds().includes(shortCode) ? shortCode : DEFAULT_LOCALE

    return shortCode
}

/**
 * Use the AppConfig component to inject extra arguments into the getProps
 * methods for all Route Components in the app – typically you'd want to do this
 * to inject a connector instance that can be used in all Pages.
 *
 * You can also use the AppConfig to configure a state-management library such
 * as Redux, or Mobx, if you like.
 */
const AppConfig = ({children}) => {
    const [basket, setBasket] = useState(null)
    const [customer, setCustomer] = useState(null)
    const {originalRequest} = useContext(AppContext)

    const locale = getLocale(originalRequest) || DEFAULT_LOCALE
    const currency = getPreferredCurrency(locale) || DEFAULT_CURRENCY
    const api = new CommerceAPI({...apiConfig, locale, currency})

    return (
        <CommerceAPIProvider value={api}>
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

AppConfig.freezeRequest = function(req) {
    return {
        url: req.url,
        headers: {
            'Accept-Language': req.headers['Accept-Language']
        }
    }
}

AppConfig.extraGetPropsArgs = function() {
    const locale = getLocale(this.originalRequest) || DEFAULT_LOCALE
    const currency = getPreferredCurrency(locale) || DEFAULT_CURRENCY

    return {
        api: new CommerceAPI({...apiConfig, locale, currency})
    }
}

AppConfig.propTypes = {
    children: PropTypes.node,
    locals: PropTypes.object
}

export default AppConfig
