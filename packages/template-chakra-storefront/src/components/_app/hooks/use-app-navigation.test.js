/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/* eslint-disable @typescript-eslint/no-var-requires */
import {renderHook} from '@testing-library/react'
import {useAppNavigation} from './use-app-navigation'

// Mock dependencies
jest.mock('./use-app-config', () => ({
    useAppConfig: jest.fn()
}))

jest.mock('./use-app-localization', () => ({
    useAppLocalization: jest.fn()
}))

jest.mock('react-router-dom', () => ({
    useHistory: jest.fn()
}))

const mockAppConfig = {
    pages: {
        home: {
            path: '/'
        }
    }
}

const mockLocalization = {
    buildUrl: jest.fn((path) => path)
}

const mockHistory = {
    push: jest.fn()
}

describe('useAppNavigation', () => {
    beforeEach(() => {
        const {useAppConfig} = require('./use-app-config')
        const {useAppLocalization} = require('./use-app-localization')
        const {useHistory} = require('react-router-dom')

        useAppConfig.mockReturnValue({appConfig: mockAppConfig})
        useAppLocalization.mockReturnValue(mockLocalization)
        useHistory.mockReturnValue(mockHistory)
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    test('returns navigation handlers', () => {
        const {result} = renderHook(() => useAppNavigation())

        expect(result.current.onLogoClick).toEqual(expect.any(Function))
        expect(result.current.onCartClick).toEqual(expect.any(Function))
        expect(result.current.onAccountClick).toEqual(expect.any(Function))
        //@sfdc-extension-line SFDC_EXT_WISHLIST
        expect(result.current.onWishlistClick).toEqual(expect.any(Function))
    })

    test('handles logo click navigation', () => {
        const {result} = renderHook(() => useAppNavigation())

        result.current.onLogoClick()

        expect(mockLocalization.buildUrl).toHaveBeenCalledWith('/')
        expect(mockHistory.push).toHaveBeenCalledWith('/')
    })

    test('handles cart click navigation', () => {
        const {result} = renderHook(() => useAppNavigation())

        result.current.onCartClick()

        expect(mockLocalization.buildUrl).toHaveBeenCalledWith('/cart')
        expect(mockHistory.push).toHaveBeenCalledWith('/cart')
    })

    test('handles account click navigation', () => {
        const {result} = renderHook(() => useAppNavigation())

        result.current.onAccountClick()

        expect(mockLocalization.buildUrl).toHaveBeenCalledWith('/account')
        expect(mockHistory.push).toHaveBeenCalledWith('/account')
    })

    //@sfdc-extension-block-start SFDC_EXT_WISHLIST
    test('handles wishlist click navigation', () => {
        const {result} = renderHook(() => useAppNavigation())

        result.current.onWishlistClick()

        expect(mockLocalization.buildUrl).toHaveBeenCalledWith('/account/wishlist')
        expect(mockHistory.push).toHaveBeenCalledWith('/account/wishlist')
    })
    //@sfdc-extension-block-end SFDC_EXT_WISHLIST

    test('handles multiple navigation calls', () => {
        const {result} = renderHook(() => useAppNavigation())

        result.current.onLogoClick()
        result.current.onCartClick()
        result.current.onAccountClick()

        expect(mockHistory.push).toHaveBeenCalledTimes(3)
        expect(mockHistory.push).toHaveBeenNthCalledWith(1, '/')
        expect(mockHistory.push).toHaveBeenNthCalledWith(2, '/cart')
        expect(mockHistory.push).toHaveBeenNthCalledWith(3, '/account')
    })

    test('handles missing history object gracefully', () => {
        const {useHistory} = require('react-router-dom')
        useHistory.mockReturnValue(null)

        const {result} = renderHook(() => useAppNavigation())

        // Should not throw errors when history is null
        expect(() => {
            result.current.onLogoClick()
            result.current.onCartClick()
        }).not.toThrow()
    })
})
