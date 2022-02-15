/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {getConfig, updateSitesWithAliases} from './utils'
import {getParamsFromPath} from './utils'
/**
 * This functions takes an url and returns a site object,
 * an error will be thrown if no url is passed in or no site is found
 * @param {string} url
 * @returns {object}
 */
export const resolveSiteFromUrl = (url) => {
    const {app} = getConfig()
    const sites = updateSitesWithAliases(app.sites, app.siteAliases)

    if (!url) {
        throw new Error('url is required to find a site object.')
    }

    if (!sites) {
        throw new Error("Can't find any sites in the config. Please check your configuration")
    }
    const {pathname, search} = new URL(url)
    const path = `${pathname}${search}`
    let site

    // get the site identifier from the url
    const {site: currentSite} = getParamsFromPath(path, app.url)
    // step 1: look for the site based on the site identifier (id or alias) from the url
    site = sites.find((site) => site.id === currentSite || site.alias === currentSite)
    if (site) {
        return site
    }

    //if step 1 does not work, use the default value to get the default site
    site = getDefaultSite()
    // Step 4: throw an error if site can't be found by any of the above steps
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
    const sites = updateSitesWithAliases(app.sites, app.siteAliases)
    if (!sites) {
        throw new Error("Can't find any sites in the config. Please check your configuration")
    }

    if (sites.length === 1) {
        return sites[0]
    }

    if (!app.defaultSite) {
        throw new Error(
            "Can't find defaultSite in the config. Please check your configuration file"
        )
    }
    return sites.find((site) => site.id === app.defaultSite)
}
