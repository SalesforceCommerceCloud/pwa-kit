/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {getAppOrigin} from '@salesforce/pwa-kit-react-sdk/utils/url'
import {
    CommerceApiProvider,
    useCommerceApi,
    buildCommerceApiClients,
    ApiClients,
    initializeAuth
} from '@salesforce/commerce-sdk-react'
import {CommerceApiConfig} from '../../types'

/**
 * Checks if the CommerceApiProvider is already installed in the component tree.
 * @returns boolean, true if the CommerceApiProvider is installed, false otherwise.
 */
const useHasCommerceApiProvider = () => {
    let hasProvider = false

    try {
        const api = useCommerceApi()

        // the api object is an object with a bunch of api clients like ShopperProduct, ShopperOrder, etc.
        // if the object is empty, then the CommerceApiProvider is not installed
        if (Object.keys(api).length > 0) {
            hasProvider = true
        }
    } catch (_) {
        hasProvider = false
    }

    return hasProvider
}

type WithOptionalCommerceSdkReactProvider = React.ComponentPropsWithoutRef<any>

const initializeCommerceApi = async (
    config: CommerceApiConfig,
    locals: Record<string, any>
): Promise<ApiClients> => {
    const appOrigin = getAppOrigin()
    const clientConfig = {
        ...config,
        proxy: `${appOrigin}${config.proxyPath}`,
        redirectURI: `${appOrigin}/callback`
    }

    // Initialize auth and get access token if not already set
    if (!locals.__commerceApiAccessToken) {
        locals.__commerceApiAccessToken = await initializeAuth(clientConfig)
    }

    // Build API clients if not already set
    if (!locals.__commerceApiClients) {
        locals.__commerceApiClients = buildCommerceApiClients(clientConfig)
    }

    return locals.__commerceApiClients
}

/**
 * Higher-order component that conditionally installs the CommerceApiProvider if the config is provided.
 *
 * @param WrappedComponent - The component to be optionally wrapped with CommerceApiProvider.
 * @param config - The configuration object for the CommerceApiProvider.
 * @returns A component that wraps the given component with CommerceApiProvider if it is not already present in the component tree.
 */
export const withOptionalCommerceSdkReactProvider = <P extends object>(
    WrappedComponent: React.ComponentType<P>,
    config: CommerceApiConfig,
    locals: Record<string, any>
) => {
    // Initialize only if initialization hasn't started yet
    if (!locals.__commerceApiInitStarted) {
        locals.__commerceApiInitStarted = true
        console.log('CommerceApiProvider config.parameters.clientId', config.parameters.clientId)
        locals.__commerceApiInitPromise = initializeCommerceApi(config, locals)
    }

    const HOC: React.FC<P> = (props: WithOptionalCommerceSdkReactProvider) => {
        if (useHasCommerceApiProvider()) {
            return <WrappedComponent {...(props as P)} />
        }
        if (!config || !config?.parameters) {
            console.error(
                'CommerceApiProvider is not installed and no commerceApi config is provided, this extension may not work as expected.'
            )
            return <WrappedComponent {...(props as P)} />
        }
        const appOrigin = getAppOrigin()
        console.log(
            'CommerceApiProvider locals.__commerceApiAccessToken',
            locals.__commerceApiAccessToken
        )
        return (
            <CommerceApiProvider
                shortCode={config.parameters.shortCode}
                clientId={config.parameters.clientId}
                organizationId={config.parameters.organizationId}
                siteId={config.parameters.siteId}
                locale={config.parameters.locale ?? ''}
                currency={config.parameters.currency ?? ''}
                redirectURI={`${appOrigin}/callback`}
                proxy={`${appOrigin}${config.proxyPath}`}
                fetchedToken={locals.__commerceApiAccessToken}
            >
                <WrappedComponent {...(props as P)} />
            </CommerceApiProvider>
        )
    }

    return HOC
}
