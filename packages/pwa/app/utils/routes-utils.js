/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {getDefaultSite, getSites} from './site-utils'
import {urlPartPositions} from '../constants'

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
    const defaultSite = getDefaultSite()
    if (!allSites) return routes

    let outputRoutes = []
    for (let i = 0; i < routes.length; i++) {
        const {path, ...rest} = routes[i]

        if (ignoredRoutes.includes(path)) {
            outputRoutes.push(routes[i])
        } else {
            const showDefaults = urlConfig.showDefaults
            const defaultSites = [defaultSite.id, defaultSite.alias]
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
                const defaultLocaleId = site.l10n.defaultLocale
                const defaultLocaleAlias = site.l10n.supportedLocales.find(
                    (locale) => locale.alias === defaultLocaleId
                )
                const allDefaults = [...defaultSites, defaultLocaleAlias, defaultLocaleId].filter(
                    Boolean
                )
                const {locale: localePosition, site: sitePosition} = urlConfig

                if (
                    localePosition === urlPartPositions.PATH &&
                    sitePosition === urlPartPositions.PATH
                ) {
                    // construct all the routes that has both site and locale
                    siteRefs.forEach((site) => {
                        localeRefs.forEach((locale) => {
                            const siteIdentifier =
                                !showDefaults && allDefaults.includes(site) ? '' : `/${site}`
                            const localeIdentifier =
                                !showDefaults && allDefaults.includes(locale) ? '' : `/${locale}`
                            const newRoute = `${siteIdentifier}${localeIdentifier}${path}`
                            outputRoutes.push({
                                path: newRoute,
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
                        const siteIdentifier =
                            !showDefaults && allDefaults.includes(site) ? '' : `/${site}`
                        outputRoutes.push({
                            path: `${siteIdentifier}${path}`,
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
                        const localeIdentifier =
                            !showDefaults && allDefaults.includes(locale) ? '' : `/${locale}`
                        outputRoutes.push({
                            path: `${localeIdentifier}${path}`,
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
