/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {ChakraProvider} from '@salesforce/retail-react-app/app/components/shared/ui'
import {useLocation, Redirect} from 'react-router-dom'

// Removes focus for non-keyboard interactions for the whole application
import 'focus-visible/dist/focus-visible'

import theme from '@salesforce/retail-react-app/app/theme'
import {MultiSiteProvider} from '@salesforce/retail-react-app/app/contexts'
import {
    resolveSiteFromUrl,
    resolveLocaleFromUrl
} from '@salesforce/retail-react-app/app/utils/site-utils'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import {createUrlTemplate} from '@salesforce/retail-react-app/app/utils/url'

import {CommerceApiProvider} from '@salesforce/commerce-sdk-react'
import {withReactQuery} from '@salesforce/pwa-kit-react-sdk/ssr/universal/components/with-react-query'
import {useCorrelationId} from '@salesforce/pwa-kit-react-sdk/ssr/universal/hooks'
import {getAppOrigin} from '@salesforce/pwa-kit-react-sdk/utils/url'
import {ReactQueryDevtools} from '@tanstack/react-query-devtools'

import useBlock from '@salesforce/retail-react-app/app/hooks/use-block'
import {useUrlMapping} from '@salesforce/retail-react-app/app/pages/seo-url-mapping/use-url-mapping'

const wait = async (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms))
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
    const {correlationId} = useCorrelationId()
    const {pathname, search} = useLocation()
    const headers = {
        'correlation-id': correlationId
    }

    const commerceApiConfig = locals.appConfig.commerceAPI

    const appOrigin = getAppOrigin()

    const REDIRECTS_ENABLED = true
    useBlock(async (location) => {
        // If the redirect feature is not enabled we don't need to circumvent the normal routing flow, so we return
        // "false" to not block.
        if (!REDIRECTS_ENABLED) {
            return false
        } 

        // If the redirect feature IS enabled there are 2 ways we can solve the problem. 
        // 1. We can block navigation until we check to see if there is a redirect for the clicked link.
        // 2. We navigate the an intermediate page that will handle checking for a url mapping and do what is
        //    needs to do.
        // There are pros and cons to each, the first option we don't have an intermediate page so it's not as jarring, 
        // but we will have lag in all links transitioning. The second options doesn't have this lag in transition, but 
        // it has this secondary page that we must show (loader) that happens on all links. 
        // 
        // DEVELOPER NOTE: I think its a really bad idea to implement redirects in a single page app.
        console.log('location: ', location)
        // This gets caught by the catch-all route.
        return `/_seo-url-mapping?locationPathname=${location.pathname}&locationSearch=${location.search}`
    })
    const {data: urlMapping} = useUrlMapping({
        parameters: {
            urlSegment: pathname
        }
    })

    // DEVELOPER NOTE: Think about when we need to run this code, should we only be doing it when we are
    // on the server?
    if (urlMapping) {
        return <Redirect to={`/global/en-GB/${urlMapping.redirectUrl.destinationType}/${urlMapping.redirectUrl.destinationId}${search}`} />
    }

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
            OCAPISessionsURL={`${appOrigin}/mobify/proxy/ocapi/s/${locals.site?.id}/dw/shop/v22_8/sessions`}
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
    // NOTE: The API for `dehydratedState` will be an object in the form of a react query client cache state
    // object, it can also be a function that returns the same object or an asyn function that returns that same 
    // object type. We are going to use this API to make a pre-fetch to get the mapping information for the given
    // pathname which is passed in via a context object argument.
    // DEVELOPER NOTE: We should probably place this function in another file and only apply the enhancement if the feature
    // is enabled. 
    // DEVELOPER NOTE: Is it possible through overrides to break this feature? Probably.
    dehydratedState: async ({location}) => {
        const {pathname} = location
        const queries = []

        // NOTE: This function is essentially simulating the getUrlMapping endpoint of the 
        // Shopper SEO API.
        await new Promise((resolve) => setTimeout(resolve, 200))
        
        if (pathname === '/custom-product-path') {
            queries.push({
                // This represents the smallest definition of a query state, you absoloutly need
                // `dataUpdatedAt` and `status`.
                state: {
                    data: {
                        resourceId: '66936828M',
                        resourceType: 'PRODUCT'
                    },
                    dataUpdatedAt: Date.now(),
                    status: 'success'
                },
                queryKey: [
                    'url-mappings',
                    '/custom-product-path'
                ]
            })
        } else if (pathname === '/custom-product-path-bad') {
            queries.push({
                state: {
                    dataUpdatedAt: Date.now(),
                    error: 'No seo url found!',
                    errorUpdatedAt: Date.now(),
                    status: 'error'
                },
                queryKey: [
                    'url-mappings',
                    '/custom-product-path-bad'
                ]
            })
        } else if (pathname === '/global/en-GB/product/52416781M') {
            queries.push({
                state: {
                    data: {
                        redirectUrl: {
                            copySourceParams: false,
                            destinationId: "42416786M",
                            destinationType: "product",
                            statusCode: "301",
                            destinationUrl: "https://staging-c7testing-cdd.demandware.net/s/SiteGenesis/casual%20to%20dressy%20trousers/?lang=en_US"
                        },
                        resourceId: '52416781M',
                        resourceType: 'product'
                    },
                    dataUpdatedAt: Date.now(),
                    status: 'success'
                },
                queryKey: [
                    'url-mappings',
                    '/global/en-GB/product/52416781M'
                ]
            })
        }

        return {
            queries
        }
    }
}

export default withReactQuery(
    AppConfig, 
    options
)
