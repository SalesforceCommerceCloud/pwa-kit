/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import {absoluteUrl} from '@salesforce/retail-react-app/app/utils/url'

/**
 * This functions takes an url and returns a site object,
 * an error will be thrown if no url is passed in or no site is found
 * @param {string} url
 * @returns {object} site - a site object
 */
export const resolveSiteFromUrl = (url) => {
    if (!url) {
        throw new Error('URL is required to find a site object.')
    }
    const {pathname, search} = new URL(absoluteUrl(url))
    const path = `${pathname}${search}`
    let site

    // get the site identifier from the url
    const {siteRef} = getParamsFromPath(path)
    const sites = getSites()

    // step 1: use the siteRef to look for the site from the sites in the app config
    // since alias is optional, make sure it is defined before the equality check
    site = sites.find((site) => site.id === siteRef || (site.alias && site.alias === siteRef))
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

/**
 * This function return the identifiers (site and locale) from the given url
 * The site will always go before locale if both of them are presented in the pathname
 * @param path {string}
 * @returns {{siteRef: string, localeRef: string}} - site and locale reference (it could either be id or alias)
 */
export const getParamsFromPath = (path) => {
    const {pathname, search} = new URL(absoluteUrl(path))

    const config = getConfig()
    const {pathMatcher, searchMatcherForSite, searchMatcherForLocale} = getConfigMatcher(config)
    const pathMatch = pathname.match(pathMatcher)
    const searchMatchForSite = search.match(searchMatcherForSite)
    const searchMatchForLocale = search.match(searchMatcherForLocale)

    // the value can only either in the path or search query param, there will be no overridden
    const siteRef = pathMatch?.groups.site || searchMatchForSite?.groups.site

    const localeRef = pathMatch?.groups.locale || searchMatchForLocale?.groups.locale
    return {siteRef, localeRef}
}

/**
 * This function returns the url config from the current configuration
 * @return {object} - url config
 */
export const getUrlConfig = () => {
    const {app} = getConfig()
    if (!app.url) {
        throw new Error('Cannot find `url` key. Please check your configuration file.')
    }
    return app.url
}

/**
 * Given your application's configuration this function returns a set of regular expressions used to match the site
 * and locale references from an url.
 * @param config
 * @return {{searchMatcherForSite: RegExp, searchMatcherForLocale: RegExp, pathMatcher: RegExp}}
 */
export const getConfigMatcher = (config) => {
    if (!config) {
        throw new Error('Config is not defined.')
    }

    const allSites = getSites()
    const siteIds = []
    const siteAliases = []
    const localesIds = []
    const localeAliases = []
    allSites.forEach((site) => {
        siteAliases.push(site.alias)
        siteIds.push(site.id)
        const {l10n} = site
        l10n.supportedLocales.forEach((locale) => {
            localesIds.push(locale.id)
            localeAliases.push(locale.alias)
        })
    })
    const sites = [...siteIds, ...siteAliases].filter(Boolean)
    const locales = [...localesIds, ...localeAliases].filter(Boolean)

    // prettier-ignore
    const searchPatternForSite = `site=(?<site>${sites.join('|')})`
    // prettier-ignore
    // eslint-disable-next-line
    const pathPattern = `(?:\/(?<site>${sites.join('|')}))?(?:\/(?<locale>${locales.join("|")}))?(?!\\w)`
    // prettier-ignore
    const searchPatternForLocale = `locale=(?<locale>${locales.join('|')})`
    const pathMatcher = new RegExp(pathPattern)
    const searchMatcherForSite = new RegExp(searchPatternForSite)
    const searchMatcherForLocale = new RegExp(searchPatternForLocale)
    return {
        pathMatcher,
        searchMatcherForSite,
        searchMatcherForLocale
    }
}

/**
 * Given a site and a locale reference, return the locale object
 * @param site - site to look for the locale
 * @param localeRef - the locale ref to look for in site supported locales
 * @return {object|undefined}
 */
export const getLocaleByReference = (site, localeRef) => {
    if (!site) {
        throw new Error('Site is not defined. It is required to look for locale object')
    }
    return site.l10n.supportedLocales.find(
        (locale) => locale.id === localeRef || locale.alias === localeRef
    )
}

/**
 * Determine the locale object from an url
 * If the localeRef is not found from the url, set it to default locale of the current site
 * and use it to find the locale object
 *
 * @param url
 * @return {Object} locale object
 */
export const resolveLocaleFromUrl = (url) => {
    if (!url) {
        throw new Error('URL is required to look for the locale object')
    }
    let {localeRef} = getParamsFromPath(url)
    const site = resolveSiteFromUrl(url)
    const {supportedLocales} = site.l10n
    // if no localeRef is found, use the default value of the current site
    if (!localeRef) {
        localeRef = site.l10n.defaultLocale
    }
    const locale = supportedLocales.find(
        (locale) => locale.alias === localeRef || locale.id === localeRef
    )
    if (locale) {
        return locale
    }
    // if locale is not defined, use default locale as fallback value
    const defaultLocale = site.l10n.defaultLocale
    return supportedLocales.find(
        (locale) => locale.alias === defaultLocale || locale.id === defaultLocale
    )
}
