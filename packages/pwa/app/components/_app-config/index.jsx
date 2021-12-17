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
    BasketProvider,
    CommerceAPIProvider,
    CustomerProductListsProvider,
    CustomerProvider
} from '../../commerce-api/contexts'
import {commerceAPIConfig, einsteinAPIConfig} from '../../api.config'
import {urlPartPositions} from '../../constants'
import {getPreferredCurrency} from '../../utils/locale'
import {getL10nConfig, getConfig, urlToPath} from '../../utils/utils'
import {resolveSiteFromUrl} from '../../utils/site-utils'

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

    const {
        app: {
            url: {locale: localePosition, site: sitePosition}
        }
    } = getConfig()
    // If there is no originalUrl value in the locals, create it from the window location.
    // This happens when executing on the client.

    const url = urlToPath(originalUrl)

    let shortCode
    const {pathname, searchParams} = new URL(url)
    if (localePosition === urlPartPositions.PATH) {
        // Parse the pathname from the partial using the URL object and a placeholder host
        // locale can be in a different position depending on the site position
        if (sitePosition === urlPartPositions.PATH) {
            shortCode = pathname.split('/')[2]
        } else {
            shortCode = pathname.split('/')[1]
        }
    } else if (localePosition === urlPartPositions.QUERY_PARAM) {
        shortCode = searchParams.get('locale')
    }

    // Ensure that the locale is in the supported list, otherwise return the default.
    // shortCode = getSupportedLocalesIds().includes(shortCode) ? shortCode : undefined
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
    // Parse the locale from the page url.
    const originalUrl = locals.originalUrl
    const url = urlToPath(originalUrl)
    const site = resolveSiteFromUrl(url)

    apiConfig.parameters.siteId = site?.id
    const l10nConfig = getL10nConfig(originalUrl)

    const locale = getLocale(locals) || l10nConfig.defaultLocale
    const currency =
        getPreferredCurrency(locale, l10nConfig.supportedLocales) || l10nConfig.defaultCurrency

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
