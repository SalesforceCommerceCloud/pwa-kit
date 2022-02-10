/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {extractL10nFromSite, getConfig, getParamsFromPath} from './utils'
import {urlPartPositions} from '../constants'
import {rebuildPathWithParams} from './url'
import {getDefaultIdentifiers, getDefaultSite} from './site-utils'
/**
 * This function takes an url and return the site, locale and url configuration
 * For site, if a site is defined from the path, use the val to look for site obj from the config
 *    if not, use default site
 * For locale, if the locale is defined from path, use that val to find the locale object from config
 *    if not use the default val of the current site to find the locale object
 *
 * Adjust the logic here to fit your app scenario
 * @param {string} path - input path
 * @returns {Object} ConfigValue object
 */
export const resolveConfigFromUrl = async (path) => {
    const {url: urlConfig, sites} = await getConfig()

    const {site: currentSite, locale: currentLocale} = getParamsFromPath(path, urlConfig)
    // get the current site based on the site identifier (id or alias)
    // if it is undefined, use the default site
    const site =
        sites.find((site) => site.id === currentSite || site.alias === currentSite) ||
        (await getDefaultSite())
    const l10n = extractL10nFromSite(site)
    const defaultLocale = l10n.supportedLocales.find((locale) => locale.id === l10n.defaultLocale)
    // if a locale is found from supported locales based on currentLocale, use it,
    // otherwise, use default locale to identify the locale
    const supportedLocale = l10n.supportedLocales.find((locale) => locale.id === currentLocale)
    const locale = supportedLocale ? supportedLocale : defaultLocale
    return {
        site: site.alias || site.id,
        locale: locale.id,
        url: urlConfig
    }
}

/**
 * Rebuild the path with locale/site value to the path as url path or url query param
 * based on url config.
 * If the showDefault flag is set to false, the default value won't show up in the url
 * @param {string} relativeUrl - the base relative Url to be reconstructed on
 * @param {object} configValues - object that contains values of url param config
 * @param {object} opts - options
 * @return {string} - an output path that has locale and site
 *
 * @example
 * //pwa-kit.config.json
 * url {
 *    locale: {
 *        position: 'query_param',
 *        showDefault: true
 *    },
 *    site: {
 *        position: 'path',
 *        showDefault: false
 *    }
 * }
 *
 * // default locale: en-GB
 * // default site RefArch, alias us
 * buildPathWithUrlConfig('/women/dresses', {locale: 'en-GB', site: 'us', defaultLocale: 'en-GB'})
 * => /women/dresses?locale=en-GB
 * buildPathWithUrlConfig('/women/dresses', {locale: 'en-GB', site: 'global', defaultLocale: 'en-GB'})
 * => /global/women/dresses?locale=en-GB
 *
 */
export const buildPathWithUrlConfig = (relativeUrl, configValues = {}, opts = {}) => {
    const urlConfig = configValues.url
    const {disallowParams = []} = opts
    if (!Object.values(urlConfig).length) return relativeUrl
    if (!Object.values(configValues).length) return relativeUrl
    const [pathname, search] = relativeUrl.split('?')

    const params = new URLSearchParams(search)
    // Remove any disallowed params.
    if (disallowParams.length) {
        disallowParams.forEach((param) => {
            params.delete(param)
        })
    }

    const queryParams = {...Object.fromEntries(params)}
    let basePathSegments = []
    const showDefault = urlConfig.showDefault
    const {defaultLocaleVal, defaultSiteVal} = getDefaultIdentifiers()
    const options = ['site', 'locale']
    // if the showDefault is set to false, and when both locale and site are default values
    // then do not include them into the url
    if (
        defaultLocaleVal.includes(configValues.locale) &&
        defaultSiteVal.includes(configValues.site) &&
        !showDefault
    ) {
        return relativeUrl
    }
    options.forEach((option) => {
        const position = urlConfig[option]
        if (position === urlPartPositions.PATH) {
            // otherwise, append to the array to construct url later
            basePathSegments.push(configValues[option])
        } else if (position === urlPartPositions.QUERY_PARAM) {
            // otherwise, append to the query to construct url later
            queryParams[option] = configValues[option]
        }
    })
    // filter out falsy values in the array
    basePathSegments = basePathSegments.filter(Boolean)
    let updatedPath = `${
        basePathSegments.length ? `/${basePathSegments.join('/')}` : ''
    }${pathname}`
    // append the query param to pathname
    if (Object.keys(queryParams).length) {
        updatedPath = rebuildPathWithParams(updatedPath, queryParams)
    }
    return updatedPath
}

/**
 * a function to return url config from pwa config file
 * First, it will look for the url config based on the current host
 * If none is found, it will return the default url config at the top level of the config file
 */
export const getUrlConfig = () => {
    const {hostname} = new URL(getAppOrigin())
    const urlConfig = getUrlConfigByHostname(hostname)
    if (urlConfig) {
        return urlConfig
    }
    return getConfig('app.routing.url')
}

/**
 * Get the url config from pwa-kit.config.json based on a given hostname
 * @param {string} hostname
 * @returns {object|undefined} - url config from the input host
 */
export const getUrlConfigByHostname = (hostname) => {
    const hosts = getConfig('app.routing.hosts')
    const host = hosts.find((host) => host.domain.includes(hostname))
    return host?.url
}
