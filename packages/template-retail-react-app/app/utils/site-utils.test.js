/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {getDefaultSite, getSites} from './site-utils'
import {getConfig} from 'pwa-kit-runtime/utils/ssr-config'

import mockConfig from '../../config/mocks/default'
jest.mock('pwa-kit-runtime/utils/ssr-config', () => {
    const original = jest.requireActual('pwa-kit-react-sdk/ssr/universal/utils')
    return {
        ...original,
        getConfig: jest.fn()
    }
})

beforeEach(() => {
    jest.resetModules()
})

afterEach(() => {
    jest.resetAllMocks()
})

describe('getDefaultSite', function () {
    test('returns expected default site when there is only one site in the site list', () => {
        const siteMock = {
            id: 'site-a',
            l10n: {
                defaultLocale: 'en-GB',
                supportedLocales: [
                    {
                        id: 'en-GB',
                        preferredCurrency: 'GBP'
                    },
                    {
                        id: 'fr-FR',
                        alias: 'fr',
                        preferredCurrency: 'EUR'
                    },
                    {
                        id: 'it-IT',
                        preferredCurrency: 'EUR'
                    }
                ]
            }
        }
        getConfig.mockReturnValue({
            app: {
                ...mockConfig.app,
                sites: [siteMock]
            }
        })

        const defaultSite = getDefaultSite()
        expect(defaultSite).toEqual(siteMock)
    })

    test('returns site-2 as the default site according to the config', () => {
        getConfig.mockReturnValue({
            app: {
                ...mockConfig.app,
                defaultSite: 'site-2'
            }
        })

        const expectedRes = {
            alias: 'us',
            id: 'site-2',
            l10n: {
                defaultLocale: 'en-US',
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
                ]
            }
        }

        const defaultSite = getDefaultSite()
        expect(defaultSite).toEqual(expectedRes)
    })
})

describe('getSites', function () {
    test('returns site list with alias', () => {
        getConfig.mockReturnValue(mockConfig)
        const sites = getSites()
        const expectedRes = [
            {
                id: 'site-1',
                alias: 'uk',
                l10n: {
                    defaultLocale: 'en-GB',
                    defaultCurrency: 'GBP',
                    supportedLocales: [
                        {
                            id: 'en-GB',
                            preferredCurrency: 'GBP'
                        },
                        {
                            id: 'fr-FR',
                            alias: 'fr',
                            preferredCurrency: 'EUR'
                        },
                        {
                            id: 'it-IT',
                            preferredCurrency: 'EUR'
                        }
                    ]
                }
            },
            {
                id: 'site-2',
                alias: 'us',
                l10n: {
                    defaultLocale: 'en-US',
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
                    ]
                }
            }
        ]
        expect(sites).toEqual(expectedRes)
    })

    test('throw error when there is no sites in the config', () => {
        getConfig.mockReturnValue({
            ...mockConfig.app,
            sites: []
        })

        expect(() => getSites()).toThrow()
    })
})
