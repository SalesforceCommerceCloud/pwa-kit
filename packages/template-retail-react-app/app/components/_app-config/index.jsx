/*
 * Copyright (c) 2024, salesforce.com, inc.
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
import {MultiSiteProvider, StoreLocatorProvider} from '@salesforce/retail-react-app/app/contexts'
import {useAppOrigin} from '@salesforce/retail-react-app/app/hooks/use-app-origin'
import {
    resolveSiteFromUrl,
    resolveLocaleFromUrl,
    resolvePageDesignerParamsFromUrl
} from '@salesforce/retail-react-app/app/utils/site-utils'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import {
    getEnvBasePath,
    slasPrivateProxyPath
} from '@salesforce/pwa-kit-runtime/utils/ssr-namespace-paths'
import {createUrlTemplate} from '@salesforce/retail-react-app/app/utils/url'
import createLogger from '@salesforce/pwa-kit-runtime/utils/logger-factory'
import {getPasswordlessCallbackUrl} from '@salesforce/retail-react-app/app/utils/auth-utils'

import {CommerceApiProvider} from '@salesforce/commerce-sdk-react'
import {withReactQuery} from '@salesforce/pwa-kit-react-sdk/ssr/universal/components/with-react-query'
import {useCorrelationId} from '@salesforce/pwa-kit-react-sdk/ssr/universal/hooks'
import {ReactQueryDevtools} from '@tanstack/react-query-devtools'
import {generateSfdcUserAgent} from '@salesforce/retail-react-app/app/utils/sfdc-user-agent-utils'
import {
    DEFAULT_DNT_STATE,
    STORE_LOCATOR_RADIUS,
    STORE_LOCATOR_RADIUS_UNIT,
    STORE_LOCATOR_DEFAULT_COUNTRY,
    STORE_LOCATOR_DEFAULT_COUNTRY_CODE,
    STORE_LOCATOR_DEFAULT_POSTAL_CODE,
    STORE_LOCATOR_DEFAULT_PAGE_SIZE,
    STORE_LOCATOR_SUPPORTED_COUNTRIES
} from '@salesforce/retail-react-app/app/constants'

const sfdcUserAgent = generateSfdcUserAgent()

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
        'correlation-id': correlationId,
        sfdc_user_agent: sfdcUserAgent
    }

    const commerceApiConfig = locals.appConfig.commerceAPI

    const appOrigin = useAppOrigin()

    const passwordlessCallbackURI = getPasswordlessCallbackUrl(
        locals.appConfig.login?.passwordless?.callbackURI
    )

    const storeLocatorConfig = {
        radius: STORE_LOCATOR_RADIUS,
        radiusUnit: STORE_LOCATOR_RADIUS_UNIT,
        defaultCountry: STORE_LOCATOR_DEFAULT_COUNTRY,
        defaultCountryCode: STORE_LOCATOR_DEFAULT_COUNTRY_CODE,
        defaultPostalCode: STORE_LOCATOR_DEFAULT_POSTAL_CODE,
        defaultPageSize: STORE_LOCATOR_DEFAULT_PAGE_SIZE,
        supportedCountries: STORE_LOCATOR_SUPPORTED_COUNTRIES
    }

    // Set absolute uris for CommerceApiProvider proxies and callbacks
    const redirectURI = `${appOrigin}${getEnvBasePath()}/callback`
    const proxy = `${appOrigin}${getEnvBasePath()}${commerceApiConfig.proxyPath}`
    const slasPrivateClientProxyEndpoint = `${appOrigin}${getEnvBasePath()}${slasPrivateProxyPath}`

    const pageDesignerParams = locals.pageDesignerParams || {}

    return (
        <CommerceApiProvider
            shortCode={commerceApiConfig.parameters.shortCode}
            clientId={commerceApiConfig.parameters.clientId}
            organizationId={commerceApiConfig.parameters.organizationId}
            siteId={locals.site?.id}
            locale={locals.locale?.id}
            currency={locals.locale?.preferredCurrency}
            redirectURI={redirectURI}
            passwordlessLoginCallbackURI={passwordlessCallbackURI}
            proxy={proxy}
            headers={headers}
            defaultDnt={DEFAULT_DNT_STATE}
            // Set 'enablePWAKitPrivateClient' to true to use SLAS private client login flows.
            // Make sure to also enable useSLASPrivateClient in ssr.js when enabling this setting.
            enablePWAKitPrivateClient={false}
            privateClientProxyEndpoint={slasPrivateClientProxyEndpoint}
            // Uncomment 'hybridAuthEnabled' if the current site has Hybrid Auth enabled. Do NOT set this flag for hybrid storefronts using Plugin SLAS.
            // hybridAuthEnabled={true}
            logger={createLogger({packageName: 'commerce-sdk-react'})}
            pageDesignerParams={pageDesignerParams}
        >
            <MultiSiteProvider site={locals.site} locale={locals.locale} buildUrl={locals.buildUrl}>
                <StoreLocatorProvider config={storeLocatorConfig}>
                    <ChakraProvider theme={theme}>{children}</ChakraProvider>
                </StoreLocatorProvider>
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

    const pageDesignerParams = resolvePageDesignerParamsFromUrl(path)

    locals.buildUrl = createUrlTemplate(appConfig, site.alias || site.id, locale.id)
    locals.site = site
    locals.locale = locale
    locals.appConfig = appConfig
    locals.pageDesignerParams = pageDesignerParams
}

AppConfig.freeze = () => undefined

AppConfig.extraGetPropsArgs = (locals = {}) => {
    return {
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
    },
    beforeHydrate: (data) => {
        const now = Date.now()

        // Helper to reset the data timestamp to time of app load.
        const updateQueryTimeStamp = ({state}) => {
            state.dataUpdatedAt = now
        }

        // Update serialized mutations and queries to ensure that the cached data is
        // considered fresh on first load.
        data?.mutations?.forEach(updateQueryTimeStamp)
        data?.queries?.forEach(updateQueryTimeStamp)

        return data
    }
}

export default withReactQuery(AppConfig, options)
