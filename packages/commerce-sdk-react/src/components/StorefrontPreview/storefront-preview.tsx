/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useEffect} from 'react'
import PropTypes from 'prop-types'
import {Helmet} from 'react-helmet'
import {CustomPropTypes, detectStorefrontPreview, getClientScript, proxyRequests} from './utils'
import {useHistory} from 'react-router-dom'
import type {LocationDescriptor} from 'history'
import {useCommerceApi, useConfig, useUsid} from '../../hooks'

type GetToken = () => string | undefined | Promise<string | undefined>
type ContextChangeHandler = () => void | Promise<void>
type OptionalWhenDisabled<T> = ({enabled?: true} & T) | ({enabled: false} & Partial<T>)

/**
 * Remove the base path from a path string.
 * Only strips when path equals basePath or path starts with basePath + '/'.
 */
function removeBasePathFromPath(path: string, basePath: string): string {
    const matches = path.startsWith(basePath + '/') || path === basePath
    return matches ? path.slice(basePath.length) || '/' : path
}

const PWA_KIT_PATH_PREFIX = '/__pwa-kit/'

/**
 * Runtime Admin always prepends envBasePath to /__pwa-kit/ paths (e.g. /test/__pwa-kit/refresh),
 * but when showBasePath is false, React Router has no basename and expects /__pwa-kit/refresh.
 *
 * This ensures that regardless of the showBasePath setting, these paths are normalized to
 * remove the base path.
 */
function normalizePwaKitPath<T>(pathOrLocation: LocationDescriptor<T>): LocationDescriptor<T> {
    if (typeof pathOrLocation === 'string') {
        const idx = pathOrLocation.indexOf(PWA_KIT_PATH_PREFIX)
        return idx > 0 ? pathOrLocation.slice(idx) : pathOrLocation
    }
    const pathname = pathOrLocation.pathname ?? '/'
    const idx = pathname.indexOf(PWA_KIT_PATH_PREFIX)
    if (idx > 0) {
        return {...pathOrLocation, pathname: pathname.slice(idx)}
    }
    return pathOrLocation
}

/**
 * Strip the base path from a path
 *
 * React Router history re-adds the base path to the path, so we
 * remove it here to avoid base path duplication.
 */
function removeBasePathFromLocation<T>(
    pathOrLocation: LocationDescriptor<T>,
    basePath: string
): LocationDescriptor<T> {
    if (!basePath) return pathOrLocation
    if (typeof pathOrLocation === 'string') {
        return removeBasePathFromPath(pathOrLocation, basePath) as LocationDescriptor<T>
    }
    const pathname = pathOrLocation.pathname ?? '/'
    return {
        ...pathOrLocation,
        pathname: removeBasePathFromPath(pathname, basePath)
    }
}

/**
 *
 * @param enabled - flag to turn on/off Storefront Preview feature. By default, it is set to true.
 * This flag only applies if storefront is running in a Runtime Admin iframe.
 * @param getToken - A method that returns the access token for the current user
 * @param getBasePath - A method that returns the router base path of the app.
 * Required if using a base path for router routes (showBasePath is true in url config).
 */
export const StorefrontPreview = ({
    children,
    enabled = true,
    getToken,
    onContextChange,
    getBasePath
}: React.PropsWithChildren<
    // Props are only required when Storefront Preview is enabled
    OptionalWhenDisabled<{
        getToken: GetToken
        onContextChange?: ContextChangeHandler
        getBasePath?: () => string
    }>
>) => {
    const history = useHistory()
    const isHostTrusted = detectStorefrontPreview()
    const apiClients = useCommerceApi()
    const {siteId} = useConfig()
    const {getUsidForPreview} = useUsid()

    useEffect(() => {
        if (enabled && isHostTrusted) {
            window.STOREFRONT_PREVIEW = {
                ...window.STOREFRONT_PREVIEW,
                getToken,
                getUsid: getUsidForPreview,
                onContextChange,
                siteId,
                experimentalUnsafeNavigate: (
                    path: LocationDescriptor<unknown>,
                    action: 'push' | 'replace' = 'push',
                    ...args: unknown[]
                ) => {
                    const basePath = getBasePath?.() ?? ''
                    const normalizedPath = normalizePwaKitPath(path)
                    const pathWithoutBase = removeBasePathFromLocation(normalizedPath, basePath)
                    history[action](pathWithoutBase, ...args)
                }
            }
        }
    }, [enabled, getToken, getUsidForPreview, onContextChange, siteId, getBasePath])

    useEffect(() => {
        if (enabled && isHostTrusted) {
            // In Storefront Preview mode, add cache breaker for all SCAPI's requests.
            // Otherwise, it's possible to get stale responses after the Shopper Context is set.
            // (i.e. in this case, we optimize for accurate data, rather than performance/caching)
            proxyRequests(apiClients, {
                apply(target, thisArg, argumentsList) {
                    argumentsList[0] = {
                        ...argumentsList[0],
                        parameters: {
                            ...argumentsList[0]?.parameters,
                            c_cache_breaker: Date.now()
                        }
                    }
                    return target.call(thisArg, ...argumentsList)
                }
            })
        }
    }, [apiClients, enabled])

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
    onContextChange: PropTypes.func,
    getBasePath: PropTypes.func
}

export default StorefrontPreview
