/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/* eslint-disable @typescript-eslint/no-var-requires */

import React from 'react'
import {renderHook} from '@testing-library/react'
import {ChakraProvider} from '@chakra-ui/react'
import {BrowserRouter} from 'react-router-dom'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {useAppLocalization} from './use-app-localization'
import theme from '../../../theme'

// Create a test QueryClient
const createTestQueryClient = () =>
    new QueryClient({
        defaultOptions: {
            queries: {
                retry: false
            }
        }
    })

// Create wrapper for all providers
const wrapper = ({children}) => {
    const queryClient = createTestQueryClient()
    return (
        <BrowserRouter>
            <QueryClientProvider client={queryClient}>
                <ChakraProvider value={theme}>{children}</ChakraProvider>
            </QueryClientProvider>
        </BrowserRouter>
    )
}

// Mock dependencies
const mockBuildUrlWithAppOrigin = jest.fn(
    (origin, href, site, locale) => `${origin}/${locale}${href}`
)

jest.mock('../../../utils/utils', () => ({
    buildUrlWithAppOrigin: mockBuildUrlWithAppOrigin
}))

jest.mock('../../../hooks/use-app-origin', () => ({
    useAppOrigin: jest.fn(() => 'https://example.com')
}))

jest.mock('../../../hooks/use-multi-site', () => ({
    __esModule: true,
    default: jest.fn(() => ({
        site: {
            id: 'RefArch',
            alias: 'test-site',
            l10n: {
                defaultCurrency: 'USD'
            }
        },
        locale: {
            id: 'en-US',
            preferredCurrency: 'USD'
        },
        buildUrl: jest.fn((href) => `/test${href}`)
    }))
}))

// Mock React Query to return mock messages data
jest.mock('../../../utils/locale', () => ({
    getTargetLocale: jest.fn(() => 'en-US')
}))

jest.mock('@tanstack/react-query', () => ({
    ...jest.requireActual('@tanstack/react-query'),
    useQuery: jest.fn(() => ({
        data: {
            'common.welcome': 'Welcome',
            'common.hello': 'Hello'
        }
    }))
}))

jest.mock('@salesforce/commerce-sdk-react', () => ({
    useShopperCustomersQuery: jest.fn(() => ({
        locale: 'en-US',
        currency: 'USD'
    }))
}))

// Mock window location
Object.defineProperty(window, 'location', {
    value: {
        origin: 'https://example.com'
    },
    writable: true
})

describe('useAppLocalization', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockBuildUrlWithAppOrigin.mockClear()
    })

    it('returns localization data correctly', () => {
        const {result} = renderHook(() => useAppLocalization(), {wrapper})

        expect(result.current).toMatchObject({
            targetLocale: 'en-US',
            messages: expect.any(Object),
            site: expect.objectContaining({
                id: 'RefArch'
            }),
            locale: expect.objectContaining({
                id: 'en-US'
            }),
            buildUrl: expect.any(Function),
            currency: 'USD',
            appOrigin: 'https://example.com'
        })
    })

    it('builds URLs correctly', () => {
        const useMultiSite = require('../../../hooks/use-multi-site').default
        const mockBuildUrl = jest.fn()
        useMultiSite.mockReturnValueOnce({
            site: {
                id: 'RefArch',
                alias: 'test-site',
                l10n: {
                    defaultCurrency: 'USD'
                }
            },
            locale: {
                id: 'en-US',
                preferredCurrency: 'USD'
            },
            buildUrl: mockBuildUrl
        })

        const {result} = renderHook(() => useAppLocalization(), {wrapper})

        const testHref = '/test-page'
        result.current.buildUrl(testHref)

        // Should call the buildUrl function from useMultiSite
        expect(mockBuildUrl).toHaveBeenCalledWith(testHref)
    })

    it('handles missing window origin', () => {
        // Temporarily remove window.location.origin
        const originalOrigin = window.location.origin
        delete window.location.origin

        const {result} = renderHook(() => useAppLocalization(), {wrapper})

        expect(result.current.appOrigin).toBeDefined()

        // Restore original value
        window.location.origin = originalOrigin
    })

    it('uses correct target locale', () => {
        const {getTargetLocale} = require('../../../utils/locale')
        getTargetLocale.mockReturnValue('fr-FR')

        const {result} = renderHook(() => useAppLocalization(), {wrapper})

        expect(result.current.targetLocale).toBe('fr-FR')
    })

    it('handles different currencies', () => {
        const useMultiSite = require('../../../hooks/use-multi-site').default
        useMultiSite.mockReturnValueOnce({
            site: {
                id: 'RefArch',
                alias: 'test-site',
                l10n: {
                    defaultCurrency: 'EUR'
                }
            },
            locale: {
                id: 'en-US',
                preferredCurrency: 'EUR'
            },
            buildUrl: jest.fn((href) => `/test${href}`)
        })

        const {result} = renderHook(() => useAppLocalization(), {wrapper})

        expect(result.current.currency).toBe('EUR')
    })
})
