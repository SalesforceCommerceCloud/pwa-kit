/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {getConfig, getParamsFromUrl} from './utils'
import {JSONPath} from 'jsonpath-plus'
/**
 * This functions takes an url and returns a site object,
 * an error will be thrown if not url is passed in or no site is found
 * @param {string} url
 * @returns {object}
 */
export const resolveSiteFromUrl = (url) => {
    if (!url) {
        throw new Error('url is required to find a site object.')
    }
    const {hostname} = new URL(url)

    const sites = getSites()
    const defaultSiteId = getConfig('app.defaultSiteId')
    let site
    // Step 1: look for the site from the url, if found, return the site
    site = getSiteByUrl(url)
    if (site) {
        return site
    }

    // Step 2: look for the site from the hostname, if found, return it
    site = getSiteByHostname(hostname)

    if (site) {
        return site
    }

    // Step 3: use the default if none of above works
    site = sites.find((site) => site.id === defaultSiteId)

    // Step 4: throw an error if site can't be found by any of the above steps
    if (!site) {
        throw new Error("Can't find any site. Please check you sites configuration.")
    }
    return site
}

/**
 * Get the site Id based on the given hostname
 * @param {string} hostname
 * @returns {string} siteId
 */
export const getSiteByHostname = (hostname) => {
    const sites = getSites()

    if (!sites || !sites.length)
        throw new Error('No site config found. Please check you configuration')
    if (!hostname) return

    const site = JSONPath(`$[?(@.hostnames && @.hostnames.includes('${hostname}'))]`, sites)

    return site?.length === 1 ? site[0] : undefined
}

/**
 * get the site by looking for the site value (either site id or alias) from the url
 * @param url
 * @returns {object|undefined}
 */
export const getSiteByUrl = (url) => {
    const {site: currentSite} = getParamsFromUrl(url)
    if (!currentSite) return
    const sites = getSites()

    if (!sites || !sites.length)
        throw new Error('No site config found. Please check you configuration')

    const site = sites.find((site) => site.id === currentSite || site.alias === currentSite)
    return site
}

/**
 * Get the sites config from pwa-kit.config.json
 * @returns {array} - list of site objects
 */
export const getSites = () => getConfig('app.sites.*')
