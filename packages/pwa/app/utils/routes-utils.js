/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {getUrlConfig} from './utils'
import {urlParamTypes} from '../constants'

/**
 *  a function returns basePath string for locale/siteId/siteAlias
 *  by reading over the url config inside the pwa-kit-config.json file
 * @param configValues {object} - object contains values for prefixed url params
 * @returns {string}
 */
export const getBasePath = (configValues = {}) => {
    const urlConfig = getUrlConfig()
    const paths = []
    const {locale, siteId} = configValues
    const localePlacement = urlConfig['locale']
    if (localePlacement === urlParamTypes.PATH) {
        if (!locale) {
            throw new Error("Can't find the value of locale")
        }
        paths.push(locale)
    }

    const siteIdPlacement = urlConfig['siteId']
    if (siteIdPlacement === urlParamTypes.PATH) {
        if (!siteId) {
            throw new Error("Can' find the value of siteId")
        }
        paths.push(siteId)
    }

    return paths.length ? `/${paths.join('/')}` : ''
}
