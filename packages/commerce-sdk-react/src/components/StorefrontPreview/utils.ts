/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {ApiClients} from '../../hooks/types'
import {DEVELOPMENT_ORIGIN, getParentOrigin, isOriginTrusted} from '../../utils'

/** Detects whether the storefront is running in an iframe as part of Storefront Preview.
 * @private
 */
export const detectStorefrontPreview = () => {
    const parentOrigin = getParentOrigin()
    return isOriginTrusted(parentOrigin)
}

/** Returns the URL to load the Storefront Preview client script from the parent origin.
 * @private
 */
export const getClientScript = () => {
    const parentOrigin = getParentOrigin() ?? 'https://runtime.commercecloud.com'
    return parentOrigin === DEVELOPMENT_ORIGIN
        ? `${parentOrigin}/mobify/bundle/development/static/storefront-preview.js`
        : `${parentOrigin}/cc/b2c/preview/preview.client.js`
}

// Custom Prop Types.
export const CustomPropTypes = {
    /**
     * This custom PropType ensures that the prop is only required when the known prop
     * "enabled" is set to "true".
     *
     * @param props
     * @param propName
     * @param componentName
     * @returns
     */
    requiredFunctionWhenEnabled: (props: any, propName: any, componentName: any) => {
        if (
            props['enabled'] === true &&
            (props[propName] === undefined || typeof props[propName] !== 'function')
        ) {
            return new Error(
                `${String(propName)} is a required function for ${String(
                    componentName
                )} when enabled is true`
            )
        }
    }
}

/**
 * Via the built-in Proxy object, modify the behaviour of each request for the given SCAPI clients
 * @private
 */
export const proxyRequests = (clients: ApiClients, handlers: ProxyHandler<any>) => {
    Object.values(clients).forEach((client: Record<string, any>) => {
        const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(client))

        methods.forEach((method) => {
            client[method] = new Proxy(client[method], handlers)
        })
    })
}
