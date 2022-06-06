/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useState} from 'react'
import PropTypes from 'prop-types'
import {ChakraProvider} from '@chakra-ui/react'

import PWAKitProvider from 'pwa-kit-ecom/components/theme-provider'
import theme from '../../theme'

// Removes focus for non-keyboard interactions for the whole application
import 'focus-visible/dist/focus-visible'

import CommerceAPI from '../../commerce-api'
import {
    BasketProvider,
    CommerceAPIProvider,
    CustomerProductListsProvider,
    CustomerProvider
} from 'pwa-kit-commerce/commerce-api/contexts'
import {resolveSiteFromUrl} from '../../utils/site-utils'
import {resolveLocaleFromUrl} from '../../utils/utils'
import {getConfig} from 'pwa-kit-runtime/utils/ssr-config'

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
                        <ChakraProvider theme={theme}>
                            {/*Need to have saperate provider for the theme in component library to work, 🤷️️️️*/}
                            <PWAKitProvider theme={theme}>{children}</PWAKitProvider>
                        </ChakraProvider>
                    </CustomerProductListsProvider>
                </BasketProvider>
            </CustomerProvider>
        </CommerceAPIProvider>
    )
}

AppConfig.restore = (locals = {}) => {
    const path =
        typeof window === 'undefined'
            ? locals.originalUrl
            : `${window.location.pathname}${window.location.search}`
    const site = resolveSiteFromUrl(path)
    const locale = resolveLocaleFromUrl(path)
    const currency = locale.preferredCurrency

    const {app: appConfig} = getConfig()
    const apiConfig = {
        ...appConfig.commerceAPI,
        einsteinConfig: appConfig.einsteinAPI
    }

    apiConfig.parameters.siteId = site.id

    locals.api = new CommerceAPI({...apiConfig, locale: locale.id, currency})
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
