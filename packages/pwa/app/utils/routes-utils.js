/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {getSites} from './site-utils'

/**
 * Return all the permutations of routes with site id/alias and locale id/alias
 *
 * @param {array} routes - array of routes to be configured
 * @param {object} - a custom configured object
 * @return {array} - list of configured route objects
 */
export const configureRoutes = (routes = [], {ignoredRoutes = []}) => {
    if (!routes.length) return []

    const allSites = getSites()

    // get a collection of all site-id and site alias from the config of the current host
    // remove any duplicates by using [...new Set([])]
    const sites = [
        ...new Set(
            allSites
                ?.reduce((res, site) => {
                    return [...res, site.alias, site.id]
                }, [])
                .filter(Boolean)
        )
    ]
    // get a collection of all locale-id and locale alias from the config of the current host
    // remove any duplicates by using [...new Set([])]
    const locales = [
        ...new Set(
            allSites
                .reduce((res, {l10n}) => {
                    l10n.supportedLocales.forEach((locale) => {
                        res = [...res, locale.alias, locale.id]
                    })
                    return res
                }, [])
                .filter(Boolean)
        )
    ]

    let outputRoutes = []
    for (let i = 0; i < routes.length; i++) {
        const {path, ...rest} = routes[i]
        if (ignoredRoutes.includes(path)) {
            outputRoutes.push(routes[i])
        } else {
            // construct all the routes that has both site and locale
            sites.forEach((site) => {
                locales.forEach((locale) => {
                    const newRoute = `/${site}/${locale}${path}`
                    outputRoutes.push({
                        path: newRoute,
                        ...rest
                    })
                })
            })

            // construct the routes that only has site id or alias
            sites.forEach((site) => {
                outputRoutes.push({
                    path: `/${site}${path}`,
                    ...rest
                })
            })

            // construct the routes that only has locale id or alias
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
