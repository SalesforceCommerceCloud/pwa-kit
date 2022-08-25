/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/**
 * @module progressive-web-sdk/ssr/universal/utils
 */
import {proxyConfigs} from 'pwa-kit-runtime/utils/ssr-shared'
import {withLoadableResolver} from './components'
import routes from './routes'
import Throw404 from './components/throw-404'

const onClient = typeof window !== 'undefined'

/**
 * Get the URL that should be used to load an asset from the bundle.
 *
 * @param {string} path - relative path from the build directory to the asset
 * @function
 * @returns {string}
 */
export const getAssetUrl = (path) => {
    /* istanbul ignore next */
    const publicPath = onClient
        ? `${window.Progressive.buildOrigin}`
        : `/mobify/bundle/${process.env.BUNDLE_ID || 'development'}/`
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
        ? (window.Progressive.ssrOptions || {}).proxyConfigs || []
        : proxyConfigs

    // Clone to avoid accidental mutation of important configuration variables.
    return configs.map((config) => ({...config}))
}

/**
 * Wrap all the components found in the application's route config with the
 * with-loadable-resolver HoC so the appropriate component will be loaded
 * before rendering of the application.
 *
 * @private
 */
export const getRoutes = (locals) => {
    let _routes = routes
    if (typeof routes === 'function') {
        _routes = routes()
    }
    const allRoutes = [..._routes, {path: '*', component: Throw404}]
    return allRoutes.map(({component, ...rest}) => {
        return {
            component: component ? withLoadableResolver(component) : component,
            ...rest
        }
    })
}

/**
 * Utility function to enhance a component with multiple higher-order components,
 * without having to nest.
 * 
 * const WrappedComponent = 
 *       compose(
 *          withHocA, 
 *          withHocB,
 *          withHocc,
 *       )(Component)
 * 
 * @param  {...any} funcs 
 * @returns 
 * 
 * @private
 */
 export const compose = (...funcs) =>
    funcs.reduce((a, b) => (...args) => a(b(...args)), arg => arg)