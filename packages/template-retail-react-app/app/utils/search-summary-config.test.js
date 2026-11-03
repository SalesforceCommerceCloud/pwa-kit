/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {
    getSearchSummaryConfig,
    hasSearchSummarySite,
    searchSummaryImageSources
} from '@salesforce/retail-react-app/app/utils/search-summary-config'

const config = (settings = {}, sites = [{id: 'shop-a'}, {id: 'shop-b'}]) => ({
    app: {defaultSite: 'shop-a', searchSummary: settings, sites}
})
test('defaults leave existing storefronts unchanged; strings cannot accidentally enable the feature', () => {
    expect(hasSearchSummarySite(config())).toBe(false)
    expect(getSearchSummaryConfig(config({enabled: 'true'}), 'shop-a').enabled).toBe(false)
    expect(getSearchSummaryConfig(config(), 'shop-a').homeHero.enabled).toBe(false)
})
test('global defaults and nested per-site overrides stay independent between customers', () => {
    const c = config(
        {enabled: true, followUps: true, homeHero: {enabled: true, title: 'Discover'}},
        [
            {
                id: 'shop-a',
                alias: 'a',
                searchSummary: {title: 'Shop A', homeHero: {imageUrl: 'https://cdn.example/a.jpg'}}
            },
            {
                id: 'shop-b',
                searchSummary: {enabled: false, followUps: false, homeHero: {title: 'Shop B'}}
            }
        ]
    )
    expect(getSearchSummaryConfig(c, 'a')).toMatchObject({
        enabled: true,
        title: 'Shop A',
        homeHero: {title: 'Discover'}
    })
    expect(getSearchSummaryConfig(c, 'shop-b')).toMatchObject({
        enabled: false,
        followUps: false,
        homeHero: {title: 'Shop B', imageUrl: ''}
    })
    expect(getSearchSummaryConfig(c).title).toBe('Shop A')
    expect(hasSearchSummarySite(c)).toBe(true)
    expect(c.app.searchSummary.homeHero).not.toHaveProperty('imageUrl')
})
test('only valid configured hero image origins reach CSP; malformed URLs cannot break startup', () => {
    const c = config(
        {enabled: true, homeHero: {enabled: true, imageUrl: 'https://cdn.example/hero.jpg'}},
        [
            {id: 'shop-a'},
            {
                id: 'shop-b',
                searchSummary: {
                    enabled: false,
                    homeHero: {imageUrl: 'https://disabled.example/hero.jpg'}
                }
            }
        ]
    )
    expect(searchSummaryImageSources(c)).toEqual(['https://cdn.example'])
    for (const imageUrl of [
        'https://',
        'javascript:alert(1)',
        '//evil.example/a',
        '/\\evil.example/a',
        'https://user:pass@cdn.example/a'
    ]) {
        expect(getSearchSummaryConfig(config({homeHero: {imageUrl}})).homeHero.imageUrl).toBe('')
    }
    expect(
        getSearchSummaryConfig(config({homeHero: {imageUrl: '/static/hero.jpg'}})).homeHero.imageUrl
    ).toBe('/static/hero.jpg')
})
test('suggested searches are bounded public configuration, not fixed customer queries', () => {
    const c = config({
        homeHero: {
            suggestedSearches: [
                null,
                {label: 'Bad'},
                ...Array.from({length: 10}, (_, i) => ({
                    label: `Category ${i}`,
                    query: `query ${i}`
                }))
            ]
        }
    })
    expect(getSearchSummaryConfig(c).homeHero.suggestedSearches).toHaveLength(6)
})
