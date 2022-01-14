/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'

import {configureRoutes} from './routes-utils'
import {getConfig} from './utils'

jest.mock('./utils', () => {
    const original = jest.requireActual('./utils')
    return {
        ...original,
        getConfig: jest.fn()
    }
})

describe('configureRoutes', function() {
    test('should return all permutation of path including site and locales ', () => {
        getConfig.mockImplementation(() => mockConfig.app.hosts)
        const CompA = () => <div>This is component A</div>
        const CompC = () => <div>This is component C</div>

        const routes = [
            {
                path: '/',
                component: CompA,
                exact: true
            },
            {
                path: '/category/:categoryId',
                component: CompC,
                exact: true
            }
        ]
        const configuredRoutes = configureRoutes(routes, {ignoredRoutes: '/'})
        expect(configuredRoutes[configuredRoutes.length - 1].path).toEqual('/category/:categoryId')
        expect(configuredRoutes.length).toEqual(85)
        const paths = configuredRoutes.map((route) => route.path)
        expect(paths).toEqual(expectedPathsResult)
    })
})

const expectedPathsResult = [
    '/',
    '/RefArch/en-US/category/:categoryId',
    '/RefArch/en/category/:categoryId',
    '/RefArch/fr-FR/category/:categoryId',
    '/RefArch/fr/category/:categoryId',
    '/RefArch/it-IT/category/:categoryId',
    '/RefArch/it/category/:categoryId',
    '/RefArch/en-HK/category/:categoryId',
    '/RefArch/en-GB/category/:categoryId',
    '/RefArch/uk/category/:categoryId',
    '/RefArch/de-DE/category/:categoryId',
    '/RefArch/de/category/:categoryId',
    '/us/en-US/category/:categoryId',
    '/us/en/category/:categoryId',
    '/us/fr-FR/category/:categoryId',
    '/us/fr/category/:categoryId',
    '/us/it-IT/category/:categoryId',
    '/us/it/category/:categoryId',
    '/us/en-HK/category/:categoryId',
    '/us/en-GB/category/:categoryId',
    '/us/uk/category/:categoryId',
    '/us/de-DE/category/:categoryId',
    '/us/de/category/:categoryId',
    '/eu/en-US/category/:categoryId',
    '/eu/en/category/:categoryId',
    '/eu/fr-FR/category/:categoryId',
    '/eu/fr/category/:categoryId',
    '/eu/it-IT/category/:categoryId',
    '/eu/it/category/:categoryId',
    '/eu/en-HK/category/:categoryId',
    '/eu/en-GB/category/:categoryId',
    '/eu/uk/category/:categoryId',
    '/eu/de-DE/category/:categoryId',
    '/eu/de/category/:categoryId',
    '/RefArchGlobal/en-US/category/:categoryId',
    '/RefArchGlobal/en/category/:categoryId',
    '/RefArchGlobal/fr-FR/category/:categoryId',
    '/RefArchGlobal/fr/category/:categoryId',
    '/RefArchGlobal/it-IT/category/:categoryId',
    '/RefArchGlobal/it/category/:categoryId',
    '/RefArchGlobal/en-HK/category/:categoryId',
    '/RefArchGlobal/en-GB/category/:categoryId',
    '/RefArchGlobal/uk/category/:categoryId',
    '/RefArchGlobal/de-DE/category/:categoryId',
    '/RefArchGlobal/de/category/:categoryId',
    '/global/en-US/category/:categoryId',
    '/global/en/category/:categoryId',
    '/global/fr-FR/category/:categoryId',
    '/global/fr/category/:categoryId',
    '/global/it-IT/category/:categoryId',
    '/global/it/category/:categoryId',
    '/global/en-HK/category/:categoryId',
    '/global/en-GB/category/:categoryId',
    '/global/uk/category/:categoryId',
    '/global/de-DE/category/:categoryId',
    '/global/de/category/:categoryId',
    '/site-de/en-US/category/:categoryId',
    '/site-de/en/category/:categoryId',
    '/site-de/fr-FR/category/:categoryId',
    '/site-de/fr/category/:categoryId',
    '/site-de/it-IT/category/:categoryId',
    '/site-de/it/category/:categoryId',
    '/site-de/en-HK/category/:categoryId',
    '/site-de/en-GB/category/:categoryId',
    '/site-de/uk/category/:categoryId',
    '/site-de/de-DE/category/:categoryId',
    '/site-de/de/category/:categoryId',
    '/RefArch/category/:categoryId',
    '/us/category/:categoryId',
    '/eu/category/:categoryId',
    '/RefArchGlobal/category/:categoryId',
    '/global/category/:categoryId',
    '/site-de/category/:categoryId',
    '/en-US/category/:categoryId',
    '/en/category/:categoryId',
    '/fr-FR/category/:categoryId',
    '/fr/category/:categoryId',
    '/it-IT/category/:categoryId',
    '/it/category/:categoryId',
    '/en-HK/category/:categoryId',
    '/en-GB/category/:categoryId',
    '/uk/category/:categoryId',
    '/de-DE/category/:categoryId',
    '/de/category/:categoryId',
    '/category/:categoryId'
]
const mockConfig = {
    app: {
        defaultSite: 'RefArch',
        url: {
            site: 'none',
            locale: 'none'
        },
        hosts: [
            {
                domain: 'www.domain-1.com',
                defaultSite: 'RefArch',
                sites: [
                    {
                        id: 'RefArch',
                        alias: 'us',
                        l10n: {
                            supportedCurrencies: ['USD'],
                            defaultCurrency: 'USD',
                            defaultLocale: 'en-US',
                            supportedLocales: [
                                {
                                    id: 'en-US',
                                    alias: 'en',
                                    preferredCurrency: 'USD'
                                }
                            ]
                        }
                    },
                    {
                        id: 'RefArch',
                        alias: 'eu',
                        l10n: {
                            supportedCurrencies: ['USD'],
                            defaultCurrency: 'USD',
                            supportedLocales: [
                                {
                                    id: 'fr-FR',
                                    alias: 'fr',
                                    preferredCurrency: 'USD'
                                },
                                {
                                    id: 'it-IT',
                                    alias: 'it',
                                    preferredCurrency: 'USD'
                                }
                            ]
                        }
                    },
                    {
                        id: 'RefArch',
                        defaultLocale: 'en-US',
                        l10n: {
                            supportedCurrencies: ['USD'],
                            defaultCurrency: 'USD',
                            supportedLocales: [
                                {
                                    id: 'en-US',
                                    preferredCurrency: 'USD'
                                },
                                {
                                    id: 'en-HK',
                                    preferredCurrency: 'HKD'
                                }
                            ],
                            defaultLocale: 'en-US'
                        }
                    },
                    {
                        id: 'RefArchGlobal',
                        alias: 'global',
                        l10n: {
                            supportedCurrencies: ['GBP', 'EUR'],
                            defaultCurrency: 'GBP',
                            supportedLocales: [
                                {
                                    id: 'en-GB',
                                    alias: 'uk',
                                    preferredCurrency: 'GBP'
                                },
                                {
                                    id: 'fr-FR',
                                    alias: 'fr',
                                    preferredCurrency: 'EUR'
                                }
                            ]
                        }
                    }
                ]
            },
            {
                domain: 'www.domain-2.com',
                defaultSite: 'site-de',
                sites: [
                    {
                        id: 'site-de',
                        l10n: {
                            supportedCurrencies: ['EUR'],
                            defaultCurrency: 'EUR',
                            defaultLocale: 'de-DE',
                            supportedLocales: [
                                {
                                    id: 'de-DE',
                                    alias: 'de',
                                    preferredCurrency: 'EUR'
                                }
                            ]
                        }
                    }
                ]
            }
        ]
    }
}
