/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {getSites} from './site-utils'
import {urlPartPositions} from '../constants'
import {matchPath} from 'react-router-dom'

/**
 * Check if a path matches an array of routes.
 * @param path path that
 * @param routes
 * @returns {*}
 */
export const matchRoute = (path, routes) => {
    let match

    const isMatch = routes.some((_route) => {
        const _match = matchPath(path, _route)
        if (_match) {
            match = _match
        }
        return !!match
    })

    return isMatch
}

/**
 * Construct literal routes based on url config
 * with each site id/alias and locale id/alias pair from sites config
 *
 * @param {array} routes - array of routes to be configured
 * @param {object} urlConfig
 * @param {object} options
 * @param {array} options.ignoredRoutes - routes that does not need configured
 * @return {array} - list of configured route objects
 */
export const configureRoutes = (routes = [], urlConfig, {ignoredRoutes = []}) => {
    if (!routes.length) return []

    const allSites = getSites()
    if (!allSites) return routes

    let outputRoutes = []
    for (let i = 0; i < routes.length; i++) {
        const {path, ...rest} = routes[i]

        if (ignoredRoutes.includes(path)) {
            outputRoutes.push(routes[i])
        } else {
            allSites.forEach((site) => {
                // append site ids and aliases to an array
                const siteRefs = [site.alias, site.id].filter(Boolean)
                let localeRefs = []
                // append locale ids and aliases to an array
                site.l10n.supportedLocales.forEach((locale) => {
                    localeRefs.push(locale.alias)
                    localeRefs.push(locale.id)
                })
                localeRefs = localeRefs.filter(Boolean)
                const {locale: localePosition, site: sitePosition} = urlConfig

                if (
                    localePosition === urlPartPositions.PATH &&
                    sitePosition === urlPartPositions.PATH
                ) {
                    siteRefs.forEach((site) => {
                        // append the route that only has site
                        outputRoutes.push({
                            path: `/${site}${path}`,
                            ...rest
                        })
                        localeRefs.forEach((locale) => {
                            // app the route that has both site and locale
                            outputRoutes.push({
                                path: `/${site}/${locale}${path}`,
                                ...rest
                            })
                            // append the route that only has locale
                            outputRoutes.push({
                                path: `/${locale}${path}`,
                                ...rest
                            })
                        })
                    })
                }

                if (
                    localePosition !== urlPartPositions.PATH &&
                    sitePosition === urlPartPositions.PATH
                ) {
                    // construct the routes that only has site id or alias
                    siteRefs.forEach((site) => {
                        outputRoutes.push({
                            path: `/${site}${path}`,
                            ...rest
                        })
                    })
                }
                if (
                    localePosition === urlPartPositions.PATH &&
                    sitePosition !== urlPartPositions.PATH
                ) {
                    // construct the routes that only has locale id or alias
                    localeRefs.forEach((locale) => {
                        outputRoutes.push({
                            path: `/${locale}${path}`,
                            ...rest
                        })
                    })
                }
            })
            // origin route will be at the bottom
            outputRoutes.push(routes[i])
        }
    }
    // Remove any duplicate routes
    outputRoutes = outputRoutes.reduce((res, route) => {
        if (!res.some(({path}) => path === route.path)) {
            res.push(route)
        }
        return res
    }, [])
    return outputRoutes
}
