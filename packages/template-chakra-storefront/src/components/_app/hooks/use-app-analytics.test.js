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
jest.mock('react-router-dom', () => ({
    useLocation: jest.fn()
}))

jest.mock('../../../hooks', () => ({
    __esModule: true,
    useActiveData: jest.fn()
}))

describe('useAppAnalytics', () => {
    const mockLocation = {
        pathname: '/home',
        search: '',
        hash: ''
    }

    const mockActiveData = {
        trackPage: jest.fn()
    }

    beforeEach(() => {
        const {useLocation} = require('react-router-dom')
        const {useActiveData} = require('../../../hooks')

        useLocation.mockReturnValue(mockLocation)
        useActiveData.mockReturnValue(mockActiveData)
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    test('returns tracking utilities', () => {
        const {result} = renderHook(() => useAppAnalytics('test-site', 'en-US', 'USD'))

        expect(result.current.trackPage).toEqual(expect.any(Function))
        expect(result.current.activeData).toEqual(mockActiveData)
        expect(result.current.activeData.trackPage).toEqual(expect.any(Function))
    })

    test('calls trackPage on mount', () => {
        renderHook(() => useAppAnalytics('test-site', 'en-US', 'USD'))

        expect(mockActiveData.trackPage).toHaveBeenCalledWith('test-site', 'en-US', 'USD')
    })

    test('calls trackPage when location changes', () => {
        const {useLocation} = require('react-router-dom')
        const {rerender} = renderHook(() => useAppAnalytics('test-site', 'en-US', 'USD'))

        // Clear initial call
        jest.clearAllMocks()

        // Change location
        useLocation.mockReturnValue({
            pathname: '/new-path',
            search: '?q=test'
        })

        rerender()

        expect(mockActiveData.trackPage).toHaveBeenCalledWith('test-site', 'en-US', 'USD')
    })

    test('handles missing activeData gracefully', () => {
        const {useActiveData} = require('../../../hooks')
        useActiveData.mockReturnValue(null)

        const {result} = renderHook(() => useAppAnalytics('test-site', 'en-US', 'USD'))

        expect(result.current.activeData).toBeNull()
        expect(result.current.trackPage).toEqual(expect.any(Function))
    })

    test('handles undefined parameters', () => {
        const {result} = renderHook(() => useAppAnalytics(undefined, undefined, undefined))

        expect(result.current.trackPage).toEqual(expect.any(Function))
        expect(mockActiveData.trackPage).toHaveBeenCalledWith(undefined, undefined, undefined)
    })

    test('tracks page with correct parameters when called manually', () => {
        const {result} = renderHook(() => useAppAnalytics('test-site', 'en-US', 'USD'))

        // Clear initial calls
        jest.clearAllMocks()

        // Call trackPage manually
        result.current.trackPage()

        expect(mockActiveData.trackPage).toHaveBeenCalledWith('test-site', 'en-US', 'USD')
    })

    test('provides access to activeData object', () => {
        const {result} = renderHook(() => useAppAnalytics('test-site', 'en-US', 'USD'))

        expect(result.current.activeData).toBe(mockActiveData)
        expect(result.current.activeData.trackPage).toEqual(expect.any(Function))
    })

    test('handles location changes with different parameters', () => {
        const {useLocation} = require('react-router-dom')
        const {rerender} = renderHook(
            ({siteId, locale, currency}) => useAppAnalytics(siteId, locale, currency),
            {
                initialProps: {siteId: 'site1', locale: 'en-US', currency: 'USD'}
            }
        )

        // Clear initial calls
        jest.clearAllMocks()

        // Change location, not just parameters
        useLocation.mockReturnValue({
            pathname: '/new-path',
            search: '?q=test'
        })

        // Change parameters
        rerender({siteId: 'site2', locale: 'de-DE', currency: 'EUR'})

        expect(mockActiveData.trackPage).toHaveBeenCalledWith('site2', 'de-DE', 'EUR')
    })
})
