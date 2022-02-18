/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {resolveSiteFromUrl} from './site-utils'

import mockConfig from '../../config/mocks/default.json'

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
        // getConfig.mockImplementation(() => mockConfig)
        const result = resolveSiteFromUrl('https://www.example-site.com/us/en-US/women/dress')
        expect(result.id).toEqual('site-2')
    })

    test('return default site for home page', () => {
        // getConfig.mockImplementation(() => mockConfig)
        const result = resolveSiteFromUrl('https://www.example-site.com/')
        expect(result.id).toEqual('site-1')
    })

    test('throw an error when no site can be found', () => {
        // Mock the the `default` cofig to the window global
        delete window.__CONFIG__
        Object.defineProperty(window, '__CONFIG__', {
            value: {
                ...mockConfig,
                app: {
                    ...mockConfig.app,
                    defaultSite: 'site-3'
                }
            }
        })

        expect(() => {
            resolveSiteFromUrl('https://www.example-site.com/site-3')
        }).toThrow()
    })
})
