/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {getConfig} from './utils'
/**
 * Return all the permutations of routes with site id/alias and locale id/alias
 *
 * @param {array} routes - array of routes to be configured
 * @param {object} - a custom configured object
 * @return {array} - list of configured route objects
 */
export const configureRoutes = (routes = [], {ignoredRoutes = []}) => {
    if (!routes.length) return []

    const hosts = getConfig('app.hosts')

    // collect and flatten the result so we can have a list of site objects
    const allSites = [].concat(...hosts.map((host) => host.sites))

    // get a collection of all site-id and site alias from the config
    // remove duplicates
    const sites = [
        ...new Set(
            allSites
                ?.reduce((res, site) => {
                    return [...res, site.id, site.alias]
                }, [])
                .filter(Boolean)
        )
    ]
    // get a collection of all locale-id and locale alias from the config
    // remove duplicates
    const locales = [
        ...new Set(
            allSites
                ?.reduce((res, site) => {
                    const {supportedLocales} = site.l10n
                    supportedLocales.forEach((locale) => {
                        res = [...res, locale.id, locale.alias]
                    })
                    return res
                }, [])
                .filter(Boolean)
        )
    ]
    let outputRoutes = []
    // reconstruct all the routes that has both site and locale
    for (let i = 0; i < routes.length; i++) {
        const {path, ...rest} = routes[i]
        if (ignoredRoutes.includes(path)) {
            outputRoutes.push(routes[i])
        } else {
            // construct the routes that has  both site and locale
            sites.forEach((site) => {
                locales.forEach((locale) => {
                    const newRoute = `/${site}/${locale}${path}`
                    outputRoutes.push({
                        path: newRoute,
                        ...rest
                    })
                })
            })

            // construct the routes that only has site
            sites.forEach((site) => {
                outputRoutes.push({
                    path: `/${site}${path}`,
                    ...rest
                })
            })

            // construct the routes that only has locale
            locales.forEach((locale) => {
                outputRoutes.push({
                    path: `/${locale}${path}`,
                    ...rest
                })
            })
            // origin route will be at the bottom
            outputRoutes.push(routes[i])
        }
    }
    return outputRoutes
}
