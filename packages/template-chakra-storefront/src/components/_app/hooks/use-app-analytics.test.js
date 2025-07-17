/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/* eslint-disable @typescript-eslint/no-var-requires */

import {renderHook} from '@testing-library/react'
import {useAppAnalytics} from './use-app-analytics'

// Mock analytics dependencies
jest.mock('../../../utils/analytics', () => ({
    setAnalyticsConfig: jest.fn(),
    trackPageView: jest.fn()
}))

jest.mock('react-router-dom', () => ({
    useLocation: jest.fn(() => ({
        pathname: '/home',
        search: '',
        hash: ''
    }))
}))

describe('useAppAnalytics', () => {
    const mockSiteId = 'RefArch'
    const mockLocaleId = 'en-US'
    const mockCurrency = 'USD'

    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('sets up analytics configuration on mount', () => {
        const {setAnalyticsConfig} = require('../../../utils/analytics')

        renderHook(() => useAppAnalytics(mockSiteId, mockLocaleId, mockCurrency))

        expect(setAnalyticsConfig).toHaveBeenCalledWith({
            siteId: mockSiteId,
            localeId: mockLocaleId,
            currency: mockCurrency
        })
    })

    it('tracks page view on location change', () => {
        const {trackPageView} = require('../../../utils/analytics')
        const {useLocation} = require('react-router-dom')

        const {rerender} = renderHook(() => useAppAnalytics(mockSiteId, mockLocaleId, mockCurrency))

        // Change location
        useLocation.mockReturnValue({
            pathname: '/products',
            search: '?category=mens',
            hash: '#top'
        })

        rerender()

        expect(trackPageView).toHaveBeenCalledWith('/products?category=mens#top')
    })

    it('handles missing analytics dependencies gracefully', () => {
        // Mock missing analytics functions
        jest.doMock('../../../utils/analytics', () => ({}))

        expect(() => {
            renderHook(() => useAppAnalytics(mockSiteId, mockLocaleId, mockCurrency))
        }).not.toThrow()
    })

    it('updates config when parameters change', () => {
        const {setAnalyticsConfig} = require('../../../utils/analytics')

        const {rerender} = renderHook(
            ({siteId, localeId, currency}) => useAppAnalytics(siteId, localeId, currency),
            {
                initialProps: {
                    siteId: mockSiteId,
                    localeId: mockLocaleId,
                    currency: mockCurrency
                }
            }
        )

        // Change parameters
        rerender({
            siteId: 'NewSite',
            localeId: 'fr-FR',
            currency: 'EUR'
        })

        expect(setAnalyticsConfig).toHaveBeenCalledWith({
            siteId: 'NewSite',
            localeId: 'fr-FR',
            currency: 'EUR'
        })
    })

    it('handles undefined parameters', () => {
        const {setAnalyticsConfig} = require('../../../utils/analytics')

        renderHook(() => useAppAnalytics(undefined, undefined, undefined))

        expect(setAnalyticsConfig).toHaveBeenCalledWith({
            siteId: undefined,
            localeId: undefined,
            currency: undefined
        })
    })

    it('tracks multiple page views', () => {
        const {trackPageView} = require('../../../utils/analytics')
        const {useLocation} = require('react-router-dom')

        const {rerender} = renderHook(() => useAppAnalytics(mockSiteId, mockLocaleId, mockCurrency))

        // First location change
        useLocation.mockReturnValue({
            pathname: '/products',
            search: '',
            hash: ''
        })
        rerender()

        // Second location change
        useLocation.mockReturnValue({
            pathname: '/cart',
            search: '',
            hash: ''
        })
        rerender()

        expect(trackPageView).toHaveBeenCalledTimes(2)
        expect(trackPageView).toHaveBeenNthCalledWith(1, '/products')
        expect(trackPageView).toHaveBeenNthCalledWith(2, '/cart')
    })
})
