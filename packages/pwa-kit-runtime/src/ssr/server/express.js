/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/**
 * @module progressive-web-sdk/ssr/server/express
 */

import {getBundleBaseUrl, localDevLog, isRemote} from '../../utils/ssr-server'
import {RemoteServerFactory} from './build-remote-server'

export const RESOLVED_PROMISE = Promise.resolve()

/**
 * Provided for use by requestHook overrides.
 *
 * Call this to return a res that is a redirect to a bundle asset.
 * Be careful with res caching - 301 responses can be cached. You
 * can call res.set to set the 'Cache-Control' header before
 * calling this function.
 *
 * This function returns a Promise that resolves when the res
 * has been sent. The caller does not need to wait on this Promise.
 *
 * @param {Object} options
 * @param {Request} options.req - the ExpressJS request object
 * @param {Response} options.res - the ExpressJS res object
 * @param {String} [options.path] - the path to the bundle asset (relative
 * to the bundle root/build directory). If this is falsy, then
 * request.path is used (i.e. '/robots.txt' would be the path for
 * 'robots.txt' at the top level of the build directory).
 * @param {Number} [options.redirect] a 301 or 302 status code, which
 * will be used to respond with a redirect to the bundle asset.
 * @private
 */
export const respondFromBundle = ({req, res, path, redirect = 301}) => {
    // The path *may* start with a slash
    const workingPath = path || req.path

    // Validate redirect
    const workingRedirect = Number.parseInt(redirect)
    /* istanbul ignore next */
    if (workingRedirect < 301 || workingRedirect > 307) {
        throw new Error('The redirect parameter must be a number between 301 and 307 inclusive')
    }

    // assetPath will not start with a slash
    /* istanbul ignore next */
    const assetPath = workingPath.startsWith('/') ? workingPath.slice(1) : workingPath

    // This is the relative or absolute location of the asset via the
    // /mobify/bundle path
    const location = `${getBundleBaseUrl()}${assetPath}`

    localDevLog(
        `Req ${res.locals.requestId}: redirecting ${assetPath} to ${location} (${workingRedirect})`
    )
    res.redirect(workingRedirect, location)
}

/**
 * Get the appropriate runtime object for the current environment (remote or development)
 * @returns Shallow of the runtime object with bound methods
 */
export const getRuntime = () => {
    const runtime = isRemote()
        ? RemoteServerFactory
        : // The dev server is for development only, and should not be deployed to production.
          // To avoid deploying the dev server (and all of its dependencies) to production, it exists
          // as an optional peer dependency to this package. The unusual `require` statement is needed
          // to bypass webpack and ensure that the dev server does not get bundled.
          eval('require').main.require('pwa-kit-dev/ssr/server/build-dev-server').DevServerFactory

    // The runtime is a JavaScript object.
    // Sometimes the runtime APIs are invoked directly as express middlewares.
    // In order to make sure the "this" keyword always have the correct context,
    // we bind every single method to have the context of the object itself
    const boundRuntime = {...runtime}
    for (const property of Object.keys(boundRuntime)) {
        if (typeof boundRuntime[property] === 'function') {
            boundRuntime[property] = boundRuntime[property].bind(boundRuntime)
        }
    }

    return boundRuntime
}
