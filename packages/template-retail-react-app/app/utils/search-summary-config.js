/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// Public configuration only. Gateway URLs, keys and OAuth credentials belong in server environment variables.
export const SEARCH_SUMMARY_DEFAULTS = {
    enabled: false,
    headerSearch: true,
    followUps: true,
    agentHandoff: false,
    title: 'Your AI shopping guide',
    searchPlaceholder: 'Search or ask AI…',
    homeHero: {
        enabled: false,
        eyebrow: 'AI-ASSISTED DISCOVERY',
        title: 'Find what you are looking for.',
        description: 'Explore products, compare your options, and ask a follow-up.',
        imageUrl: '',
        suggestedSearches: []
    }
}
export const storefrontSite = (config, siteId) =>
    (config.app.sites || []).find(
        (site) => site.id === (siteId || config.app.defaultSite) || site.alias === siteId
    )
const validHeroImage = (image) => {
    if (typeof image !== 'string') return ''
    // Relative assets must stay on this origin, including after URL normalization.
    if (/^\/(?!\/)/.test(image) && !image.includes('\\')) return image
    try {
        const url = new URL(image)
        return url.protocol === 'https:' && !url.username && !url.password ? url.href : ''
    } catch {
        return ''
    }
}
export function getSearchSummaryConfig(config, siteId) {
    const global = config.app.searchSummary || {}
    const local = storefrontSite(config, siteId)?.searchSummary || {}
    const merged = {
        ...SEARCH_SUMMARY_DEFAULTS,
        ...global,
        ...local,
        homeHero: {...SEARCH_SUMMARY_DEFAULTS.homeHero, ...global.homeHero, ...local.homeHero}
    }
    for (const flag of ['enabled', 'headerSearch', 'followUps', 'agentHandoff'])
        merged[flag] = merged[flag] === true
    merged.homeHero.enabled = merged.homeHero.enabled === true
    merged.homeHero.imageUrl = validHeroImage(merged.homeHero.imageUrl)
    for (const key of ['title', 'searchPlaceholder'])
        if (typeof merged[key] !== 'string') merged[key] = SEARCH_SUMMARY_DEFAULTS[key]
    for (const key of ['eyebrow', 'title', 'description'])
        if (typeof merged.homeHero[key] !== 'string')
            merged.homeHero[key] = SEARCH_SUMMARY_DEFAULTS.homeHero[key]
    merged.homeHero.suggestedSearches = (
        Array.isArray(merged.homeHero.suggestedSearches) ? merged.homeHero.suggestedSearches : []
    )
        .filter(
            (item) =>
                typeof item?.label === 'string' &&
                typeof item?.query === 'string' &&
                item.label.trim() &&
                item.query.trim() &&
                item.query.length <= 2000
        )
        .slice(0, 6)
    return merged
}
export const hasSearchSummarySite = (config) =>
    (config.app.sites || []).some((site) => getSearchSummaryConfig(config, site.id).enabled)

export function searchSummaryImageSources(config) {
    return [
        ...new Set(
            (config.app.sites || []).flatMap((site) => {
                const settings = getSearchSummaryConfig(config, site.id)
                return settings.enabled &&
                    settings.homeHero.enabled &&
                    settings.homeHero.imageUrl.startsWith('https://')
                    ? [new URL(settings.homeHero.imageUrl).origin]
                    : []
            })
        )
    ]
}
