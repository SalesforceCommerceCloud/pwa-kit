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
} from '../../commerce-api/utils'
import {commerceAPIConfig} from '../../commerce-api.config'
import {einsteinAPIConfig} from '../../einstein-api.config'
import {DEFAULT_LOCALE} from '../../locale'

/**
 * Parses and returns the locale from the provided locals object. If the locale cannot be parsed
 * return undefined.
 * @private
 * @param locals
 * @returns {String} the locale shortcode
 */
const parseLocale = (locals) => {
    const {originalUrl} = locals

    if (!originalUrl) {
        return
    }

    return originalUrl.split('/')[1]
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
    const [customerProductLists, setCustomerProductLists] = useState()

    return (
        <CommerceAPIProvider value={locals.api}>
            <CustomerProvider value={{customer, setCustomer}}>
                <BasketProvider value={{basket, setBasket}}>
                    <CustomerProductListsProvider
                        value={{customerProductLists, setCustomerProductLists}}
                    >
                        <ChakraProvider theme={theme}>{children}</ChakraProvider>
                    </CustomerProductListsProvider>
                </BasketProvider>
            </CustomerProvider>
        </CommerceAPIProvider>
    )
}

AppConfig.restore = (locals = {}) => {
    const locale =
        parseLocale(locals) || window?.__PRELOADED_STATE__?.appProps?.targetLocale || DEFAULT_LOCALE
    const config = {
        ...commerceAPIConfig,
        einsteinConfig: einsteinAPIConfig,
        locale: locale
    }

    locals.api = new CommerceAPI(config)
}

AppConfig.freeze = () => undefined

AppConfig.extraGetPropsArgs = (locals = {}) => {
    return {
        api: locals.api
    }
}

AppConfig.propTypes = {
    children: PropTypes.node,
    locals: PropTypes.object
}

export default AppConfig
