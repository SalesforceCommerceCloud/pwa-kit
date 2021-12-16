/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {getConfig} from './utils'

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

    const {
        app: {defaultSiteId, sites: sitesConfig}
    } = getConfig()
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
    site = sitesConfig.find((site) => site.id === defaultSiteId)

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
    const {
        app: {sites: sitesConfig}
    } = getConfig()

    if (!sitesConfig.length) throw new Error('No site config found. Please check you configuration')
    if (!hostname) return undefined

    const site = sitesConfig.filter((site) => {
        return site?.hostnames?.some((i) => i.includes(hostname))
    })

    return site?.length === 1 ? site[0] : undefined
}

/**
 * get the site by looking for the site value (either site id or alias) from the url
 * @param url
 * @returns {object|undefined}
 */
export const getSiteByUrl = (url) => {
    const {siteIdsRegExp, siteAliasesRegExp} = getSitesRegExp()

    let site
    const aliasMatch = url.match(siteAliasesRegExp)
    const idMatch = url.match(siteIdsRegExp)
    if (aliasMatch) {
        // clean up any non-character
        const siteAlias = aliasMatch[0].replace(/\W/g, '')
        site = getSiteByAlias(siteAlias)
    } else if (idMatch) {
        // clean up any non-character
        const siteId = idMatch[0].replace(/\W/g, '')
        site = getSiteById(siteId)
    }
    return site
}

/**
 * return site by looking through site configuration array by site id
 * @param id - site Id
 * @returns {object|undefined}
 */
const getSiteById = (id) => {
    const {
        app: {sites}
    } = getConfig()
    if (!sites.length) return undefined
    if (!id) throw new Error('id is required')

    return sites.find((site) => site.id === id)
}

/**
 * return site by looking through site configuration array by the alias
 * @param alias - site alias
 * @returns {undefined|object}
 */
const getSiteByAlias = (alias) => {
    const {
        app: {sites}
    } = getConfig()
    if (!sites.length) return undefined
    if (!alias) throw new Error('alias is required')

    return sites.find((site) => site.alias === alias)
}

/**
 * A util to create RegExp for siteId and siteAlias based on site configuration from pwa-kit.config.json
 *
 * @example
 * sites: [{id: 'RefArchGlobal', alias: 'global', l10n: {...}}]
 *
 * getSitesRegExp()
 * // returns {
 *     siteIdsRegExp: /(=RefArchGlobal\b)|/(RefArchGlobal)/?/gi
 *     siteAliasRegExp: /(=global\b)|(/global/)?/gi
 * }
 *
 * @returns {object}
 */
export const getSitesRegExp = () => {
    const {
        app: {sites}
    } = getConfig()
    let idsRegExpPattern = []
    let aliasRegExpPattern = []

    sites.forEach((site) => {
        idsRegExpPattern.push(`(/${site.id}/?)`)
        idsRegExpPattern.push(`(=${site.id}\\b)`)
        aliasRegExpPattern.push(`(/${site.alias}/?)`)
        aliasRegExpPattern.push(`(=${site.alias}\\b)`)
    })
    const siteIdsRegExp = new RegExp(idsRegExpPattern.join('|'), 'g')
    const siteAliasesRegExp = new RegExp(aliasRegExpPattern.join('|'), 'g')
    return {
        siteIdsRegExp,
        siteAliasesRegExp
    }
}
