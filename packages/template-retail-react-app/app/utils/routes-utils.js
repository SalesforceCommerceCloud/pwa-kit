/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {getSites} from '@salesforce/retail-react-app/app/utils/site-utils'
import {urlPartPositions} from '@salesforce/retail-react-app/app/constants'

/**
 * Build regex patterns for site and locale route parameters.
 * Creates patterns like "siteA|siteB|siteC" from all valid site/locale refs.
 *
 * @param {array} allSites - array of site configurations
 * @returns {object} - { sitePattern, localePattern }
 */
const buildRoutePatterns = (allSites) => {
    const siteRefs = allSites.flatMap((site) => [site.alias, site.id]).filter(Boolean)

    const localeRefs = allSites
        .flatMap((site) => site.l10n.supportedLocales)
        .flatMap((locale) => [locale.alias, locale.id])
        .filter(Boolean)

    // Remove duplicates and join into regex pattern
    const sitePattern = [...new Set(siteRefs)].join('|')
    const localePattern = [...new Set(localeRefs)].join('|')

    return {sitePattern, localePattern}
}

/**
 * Configure routes using parameterized paths with regex constraints.
 * This approach generates fewer routes by using patterns like:
 *   /:site(siteA|siteB)/:locale(en|fr)/path
 *
 * Note: This may match site/locale combinations that aren't valid together
 * (e.g., a locale not supported by a specific site). Runtime validation
 * should be performed after route matching.
 *
 * @param {array} routes - array of routes to be reconstructed
 * @param {object} urlConfig - url configuration with site/locale positions
 * @param {array} allSites - array of site configurations
 * @param {array} ignoredRoutes - routes that should not be reconstructed
 * @returns {array} - list of parameterized route objects
 */
const configureRoutesWithFuzzyMatching = (routes, urlConfig, allSites, ignoredRoutes) => {
    const {sitePattern, localePattern} = buildRoutePatterns(allSites)
    const {locale: localePosition, site: sitePosition} = urlConfig

    const outputRoutes = []

    for (const route of routes) {
        const {path, ...rest} = route

        if (ignoredRoutes.includes(path)) {
            outputRoutes.push(route)
            continue
        }

        if (localePosition === urlPartPositions.PATH && sitePosition === urlPartPositions.PATH) {
            // Both site and locale in path
            outputRoutes.push({
                path: `/:site(${sitePattern})/:locale(${localePattern})${path}`,
                ...rest
            })
        } else if (sitePosition === urlPartPositions.PATH) {
            // Site only in path
            outputRoutes.push({
                path: `/:site(${sitePattern})${path}`,
                ...rest
            })
        } else if (localePosition === urlPartPositions.PATH) {
            // Locale only in path
            outputRoutes.push({
                path: `/:locale(${localePattern})${path}`,
                ...rest
            })
        }

        // Original route as fallback
        outputRoutes.push(route)
    }

    return outputRoutes
}

/**
 * Configure routes using explicit paths for each site/locale combination.
 * This is the original approach that generates literal routes like:
 *   /siteA/en/path, /siteA/fr/path, /siteB/en/path, etc.
 *
 * @param {array} routes - array of routes to be reconstructed
 * @param {object} urlConfig - url configuration with site/locale positions
 * @param {array} allSites - array of site configurations
 * @param {array} ignoredRoutes - routes that should not be reconstructed
 * @returns {array} - list of explicit route objects
 */
const configureRoutesWithExplicitMatching = (routes, urlConfig, allSites, ignoredRoutes) => {
    const {locale: localePosition, site: sitePosition} = urlConfig

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

/**
 * Construct routes based on url config with site and locale references
 * (ids and aliases) from each site in your application config.
 *
 * @param {array} routes - array of routes to be reconstructed
 * @param {object} config - application configuration
 * @param {object} options - options if there are any
 * @param {array} options.ignoredRoutes - routes that should not be reconstructed
 * @param {boolean} options.fuzzyPathMatching - when true, uses parameterized routes with
 *        regex constraints (e.g., /:site(a|b)/:locale(en|fr)/path) for fewer, more efficient
 *        route configurations. When false (default), generates explicit routes for each
 *        site/locale combination. Fuzzy matching may match invalid site/locale combinations
 *        that require runtime validation.
 * @returns {array} - list of route objects with site and locale refs
 */
export const configureRoutes = (
    routes = [],
    config,
    {ignoredRoutes = [], fuzzyPathMatching = false}
) => {
    if (!routes.length) return []
    if (!config) return routes

    let outputRoutes = []
    const {url: urlConfig} = config.app

    const allSites = getSites()
    if (!allSites) return routes

    if (fuzzyPathMatching) {
        outputRoutes = configureRoutesWithFuzzyMatching(routes, urlConfig, allSites, ignoredRoutes)
    } else {
        outputRoutes = configureRoutesWithExplicitMatching(
            routes,
            urlConfig,
            allSites,
            ignoredRoutes
        )
    }

    return outputRoutes
}
