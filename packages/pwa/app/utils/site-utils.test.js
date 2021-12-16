/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {resolveSiteFromUrl} from './site-utils'

import {getConfig} from './utils'

jest.mock('./utils', () => {
    const original = jest.requireActual('./utils')
    return {
        ...original,
        getConfig: jest.fn()
    }
})

beforeEach(() => {
    jest.resetModules()
})

describe('resolveSiteFromUrl', function() {
    test('throw an error without an arg', () => {
        expect(() => {
            resolveSiteFromUrl()
        }).toThrow()
    })

    test('return site object from the url', () => {
        getConfig.mockImplementation(() => ({
            ...mockConfig
        }))

        const result = resolveSiteFromUrl('https://www.example-site.com/us/en-US/women/dress')
        expect(result.id).toEqual('site-1')
    })

    test('return site object based on hostname', () => {
        getConfig.mockImplementation(() => ({
            app: {
                defaultSiteId: 'site-1',
                sites: [
                    {
                        id: 'site-1',
                        hostnames: ['https://www.example-site-1.com']
                    },
                    {
                        id: 'site-2',
                        hostnames: ['https://www.example-site-2.com']
                    }
                ]
            }
        }))

        const site1 = resolveSiteFromUrl('https://www.example-site-1.com/women/dress')
        expect(site1.id).toEqual('site-1')

        const site2 = resolveSiteFromUrl('https://www.example-site-2.com/women/dress')
        expect(site2.id).toEqual('site-2')
    })

    test('return site object based using default value', () => {
        getConfig.mockImplementation(() => ({
            app: {
                defaultSiteId: 'site-1',
                sites: [
                    {
                        id: 'site-1',
                        alias: 'us'
                    },
                    {
                        id: 'site-2',
                        alias: 'uk'
                    }
                ]
            }
        }))

        const site1 = resolveSiteFromUrl('https://www.example-site.com/')
        expect(site1.id).toEqual('site-1')
    })

    test('throw an error when no site can be found', () => {
        getConfig.mockImplementation(() => ({
            app: {
                defaultSiteId: 'site-3',
                sites: [
                    {
                        id: 'site-1',
                        alias: 'us'
                    },
                    {
                        id: 'site-2',
                        alias: 'uk'
                    }
                ]
            }
        }))

        expect(() => {
            resolveSiteFromUrl('https://www.example-site.com/')
        }).toThrow
    })
})

const mockConfig = {
    app: {
        defaultSiteId: 'site-1',
        sites: [
            {
                id: 'site-1',
                alias: 'us',
                l10n: {
                    supportedCurrencies: ['USD'],
                    defaultCurrency: 'USD',
                    supportedLocales: [
                        {
                            id: 'en-US',
                            preferredCurrency: 'USD'
                        },
                        {
                            id: 'en-CA',
                            preferredCurrency: 'USD'
                        }
                    ],
                    defaultLocale: 'en-US'
                }
            },
            {
                id: 'site-2',
                alias: 'uk',
                l10n: {
                    supportedCurrencies: ['GBP', 'EUR'],
                    defaultCurrency: 'GBP',
                    supportedLocales: [
                        {
                            id: 'en-GB',
                            preferredCurrency: 'GBP'
                        },
                        {
                            id: 'fr-FR',
                            preferredCurrency: 'EUR'
                        }
                    ],
                    defaultLocale: 'en-GB'
                }
            }
        ]
    }
}
