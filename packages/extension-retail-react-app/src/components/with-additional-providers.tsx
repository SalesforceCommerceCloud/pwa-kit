/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'
import {ChakraProvider} from '@chakra-ui/react'

// Removes focus for non-keyboard interactions for the whole application
import 'focus-visible/dist/focus-visible'

import theme from '@salesforce/retail-react-app/app/theme'
import {MultiSiteProvider} from '@salesforce/retail-react-app/app/contexts'
import {
    resolveSiteFromUrl,
    resolveLocaleFromUrl
} from '@salesforce/retail-react-app/app/utils/site-utils'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import {proxyBasePath} from '@salesforce/pwa-kit-runtime/utils/ssr-namespace-paths'
import {createUrlTemplate} from '@salesforce/retail-react-app/app/utils/url'
import createLogger from '@salesforce/pwa-kit-runtime/utils/logger-factory'

import {CommerceApiProvider} from '@salesforce/commerce-sdk-react'
import {withReactQuery} from '@salesforce/pwa-kit-react-sdk/ssr/universal/components/with-react-query'
import {useCorrelationId} from '@salesforce/pwa-kit-react-sdk/ssr/universal/hooks'
import {getAppOrigin} from '@salesforce/pwa-kit-react-sdk/utils/url'
import {ReactQueryDevtools} from '@tanstack/react-query-devtools'

// Define a type for the HOC props
type WithAdditionalProviders = React.ComponentPropsWithoutRef<any>;

// Define the HOC function
const withAdditionalProviders = <P extends object>(WrappedComponent: React.ComponentType<P>, locals: Record<string, unknown>) => {

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




      const AppConfig: React.FC<P> = (props: WithAdditionalProviders) => {
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
                // Uncomment 'enablePWAKitPrivateClient' to use SLAS private client login flows.
                // Make sure to also enable useSLASPrivateClient in ssr.js when enabling this setting.
                // enablePWAKitPrivateClient={true}
                OCAPISessionsURL={`${appOrigin}${proxyBasePath}/ocapi/s/${locals.site?.id}/dw/shop/v22_8/sessions`}
                logger={createLogger({packageName: 'commerce-sdk-react'})}
            >
                <MultiSiteProvider site={locals.site} locale={locals.locale} buildUrl={locals.buildUrl}>
                    <ChakraProvider theme={theme}>
                            <WrappedComponent {...(props as P)} />
                        </ChakraProvider>
                </MultiSiteProvider>
                <ReactQueryDevtools />
            </CommerceApiProvider>
        )

    }
  return AppConfig
}

export default withAdditionalProviders
