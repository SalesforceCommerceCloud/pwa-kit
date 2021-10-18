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
import {getAppConfig, getSiteId} from '../../utils/utils'
import {getAppOrigin} from 'pwa-kit-react-sdk/utils/url'

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
const getLocale = (locals = {}) => {
    let {originalUrl} = locals
    // If there is no originalUrl value in the locals, create it from the window location.
    // This happens when executing on the client.
    if (!originalUrl) {
        originalUrl = window?.location.href.replace(window.location.origin, '')
    }

    // Parse the pathname from the partial using the URL object and a placeholder host
    const {pathname} = new URL(`http://hostname${originalUrl}`)

    // pattern for shortCode jp-JP, us-GB
    const reg = /^([a-z]{2}-[A-Z]{2})?$/
    // split the pathname into array and filter out empty string
    const paths = pathname.split('/').filter(Boolean)
    let shortCode = paths.find((path) => reg.test(path))

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
    const appConfig = getAppConfig()
    const appOrigin = getAppOrigin()
    const siteId = getSiteId(appConfig, locals.originalUrl, appOrigin)
    if (!siteId) {
        console.error(
            `Cannot find the siteID, the fallback siteId ${commerceAPIConfig.parameters.siteId} will be used`
        )
    } else {
        apiConfig.parameters.siteId = siteId
    }

    const locale = getLocale(locals) || DEFAULT_LOCALE
    const currency = getPreferredCurrency(locale) || DEFAULT_CURRENCY

    locals.api = new CommerceAPI({...apiConfig, locale, currency})
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
