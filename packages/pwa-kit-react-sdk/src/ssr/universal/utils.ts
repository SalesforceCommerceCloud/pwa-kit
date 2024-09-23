/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * @module progressive-web-sdk/ssr/universal/utils
 */

/* eslint-disable @typescript-eslint/ban-ts-comment */

// @ts-ignore
import {proxyConfigs} from '@salesforce/pwa-kit-runtime/utils/ssr-shared'
// @ts-ignore
import {bundleBasePath} from '@salesforce/pwa-kit-runtime/utils/ssr-namespace-paths'
import hoistNonReactStatics from 'hoist-non-react-statics'

const onClient = typeof window !== 'undefined'

/**
 * Get the URL that should be used to load an asset from the bundle.
 *
 * @param {string} path - relative path from the build directory to the asset
 * @function
 * @returns {string}
 */
export const getAssetUrl = (path: string) => {
    /* istanbul ignore next */
    const publicPath = onClient
        ? // @ts-ignore
          `${window.Progressive.buildOrigin as string}`
        : `${bundleBasePath}/${process.env.BUNDLE_ID || 'development'}/`
    return path ? `${publicPath}${path}` : publicPath
}

/**
 * @typedef {Object} ProxyConfig
 * @property {String} protocol - http or https
 * @property {String} host - the hostname
 * @property {String} path - the path element that follows "mobify/proxy"
 */

/**
 * Return the set of proxies configured for the app.
 *
 * The result is an array of objects, each of which has 'protocol'
 * (either 'http' or 'https'), 'host' (the hostname) and 'path' (the
 * path element that follows "/mobify/proxy/", defaulting to 'base' for
 * the first proxy, and 'base2' for the next).
 *
 * @function
 * @returns {Array<ProxyConfig>}
 */
export const getProxyConfigs = () => {
    const configs = onClient
        ? // @ts-ignore
          (window.Progressive.ssrOptions || {}).proxyConfigs || []
        : // @ts-ignore
          proxyConfigs

    // Clone to avoid accidental mutation of important configuration variables.
    return configs.map((config: any) => ({...config}))
}

/**
 * Applies a series of Higher-Order Components (HOCs) to a given React component.
 *
 * @template T - The type of the React component.
 * @param {T} Component - The React component to which the HOCs will be applied.
 * @param {Array<(component: T) => T>} hocs - An array of Higher-Order Components (HOCs) to apply to the component.
 * @returns {T} - The React component wrapped with the provided HOCs.
 */
export const applyHOCs = <T extends React.ComponentType<any>>(
    Component: T,
    hocs: Array<(component: T) => T>
): T => {
    return hocs.reduce((AccumulatedComponent, hoc) => {
        const WrappedComponent = hoc(AccumulatedComponent)
        return hoistNonReactStatics(WrappedComponent, AccumulatedComponent) as T
    }, Component)
}
