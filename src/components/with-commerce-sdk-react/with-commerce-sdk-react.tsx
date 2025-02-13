/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {ReactQueryDevtools} from '@tanstack/react-query-devtools'

// Platform Imports
import {CommerceApiProvider} from '@salesforce/commerce-sdk-react'
import {getAppOrigin} from '@salesforce/pwa-kit-react-sdk/utils/url'
import {proxyBasePath} from '@salesforce/pwa-kit-runtime/utils/ssr-namespace-paths'
import {useCorrelationId} from '@salesforce/pwa-kit-react-sdk/ssr/universal/hooks'
import {useServerContext} from '@salesforce/pwa-kit-react-sdk/ssr/universal/hooks'
import createLogger from '@salesforce/pwa-kit-runtime/utils/logger-factory'
import {ServerContext} from '@salesforce/commerce-sdk-react/hooks/types'

// Local Imports
import {resolveSiteFromUrl, resolveLocaleFromUrl} from '../../utils/site-utils'
import {useExtensionConfig} from '../../hooks/use-extension-config'

// Define a type for the HOC props
type WithCommerceSDKReactProps = {
    shortCode: string
    clientId: string
    organizationId: string
    siteId: string
    locale: string
    currency: string
    redirectURI: string
    proxy: string
    headers: Record<string, string>
    OCAPISessionsURL: string
    logger: any
}

// Define the HOC function
const withCommerceSDKReact = <P extends object>(WrappedComponent: React.ComponentType<P>) => {
    const WithCommerceSDKReact: React.FC<P & WithCommerceSDKReactProps> = (props) => {
        const {req} = useServerContext() as ServerContext
        const path = req?.originalUrl || `${window.location.pathname}${window.location.search}`

        // TODO: Update this type
        const config: any = useExtensionConfig()
        const appOrigin = getAppOrigin()
        const site: any = resolveSiteFromUrl(path)
        const locale: any = resolveLocaleFromUrl(path)

        const {correlationId} = useCorrelationId() as {correlationId: string}
        const headers = {
            'correlation-id': correlationId
        }

        return (
            <CommerceApiProvider
                shortCode={config.commerceAPI.parameters.shortCode}
                clientId={config.commerceAPI.parameters.clientId}
                organizationId={config.commerceAPI.parameters.organizationId}
                siteId={site.id}
                locale={locale.id}
                currency={locale.preferredCurrency}
                redirectURI={`${appOrigin}/callback`}
                proxy={`${appOrigin}${config.commerceAPI.proxyPath as string}`}
                headers={headers}
                // Uncomment 'enablePWAKitPrivateClient' to use SLAS private client login flows.
                // Make sure to also enable useSLASPrivateClient in ssr.js when enabling this setting.
                // enablePWAKitPrivateClient={true}
                OCAPISessionsURL={`${appOrigin}${proxyBasePath}/ocapi/s/${
                    site.id as string
                }/dw/shop/v22_8/sessions`}
                logger={createLogger({packageName: 'commerce-sdk-react'})}
            >
                <WrappedComponent {...(props as P)} />
                <ReactQueryDevtools />
            </CommerceApiProvider>
        )
    }

    return WithCommerceSDKReact
}

export default withCommerceSDKReact
