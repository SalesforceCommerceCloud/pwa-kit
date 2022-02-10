/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {getConfig} from './utils'
import {getParamsFromPath} from './utils'
/**
 * This functions takes an url and returns a site object,
 * an error will be thrown if no url is passed in or no site is found
 * @param {string} url
 * @returns {object}
 */
/**
 * This functions takes an url and returns a site object,
 * an error will be thrown if no url is passed in or no site is found
 * @param {string} url
 * @returns {object}
 */
export const resolveSiteFromUrl = (url) => {
    const config = getConfig()
    console.log('resolveSiteFromUrl', config)
    if (!url) {
        throw new Error('url is required to find a site object.')
    }
    const {pathname, search} = new URL(url)
    const path = `${pathname}${search}`
    let site

    // get the site identifier from the url
    const {site: currentSite} = getParamsFromPath(path, config.url)

    // step 1: look for the site based on the site identifier (id or alias) from the url
    site =
        config.sites &&
        config.sites.find((site) => site.id === currentSite || site.alias === currentSite)
    if (site) {
        return site
    }

    //if step 1 does not work, use the default value to get the default site
    site = getDefaultSite()
    console.log('default site', site)
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
    const config = getConfig()
    return config.sites && config.sites.find((site) => site.id === config.defaultSite)
}

/**
 * This function returns all the identifiers
 * for locale and site from a given config
 * @return {object} - default identifiers (id and alias) of site and locale
 */
export const getDefaultIdentifiers = () => {
    const defaultSite = getDefaultSite()
    const defaultLocale =
        defaultSite.l10n &&
        defaultSite.l10n.supportedLocales.find(
            (locale) => locale.id === defaultSite.l10n.defaultLocale
        )
    return {
        defaultLocales: [defaultLocale.id, defaultLocale?.alias],
        defaultSites: [defaultSite.id, defaultSite?.alias]
    }
}
