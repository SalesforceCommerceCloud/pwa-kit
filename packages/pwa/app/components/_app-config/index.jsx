/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
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
import {DEFAULT_LOCALE, SUPPORTED_LOCALES, DEFAULT_CURRENCY} from '../../constants'
import {getPreferredCurrency} from '../../utils/locale'

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
const getLocale = (path) => {
    const {pathname} = new URL(`http://hostname${path}`)
    let shortCode = pathname.split('/')[1]

    // Ensure that the locale is in the seported list, otherwise return the default.
    shortCode = SUPPORTED_LOCALES.find((locale) => locale.id === shortCode)
        ? shortCode
        : DEFAULT_LOCALE

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
const AppConfig = ({children, locals = {}, derivedConfig = {}}) => {
    const [basket, setBasket] = useState(null)
    const [customer, setCustomer] = useState(null)

    // TODO: This is probably going to introduce issues as the instance of this api client
    // is difference than the one use in the pages `getProps` methods
    const api = new CommerceAPI({...apiConfig, ...derivedConfig})

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

AppConfig.getDerivedConfigFromRequest = async (req) => {
    const path = typeof window === `undefined` ? req.originalUrl : window.location.path
    const shortCode = getLocale(path) || DEFAULT_LOCALE
    const currency = getPreferredCurrency(shortCode) || DEFAULT_CURRENCY

    return {
        currency,
        locale: shortCode
    }
}

AppConfig.restore = () => {}

AppConfig.freeze = () => undefined

// eslint-disable-next-line no-unused-vars
AppConfig.extraGetPropsArgs = (locals = {}, derivedConfig = {}) => {
    const api = new CommerceAPI({...apiConfig, ...derivedConfig})

    return {
        api
    }
}

AppConfig.propTypes = {
    children: PropTypes.node,
    locals: PropTypes.object
}

export default AppConfig
