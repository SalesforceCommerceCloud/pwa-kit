/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {getConfig} from 'pwa-kit-react-sdk/ssr/universal/utils'
import {getParamsFromPath} from './utils'
import {absoluteUrl} from './url'

/**
 * This functions takes an url and returns a site object,
 * an error will be thrown if no url is passed in or no site is found
 * @param {string} url
 * @returns {object} site - a site object
 */
export const resolveSiteFromUrl = (url) => {
    if (!url) {
        throw new Error('url is required to find a site object.')
    }
    const {pathname, search} = absoluteUrl(url)
    const path = `${pathname}${search}`
    let site

    const {siteRef} = getParamsFromPath(path)
    const sites = getSites()

    // get the site identifier from the url
    // step 1: look for the site based on the site identifier (id or alias) from the url
    site = sites.find((site) => site.id === siteRef || site.alias === siteRef)
    if (site) {
        return site
    }

    //Step 2: if step 1 does not work, use the defaultSite value to get the default site
    site = getDefaultSite()
    // Step 3: throw an error if site can't be found by any of the above steps
    if (!site) {
        throw new Error(
            "Can't find a matching default site. Please check your sites configuration."
        )
    }
    return site
}

/**
 * Returns the default site based on the defaultSite value from the app config
 * @returns {object} site - a site object from app config
 */
export const getDefaultSite = () => {
    const {app} = getConfig()
    const sites = getSites()

    if (sites.length === 1) {
        return sites[0]
    }

    return sites.find((site) => site.id === app.defaultSite)
}

/**
 * Return the list of sites that has included their respective aliases
 * @return {array} sites - site list including their aliases
 */
export const getSites = () => {
    const {sites = [], siteAliases = {}} = getConfig().app || {}

    if (!sites.length) {
        throw new Error("Can't find any sites from the config. Please check your configuration")
    }

    return sites.map((site) => {
        const alias = siteAliases[site.id]
        return {
            ...site,
            ...(alias ? {alias} : {})
        }
    })
}
