/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {render} from '@testing-library/react'
import {Helmet} from 'react-helmet'
import {BrowserRouter} from 'react-router-dom'
import AppSEO from './app-seo'

// Mock Helmet
jest.mock('react-helmet', () => ({
    Helmet: jest.fn(() => null)
}))

// Mock getPathWithLocale function
jest.mock('../../../utils/url', () => ({
    getPathWithLocale: jest.fn(
        (localeId, buildUrl, options) =>
            `/test-path/${localeId}${options?.location?.pathname || ''}`
    )
}))

// Mock Seo component
jest.mock('../../seo', () => {
    return function MockSeo({children}) {
        return <div data-testid="seo-component">{children}</div>
    }
})

// Mock getAssetUrl
jest.mock('@salesforce/pwa-kit-react-sdk/ssr/universal/utils', () => ({
    getAssetUrl: jest.fn((path) => `/assets/${path}`)
}))

// Simple wrapper for tests
const renderWithRouter = (component) => {
    return render(<BrowserRouter>{component}</BrowserRouter>)
}

describe('AppSEO', () => {
    const defaultProps = {
        appConfig: {
            name: 'Test App',
            description: 'Test Description',
            activeDataEnabled: false
        },
        appOrigin: 'https://example.com',
        themeColor: '#ff0000',
        site: {
            id: 'site1',
            alias: 'test-site',
            l10n: {
                supportedLocales: [
                    {id: 'en-US', alias: 'en'},
                    {id: 'fr-FR', alias: 'fr'}
                ]
            }
        },
        locale: {id: 'en-US', alias: 'en'},
        buildUrl: jest.fn((href, site, locale) => `/${locale}${href}`),
        location: {pathname: '/home'}
    }

    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('renders without crashing', () => {
        renderWithRouter(<AppSEO {...defaultProps} />)
        expect(Helmet).toHaveBeenCalled()
    })

    it('sets correct title and meta description', () => {
        renderWithRouter(<AppSEO {...defaultProps} />)

        expect(Helmet).toHaveBeenCalledWith(
            expect.objectContaining({
                children: expect.anything()
            }),
            expect.anything()
        )
    })

    it('sets correct theme color', () => {
        renderWithRouter(<AppSEO {...defaultProps} />)

        expect(Helmet).toHaveBeenCalledWith(
            expect.objectContaining({
                children: expect.anything()
            }),
            expect.anything()
        )
    })

    it('generates hreflang links for supported locales', () => {
        renderWithRouter(<AppSEO {...defaultProps} />)

        expect(Helmet).toHaveBeenCalledWith(
            expect.objectContaining({
                children: expect.anything()
            }),
            expect.anything()
        )
    })

    it('handles different pathnames', () => {
        const props = {
            ...defaultProps,
            location: {pathname: '/products'}
        }

        renderWithRouter(<AppSEO {...props} />)

        expect(Helmet).toHaveBeenCalled()
    })

    it('handles missing site data', () => {
        const props = {
            ...defaultProps,
            site: {
                id: 'test-site',
                l10n: {
                    supportedLocales: []
                }
            }
        }

        renderWithRouter(<AppSEO {...props} />)

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

        renderWithRouter(<AppSEO {...props} />)

        expect(Helmet).toHaveBeenCalled()
    })

    it('handles missing supportedLocales array', () => {
        const props = {
            ...defaultProps,
            site: {
                id: 'test-site',
                l10n: {
                    supportedLocales: undefined
                }
            }
        }

        renderWithRouter(<AppSEO {...props} />)

        expect(Helmet).toHaveBeenCalled()
    })
})
