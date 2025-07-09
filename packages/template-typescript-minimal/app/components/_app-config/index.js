/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {withLegacyGetProps} from '@salesforce/pwa-kit-react-sdk/ssr/universal/components/with-legacy-get-props'
import {withReactQuery} from '@salesforce/pwa-kit-react-sdk/ssr/universal/components/with-react-query'
import {ChakraProvider} from '@chakra-ui/react'
import theme from '../../theme'
import {CommerceApiProvider} from '@salesforce/commerce-sdk-react'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import {useAppOrigin} from '../../hooks/use-app-origin'

const isServerSide = typeof window === 'undefined'

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

const AppConfig = ({children, locals = {}}) => {
    const commerceApiConfig = locals.appConfig.commerceAPI
    const appOrigin = useAppOrigin()

    return (
        <CommerceApiProvider
            shortCode={commerceApiConfig.parameters.shortCode}
            clientId={commerceApiConfig.parameters.clientId}
            organizationId={commerceApiConfig.parameters.organizationId}
            siteId={'RefArchGlobal'}
            locale={'en-GB'}
            currency={'GBP'}
            redirectURI={`${appOrigin}/callback`}
            passwordlessLoginCallbackURI={'/passwordless/callback'}
            proxy={`${appOrigin}${commerceApiConfig.proxyPath}`}
            defaultDnt={1}
        >
            <ChakraProvider value={theme}>{children}</ChakraProvider>
        </CommerceApiProvider>
    )
}

AppConfig.freeze = () => undefined
AppConfig.restore = (locals = {}) => {
    const {app: appConfig} = getConfig()
    const apiConfig = {
        ...appConfig.commerceAPI,
        einsteinConfig: appConfig.einsteinAPI
    }
    apiConfig.parameters.siteId = 'RefArchGlobal'
    locals.appConfig = appConfig
}
AppConfig.extraGetPropsArgs = (locals = {}) => {
    return {}
}

AppConfig.propTypes = {}

export default withReactQuery(withLegacyGetProps(AppConfig), options)
