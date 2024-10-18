/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {CommerceApiProvider} from '@salesforce/commerce-sdk-react'
import {getAppOrigin} from '@salesforce/pwa-kit-react-sdk/utils/url'
import {withLegacyGetProps} from '@salesforce/pwa-kit-react-sdk/ssr/universal/components/with-legacy-get-props'
import {withReactQuery} from '@salesforce/pwa-kit-react-sdk/ssr/universal/components/with-react-query'

const isServerSide = typeof window === 'undefined'

const AppConfig = ({children, locals = {}}) => {
    const appOrigin = getAppOrigin()
    const commerceApiConfig = {
        parameters: {
            shortCode: '8o7m175y',
            clientId: 'c9c45bfd-0ed3-4aa2-9971-40f88962b836',
            organizationId: 'f_ecom_zzrf_001',
            siteId: 'RefArchGlobal',
            locale: 'en-US',
            currency: 'USD'
        }
    }
    return (
        <CommerceApiProvider
            shortCode={commerceApiConfig.parameters.shortCode}
            clientId={commerceApiConfig.parameters.clientId}
            organizationId={commerceApiConfig.parameters.organizationId}
            siteId={commerceApiConfig.parameters.siteId}
            locale={commerceApiConfig.parameters.locale}
            currency={commerceApiConfig.parameters.currency}
            redirectURI={`${appOrigin}/callback`}
            proxy={`${appOrigin}/mobify/proxy/api`}
            // Uncomment 'enablePWAKitPrivateClient' to use SLAS private client login flows.
            // Make sure to also enable useSLASPrivateClient in ssr.js when enabling this setting.
            // enablePWAKitPrivateClient={true}
            OCAPISessionsURL={`${appOrigin}/mobify/proxy/ocapi/s/${commerceApiConfig.parameters.siteId}/dw/shop/v22_8/sessions`}
        >
                {children}
        </CommerceApiProvider>
    )
}

AppConfig.restore = () => {}
AppConfig.extraGetPropsArgs = () => {}
AppConfig.freeze = () => {}


// Recommended settings for PWA-Kit usages.
// NOTE: they will be applied on both server and client side.
const options = {
    queryClientConfig: {
        defaultOptions: {
            queries: {
                retry: false,
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
