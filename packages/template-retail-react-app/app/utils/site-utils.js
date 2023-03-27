/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {getConfig} from 'pwa-kit-runtime/utils/ssr-config'

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
 * @return {array} sites - list of sites including their aliases
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

/**
 * Given a site reference, return the site object
 * @param siteRef - site reference to look for the site object
 * @returns {object | undefined} found site object or default site object
 */
export const getSiteByReference = (siteRef) => {
    const defaultSite = getDefaultSite()
    const sites = getSites()

    return (
        sites.find((site) => {
            return site.alias === siteRef || site.id === siteRef
        }) || defaultSite
    )
}
