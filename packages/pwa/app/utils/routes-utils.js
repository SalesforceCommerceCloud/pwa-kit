/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {HOME_HREF} from '../constants'
import {getUrlsConfig, urlsConfigValidator} from './utils'
import {urlParamTypes} from '../constants'

/**
 * Modify the routes to add extra dynamic params to each route based on urls configuration
 * @param {array }routes - array of routes
 * @param {array} excludes - array of paths that do need to be modified
 */
export const routesModifier = (routes, excludes = []) => {
    const urlsConfig = getUrlsConfig()
    if (!urlsConfigValidator(urlsConfig, Object.values(urlParamTypes))) return routes
    if (!urlsConfig) return routes
    if (!routes.length) return []
    return routes.map(({path, ...rest}) => {
        if (path === HOME_HREF || path === '*' || excludes.includes(path)) return {path, ...rest}
        let tempPathSegment = []

        Object.keys(urlsConfig).forEach((key) => {
            if (urlsConfig[key] === urlParamTypes.PATH) {
                tempPathSegment.push(`:${key}`)
            }
        })
        return {
            path: `${tempPathSegment.length ? `/${tempPathSegment.join('/')}` : ''}${path}`,
            ...rest
        }
    })
}
