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

    test('return site based on the site alias in the url', () => {
        getConfig.mockImplementation(() => mockConfig)
        const result = resolveSiteFromUrl('https://www.example-site.com/us/en-US/women/dress')
        expect(result.id).toEqual('site-2')
    })

    test('return site based on using default value', () => {
        getConfig.mockImplementation(() => mockConfig)

        const site1 = resolveSiteFromUrl('https://www.example-site.com/unknown-site/women')
        expect(site1.id).toEqual('site-1')
    })

    test('throw an error when no site can be found', () => {
        getConfig.mockImplementation(() => ({
            ...mockConfig,
            defaultSite: 'site-3'
        }))

        expect(() => {
            resolveSiteFromUrl('https://www.example-site.com/site-3')
        }).toThrow()
    })
})

const mockConfig = {
    url: {
        locale: 'path',
        site: 'path'
    },
    defaultSite: 'site-1',
    sites: [
        {
            id: 'site-1',
            alias: 'uk',
            l10n: {
                defaultLocale: 'en-GB',
                supportedLocales: [
                    {
                        id: 'en-GB',
                        alias: 'uk',
                        preferredCurrency: 'GBP'
                    }
                ]
            }
        },
        {
            id: 'site-2',
            alias: 'us',
            l10n: {
                defaultLocale: 'en-US',
                supportedLocales: [
                    {
                        id: 'en-US',
                        alias: 'us',
                        preferredCurrency: 'USD'
                    }
                ]
            }
        }
    ]
}
