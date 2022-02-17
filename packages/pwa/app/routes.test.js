/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import routes from './routes'
jest.mock('./utils/site-utils', () => {
    const original = jest.requireActual('./utils/site-utils')
    return {
        ...original,
        // have to explicitly return literal value here, can't use reference from mockConfigData
        getSites: jest.fn(() => [
            {
                id: 'site-1',
                l10n: {
                    defaultLocale: 'en-GB',
                    supportedLocales: [
                        {
                            id: 'en-GB',
                            alias: 'en-uk',
                            preferredCurrency: 'GBP'
                        },
                        {
                            id: 'fr-FR',
                            alias: 'fr',
                            preferredCurrency: 'EUR'
                        }
                    ]
                }
            },
            {
                id: 'site-2',
                l10n: {
                    defaultLocale: 'en-US',
                    supportedLocales: [
                        {
                            id: 'en-US',
                            preferredCurrency: 'USD'
                        }
                    ]
                }
            }
        ])
    }
})
describe('Routes', () => {
    test('exports a valid react-router configuration', () => {
        expect(Array.isArray(routes)).toBe(true)
    })
})
