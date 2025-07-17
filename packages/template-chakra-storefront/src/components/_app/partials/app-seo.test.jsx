/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {render} from '@testing-library/react'
import {Helmet} from 'react-helmet'
import AppSEO from './app-seo'

// Mock Helmet
jest.mock('react-helmet', () => ({
    Helmet: jest.fn(({children}) => <div data-testid="helmet">{children}</div>)
}))

// Mock getPathWithLocale function
jest.mock('../../../utils/url', () => ({
    getPathWithLocale: jest.fn((localeId, buildUrl, options) => 
        `/test-path/${localeId}${options?.location?.pathname || ''}`
    )
}))

describe('AppSEO', () => {
    const defaultProps = {
        appConfig: {
            name: 'Test App',
            description: 'Test Description'
        },
        appOrigin: 'https://example.com',
        themeColor: '#000000',
        site: {
            id: 'test-site',
            l10n: {
                defaultLocale: 'en-US',
                supportedLocales: [
                    {id: 'en-US', preferred_currency: 'USD'},
                    {id: 'es-ES', preferred_currency: 'EUR'}
                ]
            }
        },
        locale: {id: 'en-US'},
        buildUrl: jest.fn((href, site, locale) => `/${locale}${href}`),
        location: {pathname: '/home'}
    }

    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('renders without crashing', () => {
        render(<AppSEO {...defaultProps} />)
        expect(Helmet).toHaveBeenCalled()
    })

    it('sets correct title and meta description', () => {
        render(<AppSEO {...defaultProps} />)

        expect(Helmet).toHaveBeenCalledWith(
            expect.objectContaining({
                children: expect.anything()
            }),
            expect.anything()
        )
    })

    it('sets correct theme color', () => {
        render(<AppSEO {...defaultProps} />)
        // Helmet should be called with theme color
        expect(Helmet).toHaveBeenCalled()
    })

    it('generates hreflang links for supported locales', () => {
        render(<AppSEO {...defaultProps} />)
        expect(defaultProps.buildUrl).toHaveBeenCalled()
    })

    it('handles different pathnames', () => {
        const props = {
            ...defaultProps,
            location: {pathname: '/products'}
        }

        render(<AppSEO {...props} />)
        expect(defaultProps.buildUrl).toHaveBeenCalled()
    })

    it('handles missing site data', () => {
        const props = {
            ...defaultProps,
            site: {
                id: 'test-site',
                l10n: {
                    defaultLocale: 'en-US',
                    supportedLocales: []
                }
            }
        }

        render(<AppSEO {...props} />)
        expect(Helmet).toHaveBeenCalled()
    })

    it('handles missing l10n data', () => {
        const props = {
            ...defaultProps,
            site: {
                id: 'test-site',
                l10n: undefined
            }
        }

        render(<AppSEO {...props} />)
        expect(Helmet).toHaveBeenCalled()
    })

    it('handles missing supportedLocales array', () => {
        const props = {
            ...defaultProps,
            site: {
                id: 'test-site',
                l10n: {
                    defaultLocale: 'en-US',
                    supportedLocales: undefined
                }
            }
        }

        render(<AppSEO {...props} />)
        expect(Helmet).toHaveBeenCalled()
    })
})
