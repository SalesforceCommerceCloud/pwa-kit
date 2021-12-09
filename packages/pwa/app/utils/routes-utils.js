/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {getUrlConfig} from './utils'
import {urlPartPositions} from '../constants'

/**
 * Configure the routes based on url configuration from pwa-kit-config.json file
 *
 * @param {array} routes - array of routes to be configured
 * @param {object} - a custom configured object
 * @return {array} - list of configured route objects
 */
export const configureRoutes = (routes = [], {ignoredRoutes = []}) => {
    if (!routes.length) return []

    const urlConfig = getUrlConfig()
    if (!urlConfig) return routes

    return routes.map((route) => {
        const {path, ...rest} = route
        if (ignoredRoutes.includes(path)) return route
        let basePathSegments = []

        const options = ['locale']

        options.forEach((option) => {
            const position = urlConfig[option]
            if (position === urlPartPositions.PATH) {
                basePathSegments.push(`:${option}`)
            }
        })

        return {
            path: `${basePathSegments.length ? `/${basePathSegments.join('/')}` : ''}${path}`,
            ...rest
        }
    })
}
