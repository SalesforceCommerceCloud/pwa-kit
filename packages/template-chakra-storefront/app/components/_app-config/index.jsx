/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {createContext, useContext, useMemo} from 'react'
import PropTypes from 'prop-types'
import {ChakraProvider} from '@chakra-ui/react'

// Removes focus for non-keyboard interactions for the whole application
import 'focus-visible/dist/focus-visible'

import theme from '../../../src/theme'
// import {MultiSiteProvider, AppConfigProvider} from '../../../src/contexts'
import {MultiSiteProvider} from '../../../src/contexts'
import {useAppOrigin} from '../../../src/hooks/use-app-origin'
import {resolveSiteFromUrl, resolveLocaleFromUrl} from '../../../src/utils/site-utils'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import {createUrlTemplate} from '../../../src/utils/url'
import createLogger from '@salesforce/pwa-kit-runtime/utils/logger-factory'

import {CommerceApiProvider} from '@salesforce/commerce-sdk-react'
import {withReactQuery} from '@salesforce/pwa-kit-react-sdk/ssr/universal/components/with-react-query'
import {useCorrelationId} from '@salesforce/pwa-kit-react-sdk/ssr/universal/hooks'
import {ReactQueryDevtools} from '@tanstack/react-query-devtools'
import {DEFAULT_DNT_STATE} from '../../../config/constants'

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

    const commerceApiConfig = locals.appConfig.commerceAPI
    const appOrigin = useAppOrigin()
    const passwordlessCallback = locals.appConfig.login?.passwordless?.callbackURI

    const memoizedHeaders = useMemo(
        () => headers,
        [
            /* dependencies */
        ]
    )
    const memoizedLogger = useMemo(() => createLogger({packageName: 'commerce-sdk-react'}), [])

    const siteId = useMemo(() => locals.site?.id, [locals.site?.id])
    const locale = useMemo(() => locals.locale?.id, [locals.locale?.id])
    const currency = useMemo(
        () => locals.locale?.preferredCurrency,
        [locals.locale?.preferredCurrency]
    )
    const proxy = useMemo(
        () => `${appOrigin}${commerceApiConfig.proxyPath}`,
        [appOrigin, commerceApiConfig.proxyPath]
    )
    const redirectURI = useMemo(() => `${appOrigin}/callback`, [appOrigin])
    const passwordlessLoginCallbackURI = useMemo(() => passwordlessCallback, [passwordlessCallback])
    const defaultDnt = useMemo(() => locals.appConfig.dnt, [locals.appConfig.dnt])

    return (
        <CommerceApiProvider
            shortCode={commerceApiConfig.parameters.shortCode}
            clientId={commerceApiConfig.parameters.clientId}
            organizationId={commerceApiConfig.parameters.organizationId}
            siteId={siteId}
            locale={locale}
            currency={currency}
            redirectURI={redirectURI}
            passwordlessLoginCallbackURI={passwordlessLoginCallbackURI}
            proxy={proxy}
            headers={memoizedHeaders}
            defaultDnt={defaultDnt}
            logger={memoizedLogger}
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

    // TODO: understand why this fails, getConfig should be implicit via server context in SSR
    const appConfig = getConfig()
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
        // appConfig: locals.appConfig
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
