/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {getConfig} from './utils'
/**
 * Configure the routes based on url configuration from pwa-kit.config.json file
 *
 * @param {array} routes - array of routes to be configured
 * @param {object} - a custom configured object
 * @return {array} - list of configured route objects
 */
export const configureRoutes = (routes = [], {ignoredRoutes = []}) => {
    if (!routes.length) return []
    // const urlConfig = getConfig('app.url')
    // if (!urlConfig) return routes

    // console.log('getAppOrigin()', getAppOrigin())
    // const hostsConfig = getConfig('app.hosts')
    // const {hostname} = new URL(getAppOrigin())

    // const urlConfig = hostsConfig.filter((host) => host.domain === hostname)
    // console.log('urlConfig', urlConfig)

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
            sites.forEach((site) => {
                locales.forEach((locale) => {
                    const newRoute = `/${site}/${locale}${path}`
                    outputRoutes.push({
                        path: newRoute,
                        ...rest
                    })
                })
            })
        }
    }

    // reconstruct the routes that either has site or locale
    // these routes has to go after the above routes to be able to respect the matching logic of react router dom
    for (let i = 0; i < routes.length; i++) {
        const {path, ...rest} = routes[i]

        if (ignoredRoutes.includes(path)) {
            const isRouteExisted = outputRoutes.map((route) => route.path).includes(path)
            if (!isRouteExisted) {
                outputRoutes.push(routes[i])
            }
        } else {
            sites.forEach((site) => {
                outputRoutes.push({
                    path: `/${site}${path}`,
                    ...rest
                })
            })
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
    console.log('test', outputRoutes.length, outputRoutes.map((i) => i.path))
    return outputRoutes
    // return routes.map((route) => {
    //     const {path, ...rest} = route
    //     if (ignoredRoutes.includes(path)) return route
    //     let basePathSegments = []
    //
    //     const options = ['site', 'locale']
    //
    //     options.forEach((option) => {
    //         const position = urlConfig[option]
    //         if (position === urlPartPositions.PATH) {
    //             basePathSegments.push(`:${option}`)
    //         }
    //     })
    //
    //     return {
    //         path: `${basePathSegments.length ? `/${basePathSegments.join('/')}` : ''}${path}`,
    //         ...rest
    //     }
    // })
}
