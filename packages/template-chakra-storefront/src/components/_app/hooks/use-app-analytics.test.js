/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/* eslint-disable @typescript-eslint/no-var-requires */

import {renderHook} from '@testing-library/react'
import {useAppAnalytics} from './use-app-analytics'

// Mock dependencies
jest.mock('../../../hooks/use-active-data', () =>
    jest.fn(() => ({
        trackPage: jest.fn()
    }))
)

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

    const mockUseActiveData = require('../../../hooks/use-active-data')
    const {useLocation} = require('react-router-dom')

    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('returns tracking utilities', () => {
        const {result} = renderHook(() => useAppAnalytics(mockSiteId, mockLocaleId, mockCurrency))

        expect(result.current).toEqual(
            expect.objectContaining({
                trackPage: expect.any(Function),
                activeData: expect.objectContaining({
                    trackPage: expect.any(Function)
                })
            })
        )
    })

    it('calls trackPage on mount', () => {
        const mockTrackPage = jest.fn()
        mockUseActiveData.mockReturnValue({
            trackPage: mockTrackPage
        })

        renderHook(() => useAppAnalytics(mockSiteId, mockLocaleId, mockCurrency))

        expect(mockTrackPage).toHaveBeenCalledWith(mockSiteId, mockLocaleId, mockCurrency)
    })

    it('calls trackPage when location changes', () => {
        const mockTrackPage = jest.fn()
        mockUseActiveData.mockReturnValue({
            trackPage: mockTrackPage
        })

        const {rerender} = renderHook(() => useAppAnalytics(mockSiteId, mockLocaleId, mockCurrency))

        // Clear initial call
        mockTrackPage.mockClear()

        // Change location
        useLocation.mockReturnValue({
            pathname: '/products',
            search: '?q=test',
            hash: ''
        })

        rerender()

        expect(mockTrackPage).toHaveBeenCalledWith(mockSiteId, mockLocaleId, mockCurrency)
    })

    it('handles missing activeData gracefully', () => {
        mockUseActiveData.mockReturnValue({})

        expect(() => {
            renderHook(() => useAppAnalytics(mockSiteId, mockLocaleId, mockCurrency))
        }).not.toThrow()
    })

    it('handles undefined parameters', () => {
        const mockTrackPage = jest.fn()
        mockUseActiveData.mockReturnValue({
            trackPage: mockTrackPage
        })

        renderHook(() => useAppAnalytics(undefined, undefined, undefined))

        expect(mockTrackPage).toHaveBeenCalledWith(undefined, undefined, undefined)
    })

    it('tracks page with correct parameters when called manually', () => {
        const mockTrackPage = jest.fn()
        mockUseActiveData.mockReturnValue({
            trackPage: mockTrackPage
        })

        const {result} = renderHook(() => useAppAnalytics(mockSiteId, mockLocaleId, mockCurrency))

        // Clear initial call
        mockTrackPage.mockClear()

        // Call trackPage manually
        result.current.trackPage()

        expect(mockTrackPage).toHaveBeenCalledWith(mockSiteId, mockLocaleId, mockCurrency)
    })

    it('provides access to activeData object', () => {
        const mockActiveData = {
            trackPage: jest.fn(),
            otherMethod: jest.fn()
        }
        mockUseActiveData.mockReturnValue(mockActiveData)

        const {result} = renderHook(() => useAppAnalytics(mockSiteId, mockLocaleId, mockCurrency))

        expect(result.current.activeData).toBe(mockActiveData)
    })

    it('handles location changes with different parameters', () => {
        const mockTrackPage = jest.fn()
        mockUseActiveData.mockReturnValue({
            trackPage: mockTrackPage
        })

        const newSiteId = 'NewSite'
        const newLocaleId = 'es-ES'
        const newCurrency = 'EUR'

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

        // Clear initial call
        mockTrackPage.mockClear()

        // Change parameters and location
        useLocation.mockReturnValue({
            pathname: '/checkout',
            search: '',
            hash: ''
        })

        rerender({
            siteId: newSiteId,
            localeId: newLocaleId,
            currency: newCurrency
        })

        expect(mockTrackPage).toHaveBeenCalledWith(newSiteId, newLocaleId, newCurrency)
    })
})
