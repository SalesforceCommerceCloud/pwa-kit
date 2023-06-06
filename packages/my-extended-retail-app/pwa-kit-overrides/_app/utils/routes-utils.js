/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {getSites} from '@salesforce/retail-react-app/app/utils/site-utils'
import {urlPartPositions} from '@salesforce/retail-react-app/app/constants'

/**
 * Construct literal routes based on url config
 *      with site and locale references (ids and aliases) from each in your application config
 *
 * @param {array} routes - array of routes to be reconstructed
 * @param {object} urlConfig
 * @param {object} options - options if there are any
 * @param {array} options.ignoredRoutes - routes that does not need be reconstructed
 * @return {array} - list of routes objects that has site and locale refs
 */
export const configureRoutes = (routes = [], config, {ignoredRoutes = []}) => {
    if (!routes.length) return []
    if (!config) return routes

    const {url: urlConfig} = config.app

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
