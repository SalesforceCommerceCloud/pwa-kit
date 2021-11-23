/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {getUrlConfig} from './utils'
import {urlParamTypes} from '../constants'

/**
 * Modify the routes to url params to each route based on urls configuration
 * @param {array} routes - array of routes to be modified
 * @param {array} ignoredRoutes - list of array that do not need the modification
 */
export const modifyRoutesWithUrlConfig = (routes = [], ignoredRoutes = []) => {
    if (!routes.length) return []

    const urlConfig = getUrlConfig()
    if (!urlConfig) return routes

    return routes.map((route) => {
        const {path, ...rest} = route
        if (ignoredRoutes.includes(path)) return route
        let basePathSegments = []

        const localeParamType = urlConfig['locale']
        if (localeParamType === urlParamTypes.PATH) {
            basePathSegments.push(':locale')
        }
        const siteAliasParamType = urlConfig['siteAlias']
        if (siteAliasParamType === urlParamTypes.PATH) {
            basePathSegments.push(':siteAlias')
        }

        return {
            path: `${basePathSegments.length ? `/${basePathSegments.join('/')}` : ''}${path}`,
            ...rest
        }
    })
}
