/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useEffect} from 'react'
import PropTypes from 'prop-types'
import {Helmet} from 'react-helmet'
import {CustomPropTypes, detectStorefrontPreview, getClientScript, proxyGetRequests} from './utils'
import {useHistory} from 'react-router-dom'
import type {LocationDescriptor} from 'history'
import {useCommerceApi} from '../../hooks'

type GetToken = () => string | undefined | Promise<string | undefined>
type ContextChangeHandler = () => void | Promise<void>
type OptionalWhenDisabled<T> = ({enabled?: true} & T) | ({enabled: false} & Partial<T>)

/**
 *
 * @param enabled - flag to turn on/off Storefront Preview feature. By default, it is set to true.
 * This flag only applies if storefront is running in a Runtime Admin iframe.
 * @param getToken - A method that returns the access token for the current user
 */
export const StorefrontPreview = ({
    children,
    enabled = true,
    getToken,
    onContextChange
}: React.PropsWithChildren<
    // Props are only required when Storefront Preview is enabled
    OptionalWhenDisabled<{getToken: GetToken; onContextChange?: ContextChangeHandler}>
>) => {
    const history = useHistory()
    const isHostTrusted = detectStorefrontPreview()
    const apiClients = useCommerceApi()

    useEffect(() => {
        if (enabled && isHostTrusted) {
            window.STOREFRONT_PREVIEW = {
                ...window.STOREFRONT_PREVIEW,
                getToken,
                onContextChange,
                experimentalUnsafeNavigate: (
                    path: LocationDescriptor<unknown>,
                    action: 'push' | 'replace' = 'push',
                    ...args: unknown[]
                ) => {
                    history[action](path, ...args)
                }
            }

            // In Storefront Preview mode, add cache breaker for the SCAPI's GET requests.
            // Otherwise, it's possible to get stale responses after the Shopper Context is set.
            // (i.e. in this case, we optimize for accurate data, rather than performance/caching)
            proxyGetRequests(apiClients, {
                apply(target, thisArg, argumentsList) {
                    if (argumentsList.length === 0) {
                        argumentsList[0] = {parameters: {c_cache_breaker: new Date().getTime()}}
                    } else {
                        argumentsList[0].parameters = argumentsList[0].parameters ?? {}
                        argumentsList[0].parameters.c_cache_breaker = new Date().getTime()
                    }
                    return target.call(thisArg, ...argumentsList)
                }
            })
        }
    }, [enabled, getToken, onContextChange])

    return (
        <>
            {enabled && isHostTrusted && (
                <Helmet>
                    <script
                        id="storefront_preview"
                        src={getClientScript()}
                        async
                        type="text/javascript"
                    ></script>
                </Helmet>
            )}
            {children}
        </>
    )
}

StorefrontPreview.propTypes = {
    children: PropTypes.node,
    enabled: PropTypes.bool,
    // A custom prop type function to only require this prop if enabled is true. Ultimately we would like
    // to get to a place where both these props are simply optional and we will provide default implementations.
    // This would make the API simpler to use.
    getToken: CustomPropTypes.requiredFunctionWhenEnabled,
    onContextChange: PropTypes.func
}

export default StorefrontPreview
