/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {withLegacyGetProps} from 'pwa-kit-react-sdk/ssr/universal/components/with-legacy-get-props'
import {withReactQuery} from 'pwa-kit-react-sdk/ssr/universal/components/with-react-query'
import {CommerceApiProvider} from 'commerce-sdk-react'
import {useCorrelationId} from 'pwa-kit-react-sdk/ssr/universal/hooks'

const isServerSide = typeof window === 'undefined'


const AppConfig = (props) => {
    const {correlationId} = useCorrelationId()
    const headers = {
        'correlation-id': correlationId
    }
    return (
        <CommerceApiProvider
            siteId="RefArch"
            shortCode="8o7m175y"
            clientId="c9c45bfd-0ed3-4aa2-9971-40f88962b836"
            organizationId="f_ecom_zzrf_001"
            redirectURI="http://localhost:3000/callback"
            proxy="http://localhost:3000/mobify/proxy/api"
            locale="en-CA"
            currency="USD"
            headers={headers}
        >
            {props.children}
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
