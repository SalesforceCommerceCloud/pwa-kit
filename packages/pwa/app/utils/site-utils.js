/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {getConfig} from './utils'
import {getAppOrigin} from 'pwa-kit-react-sdk/utils/url'
import {resolveConfigFromUrl} from './url-config'

/**
 * This functions takes an url and returns a site object,
 * an error will be thrown if no url is passed in or no site is found
 * @param {string} url
 * @returns {object}
 */
export const resolveSiteFromUrl = (url) => {
    if (!url) {
        throw new Error('url is required to find a site object.')
    }
    const {hostname, pathname, search} = new URL(url)
    const path = `${pathname}${search}`
    // get all the sites from a specific hostname
    const siteMaps = getSiteMapsByHost(hostname)
    let site

    // Step 1: look for the site based on a hostname,
    // if that host only contains one site, use it
    // otherwise, we need to use another way to determine the site
    site = getSiteByHostname(hostname)
    if (site) {
        return site
    }

    // Step 2: As using hostname is not unique enough to determine the site
    // we will use the pathname to look further into the sites of current hostname
    site = getSiteByPath(path, siteMaps)

    if (site) {
        return site
    }

    // Step 3: use the default for the current host as none of the above works
    site = getDefaultSite()
    // Step 4: throw an error if site can't be found by any of the above steps
    if (!site) {
        throw new Error("Can't find any site. Please check you sites configuration.")
    }
    return site
}

export const getDefaultSiteIdByHost = (hostname) => {
    const hosts = getHosts()
    const host = hosts.find((host) => host.domain.includes(hostname))
    return host?.defaultSite
}

export const getDefaultSite = () => {
    const {hostname} = new URL(getAppOrigin())
    const defaultSiteId = getDefaultSiteIdByHost(hostname)

    return getSiteById(defaultSiteId)
}

export const getDefaultLocale = () => {
    const defaultSite = getDefaultSite()
    return defaultSite.l10n.supportedLocales.find(
        (locale) => locale.id === defaultSite.l10n.defaultLocale
    )
}

/**
 * This function goes over the default site and group id and alias of site and locale into their own value list
 */
export const getDefaultSiteValues = () => {
    const defaultSite = getDefaultSite()
    const defaultLocale = getDefaultLocale()
    return {
        defaultLocaleVal: [defaultLocale.id, defaultLocale.alias],
        defaultSiteVal: [defaultSite.id, defaultSite.alias]
    }
}
/**
 * Get the site based on the given hostname
 * If there is only one site in that host, use that
 * Otherwise, return undefined
 * @param {string} hostname
 * @returns {string} site
 */
export const getSiteByHostname = (hostname) => {
    const siteMaps = getSiteMapsByHost(hostname)
    if (!siteMaps || !siteMaps.length)
        throw new Error('No site config found. Please check you configuration')

    return siteMaps?.length === 1 ? getSiteById(siteMaps[0].id) : undefined
}

/**
 * get the site by looking for the site value (either site id or alias) from the url
 * @param {string} path
 * @param  {array} sites
 * @returns {object|undefined}
 */
export const getSiteByPath = (path, sites) => {
    // extract the site from the url
    const {site: currentSite} = resolveConfigFromUrl(path)
    if (!currentSite) return

    if (!sites || !sites.length)
        throw new Error('No site config found. Please check you configuration')
    // look for the site that has the currentSite
    const siteMap = sites.find((site) => site.id === currentSite || site.alias === currentSite)
    if (siteMap) {
        return getSiteById(siteMap.id)
    }
}

/**
 * Return all the siteMaps based on a hostname
 * @param hostname - input hostname to look for the sites
 * @returns {object|undefined}
 */
export const getSiteMapsByHost = (hostname) => {
    if (!hostname) return
    const hosts = getHosts()
    const sites = hosts.find((host) => host.domain.includes(hostname))?.siteMaps
    return sites
}

/**
 * Get the hosts config from pwa-kit.config.json
 * @returns {array} - list of hosts
 */
export const getHosts = () => getConfig('app.routing.hosts')

/**
 * this function takes an id,
 * and use it to look up a site data at multiple places (id, alias, locales etc)
 * from the config and return site as a single object
 * @param id - site id to look from
 * @return {object} - a site object
 * @example getSiteById('RefArch')
 *
 * //returns
 * {
 *   id: 'RefArch',
 *   alias: 'us'
 *   l10n: {
 *      "supportedCurrencies": ["USD"],
 *      "defaultCurrency": "USD",
 *      "defaultLocale": "en-US",
 *      "supportedLocales": [
 *          {
 *               "id": "en-US",
 *               "alias": "en",
 *               "preferredCurrency": "USD"
 *            },
 *           {
 *               "id": "en-CA",
 *               "alias": "ca",
 *               "preferredCurrency": "USD"
 *          }
 *      ]
 *   }
 * }
 */
export const getSiteById = (id) => {
    const {hostname} = new URL(getAppOrigin())
    const siteMaps = getSiteMapsByHost(hostname)
    const siteMap = siteMaps.find((site) => site.id === id)
    const site = {...siteMap, l10n: {...getConfig(`app.sites.${id}`)}}
    return site
}
