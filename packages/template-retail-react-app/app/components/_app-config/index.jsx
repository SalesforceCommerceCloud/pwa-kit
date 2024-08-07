/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/*
 * Developer note! When updating this file, make sure to also update the
 * _app-config template files in pwa-kit-create-app.
 *
 * In the pwa-kit-create-app, the templates are found under:
 * - assets/bootstrap/js/overrides/app/components/_app-config
 * - assets/templates/@salesforce/retail-react-app/app/components/_app-config
 */
import React from 'react'
import PropTypes from 'prop-types'
import {ChakraProvider} from '@salesforce/retail-react-app/app/components/shared/ui'

// Removes focus for non-keyboard interactions for the whole application
import 'focus-visible/dist/focus-visible'

import theme from '@salesforce/retail-react-app/app/theme'
import {MultiSiteProvider} from '@salesforce/retail-react-app/app/contexts'
import {
    resolveBasePathFromUrl,
    resolveSiteFromUrl,
    resolveLocaleFromUrl
} from '@salesforce/retail-react-app/app/utils/site-utils'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import {getNamespace, proxyBasePath} from '@salesforce/pwa-kit-runtime/utils/ssr-namespace-paths'
import {createUrlTemplate} from '@salesforce/retail-react-app/app/utils/url'
import createLogger from '@salesforce/pwa-kit-runtime/utils/logger-factory'

import {CommerceApiProvider} from '@salesforce/commerce-sdk-react'
import {withReactQuery} from '@salesforce/pwa-kit-react-sdk/ssr/universal/components/with-react-query'
import {useCorrelationId} from '@salesforce/pwa-kit-react-sdk/ssr/universal/hooks'
import {getAppOrigin} from '@salesforce/pwa-kit-react-sdk/utils/url'
import {ReactQueryDevtools} from '@tanstack/react-query-devtools'

/**
 * Use the AppConfig component to inject extra arguments into the getProps
 * methods for all Route Components in the app – typically you'd want to do this
 * to inject a connector instance that can be used in all Pages.
 *
 * You can also use the AppConfig to configure a state-management library such
 * as Redux, or Mobx, if you like.
 */
const AppConfig = ({children, locals = {}}) => {
    const {correlationId} = useCorrelationId()
    const headers = {
        'correlation-id': correlationId
    }
    const onClient = typeof window !== 'undefined'

    const commerceApiConfig = locals.appConfig.commerceAPI

    const appOrigin = getAppOrigin()

    // we can either do this here or update the proxy path in the app config
    // inside default.js
    // this endpoint is where commerce-sdk-react will send requests to

    // exclude the namespace in MRT server. include it for local and for client

    // const proxy = !onClient
    //     ? `${appOrigin}${commerceApiConfig.proxyPath}`
    //     : `${appOrigin}${getNamespace()}${commerceApiConfig.proxyPath}`

    // TODO: need to have the client namespace included in the local server side calls
    const proxy = `${appOrigin}${getNamespace()}${commerceApiConfig.proxyPath}`

    console.log(`Proxy: ${proxy}`)

    const redirectURI = `${appOrigin}/callback`

    return (
        <CommerceApiProvider
            shortCode={commerceApiConfig.parameters.shortCode}
            clientId={commerceApiConfig.parameters.clientId}
            organizationId={commerceApiConfig.parameters.organizationId}
            siteId={locals.site?.id}
            locale={locals.locale?.id}
            currency={locals.locale?.preferredCurrency}
            redirectURI={redirectURI}
            proxy={proxy}
            headers={headers}
            // Uncomment 'enablePWAKitPrivateClient' to use SLAS private client login flows.
            // Make sure to also enable useSLASPrivateClient in ssr.js when enabling this setting.
            // enablePWAKitPrivateClient={true}
            OCAPISessionsURL={`${appOrigin}${proxyBasePath()}/ocapi/s/${locals.site?.id}/dw/shop/v22_8/sessions`}
            logger={createLogger({packageName: 'commerce-sdk-react'})}
        >
            <MultiSiteProvider site={locals.site} locale={locals.locale} buildUrl={locals.buildUrl}>
                <ChakraProvider theme={theme}>{children}</ChakraProvider>
            </MultiSiteProvider>
            <ReactQueryDevtools />
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

    const {app: appConfig} = getConfig()
    const apiConfig = {
        ...appConfig.commerceAPI,
        einsteinConfig: appConfig.einsteinAPI
    }

    apiConfig.parameters.siteId = site.id

    locals.buildUrl = createUrlTemplate(appConfig, site.alias || site.id, locale.id)
    locals.site = site
    locals.locale = locale
    locals.appConfig = appConfig
}

AppConfig.freeze = () => undefined

AppConfig.extraGetPropsArgs = (locals = {}) => {
    return {
        buildUrl: locals.buildUrl,
        site: locals.site,
        locale: locals.locale
    }
}

AppConfig.getBasePath = (locals = {}) => {
    // in addition to config file, allow setting ssrNamespace via env variables
    // default reads from the ssrNamespace so it's the same as /mobify
    // must be backwards compatible
    // leave it up to Canada Goose to implement how they handle many namespace -> 1 environment

    // Projects can set any basepath they want pages to have here
    // return '/checkout'

    // This method takes the first path part and compares it to a list of
    // allowed base paths defined in the config.
    // If the base paths are not one of the allowed paths, it returns a
    // default base path, also defined in the config, instead

    const path =
        typeof window === 'undefined'
            ? locals.originalUrl
            : `${window.location.pathname}${window.location.search}`

    return resolveBasePathFromUrl(path)
}

AppConfig.propTypes = {
    children: PropTypes.node,
    locals: PropTypes.object
}

const isServerSide = typeof window === 'undefined'

// Recommended settings for PWA-Kit usages.
// NOTE: they will be applied on both server and client side.
// retry is always disabled on server side regardless of the value from the options
const options = {
    queryClientConfig: {
        defaultOptions: {
            queries: {
                retry: false,
                refetchOnWindowFocus: false,
                staleTime: 10 * 1000,
                ...(isServerSide ? {retryOnMount: false} : {})
            },
            mutations: {
                retry: false
            }
        }
    }
}

export default withReactQuery(AppConfig, options)
