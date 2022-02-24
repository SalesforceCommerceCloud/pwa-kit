/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {getConfig, getUrlConfig} from './utils'
import {getParamsFromPath} from './utils'
import {commerceAPIConfig} from '../api.config'
/**
 * This functions takes an url and returns a site object,
 * an error will be thrown if no url is passed in or no site is found
 * @param {string} url
 * @returns {object}
 */
export const resolveSiteFromUrl = (url) => {
    const urlConfig = getUrlConfig()

    if (!url) {
        throw new Error('url is required to find a site object.')
    }
    const sites = getSites()
    const {pathname, search} = new URL(url)
    const path = `${pathname}${search}`
    let site

    // get the site identifier from the url
    const {site: currentSite} = getParamsFromPath(path, urlConfig)
    // step 1: look for the site based on the site identifier (id or alias) from the url
    site = sites.find((site) => site.id === currentSite || site.alias === currentSite)
    if (site) {
        return site
    }

    //Step 2: if step 1 does not work, use the default value to get the default site
    site = getDefaultSite()
    // Step 3: throw an error if site can't be found by any of the above steps
    if (!site) {
        throw new Error("Can't find any site. Please check you sites configuration.")
    }
    return site
}

/**
 * get the default site
 * @returns {object} - default site object
 */
export const getDefaultSite = () => {
    const {app} = getConfig()
    const sites = getSites()
    if (!sites) {
        throw new Error("Can't find any sites in the config. Please check your configuration")
    }

    if (sites.length === 1) {
        return sites[0]
    }

    // use the commerceAPIConfig.parameters.siteId as a fallback value if default site is not defined or set upt correctly
    return sites.find(
        (site) => site.id === app.defaultSite || site.id === commerceAPIConfig.parameters.siteId
    )
}

/**
 * Ret
 * @return {array} - site list including their aliases
 */
export const getSites = () => {
    const {app} = getConfig()
    if (!app.sites) {
        throw new Error("Can't find any sites from the config. Please check your configuration")
    }
    return app.sites.map((site) => {
        return {
            ...site,
            alias: app.siteAliases[site.id]
        }
    })
}
