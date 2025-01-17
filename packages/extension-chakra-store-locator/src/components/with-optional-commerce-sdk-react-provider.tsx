/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {getAppOrigin} from '@salesforce/pwa-kit-react-sdk/utils/url'
import {CommerceApiProvider, useCommerceApi} from '@salesforce/commerce-sdk-react'
import {UserConfig} from '../types/config'
import {logger} from '../logger'

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

/**
 * Higher-order component that conditionally installs the CommerceApiProvider if the config is provided.
 *
 * @param WrappedComponent - The component to be optionally wrapped with CommerceApiProvider.
 * @param config - The configuration object for the CommerceApiProvider.
 * @returns A component that wraps the given component with CommerceApiProvider if it is not already present in the component tree.
 */
export const withOptionalCommerceSdkReactProvider = <P extends object>(
    WrappedComponent: React.ComponentType<P>,
    config: UserConfig
) => {
    const HOC: React.FC<P> = (props: WithOptionalCommerceSdkReactProvider) => {
        if (useHasCommerceApiProvider()) {
            return <WrappedComponent {...(props as P)} />
        }
        if (!config.commerceApi || !config.commerceApi?.parameters) {
            logger.error(
                'CommerceApiProvider is not installed and no commerceApi config is provided, this extension may not work as expected.'
            )
            return <WrappedComponent {...(props as P)} />
        }
        const appOrigin = getAppOrigin()
        return (
            <CommerceApiProvider
                shortCode={config.commerceApi.parameters.shortCode}
                clientId={config.commerceApi.parameters.clientId}
                organizationId={config.commerceApi.parameters.organizationId}
                siteId={config.commerceApi.parameters.siteId}
                locale={config.commerceApi.parameters.locale}
                currency={config.commerceApi.parameters.currency}
                redirectURI={`${appOrigin}/callback`}
                proxy={`${appOrigin}${config.commerceApi.proxyPath}`}
            >
                <WrappedComponent {...(props as P)} />
            </CommerceApiProvider>
        )
    }

    return HOC
}
