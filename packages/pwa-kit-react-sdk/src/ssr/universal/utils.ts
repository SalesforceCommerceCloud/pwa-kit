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

const EXTENIONS_NAMESPACE = '__extensions'
const STATIC_FOLDER = 'static'

type GetAssetUrlOptions = {
    appExtensionPackageName?: string
}

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

// TODO: Once we establish that we have a new @salesforce/pwa-kit-extensibility package, we can move this utility to
// it as to not have direct references to extensibilty in the sdk. This will also reduce duplicate code.
/**
 * Get the URL that should be used to load a static asset from the bundle.
 *
 * @param {string} path - Relative path from the build directory to the asset.
 * @param {Object} opts - Options for generating the asset URL.
 * @param {string} [opts.appExtensionPackageName] - Optional package name for an application extension.
 * @function
 * @returns {string} The full URL to the static asset.
 */
export const getStaticAssetUrl = (path: string, opts: GetAssetUrlOptions) => {
    const {appExtensionPackageName = ''} = opts || {}

    /* istanbul ignore next */
    const publicPath = onClient
        ? // @ts-ignore
          `${window.Progressive.buildOrigin as string}`
        : `${bundleBasePath}/${process.env.BUNDLE_ID || 'development'}/`

    // Ensure all defined path arguments start with `/`.
    if (path && !path.startsWith('/')) {
        path = `/${path}`
    }

    return `${publicPath}/${STATIC_FOLDER}${
        appExtensionPackageName ? `/${EXTENIONS_NAMESPACE}/${appExtensionPackageName}` : ''
    }${path ? path : ''}`
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
