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
 * @param locale
 * @param siteId
 * @returns {string}
 */
export const getLocaleAndSiteBasePath = (locale, siteId) => {
    const urlConfig = getUrlConfig()
    const paths = []
    const localeReplacement = urlConfig['locale']
    if (localeReplacement === urlParamTypes.PATH && locale) {
        paths.push(locale)
    }

    const siteIdReplacement = urlConfig['siteId']
    if (siteIdReplacement === urlParamTypes.PATH && siteId) {
        paths.push(siteId)
    }

    return `${paths.length ? `/${paths.join('/')}` : ''}`
}
