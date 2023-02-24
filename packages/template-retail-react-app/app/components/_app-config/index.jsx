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
    CommerceAPIProvider as _CommerceAPIProvider,
    CustomerProductListsProvider,
    //TODO: Remove when integration is finished
    CustomerProvider as _CustomerProvider
} from '../../commerce-api/contexts'
import {CustomerProvider, MultiSiteProvider} from '../../contexts'
import {resolveSiteFromUrl} from '../../utils/site-utils'
import {resolveLocaleFromUrl} from '../../utils/utils'
import {getConfig} from 'pwa-kit-runtime/utils/ssr-config'
import {createUrlTemplate} from '../../utils/url'

import {CommerceApiProvider} from 'commerce-sdk-react-preview'
import {withLegacyGetProps} from 'pwa-kit-react-sdk/ssr/universal/components/with-legacy-get-props'
import {withReactQuery} from 'pwa-kit-react-sdk/ssr/universal/components/with-react-query'
import {useCorrelationId} from 'pwa-kit-react-sdk/ssr/universal/hooks'
import {getAppOrigin} from 'pwa-kit-react-sdk/utils/url'

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

    const {correlationId} = useCorrelationId()
    const headers = {
        'correlation-id': correlationId
    }

    const commerceApiConfig = locals.appConfig.commerceAPI

    const appOrigin = getAppOrigin()

    return (
        <CommerceApiProvider
            shortCode={commerceApiConfig.parameters.shortCode}
            clientId={commerceApiConfig.parameters.clientId}
            organizationId={commerceApiConfig.parameters.organizationId}
            siteId={locals.site?.id}
            locale={locals.locale?.id}
            currency={locals.locale?.preferredCurrency}
            redirectURI={`${appOrigin}/callback`}
            proxy={`${appOrigin}${commerceApiConfig.proxyPath}`}
            headers={headers}
        >
            <CustomerProvider>
                <MultiSiteProvider
                    site={locals.site}
                    locale={locals.locale}
                    buildUrl={locals.buildUrl}
                >
                    <_CommerceAPIProvider value={locals.api}>
                        <_CustomerProvider value={{customer, setCustomer}}>
                            <BasketProvider value={{basket, setBasket}}>
                                <CustomerProductListsProvider>
                                    <ChakraProvider theme={theme}>{children}</ChakraProvider>
                                </CustomerProductListsProvider>
                            </BasketProvider>
                        </_CustomerProvider>
                    </_CommerceAPIProvider>
                </MultiSiteProvider>
            </CustomerProvider>
        </CommerceApiProvider>
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
    locals.buildUrl = createUrlTemplate(appConfig, site.alias || site.id, locale.id)
    locals.site = site
    locals.locale = locale
    locals.appConfig = appConfig
}

AppConfig.freeze = () => undefined

AppConfig.extraGetPropsArgs = (locals = {}) => {
    return {
        api: locals.api,
        buildUrl: locals.buildUrl,
        site: locals.site,
        locale: locals.locale
    }
}

AppConfig.propTypes = {
    children: PropTypes.node,
    locals: PropTypes.object
}

const isServerSide = typeof window === 'undefined'

// Recommended settings for PWA-Kit usages.
// NOTE: they will be applied on both server and client side.
const options = {
    queryClientConfig: {
        defaultOptions: {
            queries: {
                retry: false,
                refetchOnWindowFocus: false,
                staleTime: 2 * 1000,
                ...(isServerSide ? {retryOnMount: false} : {})
            },
            mutations: {
                retry: false
            }
        }
    }
}

export default withReactQuery(withLegacyGetProps(AppConfig), options)
