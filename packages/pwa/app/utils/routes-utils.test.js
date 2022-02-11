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
    const env = process.env
    beforeEach(() => {
        jest.resetModules()
        process.env = {...env}
    })

    afterEach(() => {
        process.env = env
    })
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
    test('should return all permutation of path including site and locales ', () => {
        getConfig.mockImplementation(() => mockConfig)
        const configuredRoutes = configureRoutes(routes, {ignoredRoutes: ['/']})
        expect(configuredRoutes[configuredRoutes.length - 1].path).toEqual('/category/:categoryId')
        expect(configuredRoutes.length).toEqual(81)
        const paths = configuredRoutes.map((route) => route.path)
        expect(paths).toEqual(expectedPathsResult)
    })

    test('should return the origin routes', () => {
        getConfig.mockImplementation(() => mockConfig)
        const configuredRoutes = configureRoutes(routes, {
            ignoredRoutes: ['/', '/category/:categoryId']
        })
        expect(configuredRoutes.length).toEqual(2)
    })
})

const expectedPathsResult = [
    '/',
    '/site-1/en-US/category/:categoryId',
    '/site-1/en/category/:categoryId',
    '/site-1/fr-FR/category/:categoryId',
    '/site-1/fr/category/:categoryId',
    '/site-1/it-IT/category/:categoryId',
    '/site-1/it/category/:categoryId',
    '/site-1/en-HK/category/:categoryId',
    '/site-1/en-GB/category/:categoryId',
    '/site-1/uk/category/:categoryId',
    '/us/en-US/category/:categoryId',
    '/us/en/category/:categoryId',
    '/us/fr-FR/category/:categoryId',
    '/us/fr/category/:categoryId',
    '/us/it-IT/category/:categoryId',
    '/us/it/category/:categoryId',
    '/us/en-HK/category/:categoryId',
    '/us/en-GB/category/:categoryId',
    '/us/uk/category/:categoryId',
    '/site-2/en-US/category/:categoryId',
    '/site-2/en/category/:categoryId',
    '/site-2/fr-FR/category/:categoryId',
    '/site-2/fr/category/:categoryId',
    '/site-2/it-IT/category/:categoryId',
    '/site-2/it/category/:categoryId',
    '/site-2/en-HK/category/:categoryId',
    '/site-2/en-GB/category/:categoryId',
    '/site-2/uk/category/:categoryId',
    '/eu/en-US/category/:categoryId',
    '/eu/en/category/:categoryId',
    '/eu/fr-FR/category/:categoryId',
    '/eu/fr/category/:categoryId',
    '/eu/it-IT/category/:categoryId',
    '/eu/it/category/:categoryId',
    '/eu/en-HK/category/:categoryId',
    '/eu/en-GB/category/:categoryId',
    '/eu/uk/category/:categoryId',
    '/site-3/en-US/category/:categoryId',
    '/site-3/en/category/:categoryId',
    '/site-3/fr-FR/category/:categoryId',
    '/site-3/fr/category/:categoryId',
    '/site-3/it-IT/category/:categoryId',
    '/site-3/it/category/:categoryId',
    '/site-3/en-HK/category/:categoryId',
    '/site-3/en-GB/category/:categoryId',
    '/site-3/uk/category/:categoryId',
    '/site-4/en-US/category/:categoryId',
    '/site-4/en/category/:categoryId',
    '/site-4/fr-FR/category/:categoryId',
    '/site-4/fr/category/:categoryId',
    '/site-4/it-IT/category/:categoryId',
    '/site-4/it/category/:categoryId',
    '/site-4/en-HK/category/:categoryId',
    '/site-4/en-GB/category/:categoryId',
    '/site-4/uk/category/:categoryId',
    '/global/en-US/category/:categoryId',
    '/global/en/category/:categoryId',
    '/global/fr-FR/category/:categoryId',
    '/global/fr/category/:categoryId',
    '/global/it-IT/category/:categoryId',
    '/global/it/category/:categoryId',
    '/global/en-HK/category/:categoryId',
    '/global/en-GB/category/:categoryId',
    '/global/uk/category/:categoryId',
    '/site-1/category/:categoryId',
    '/us/category/:categoryId',
    '/site-2/category/:categoryId',
    '/eu/category/:categoryId',
    '/site-3/category/:categoryId',
    '/site-4/category/:categoryId',
    '/global/category/:categoryId',
    '/en-US/category/:categoryId',
    '/en/category/:categoryId',
    '/fr-FR/category/:categoryId',
    '/fr/category/:categoryId',
    '/it-IT/category/:categoryId',
    '/it/category/:categoryId',
    '/en-HK/category/:categoryId',
    '/en-GB/category/:categoryId',
    '/uk/category/:categoryId',
    '/category/:categoryId'
]
const mockConfig = {
    defaultSite: 'RefArch',
    url: {
        site: 'none',
        locale: 'none'
    },
    sites: [
        {
            id: 'site-1',
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
            id: 'site-2',
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
            id: 'site-3',
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
            id: 'site-4',
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
}
