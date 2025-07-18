/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {renderHook, act} from '@testing-library/react'
import {useHistory} from 'react-router-dom'
import {ChakraProvider} from '@chakra-ui/react'
import {useAppNavigation} from './use-app-navigation'
import theme from '../../../theme'

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
    useHistory: jest.fn(),
    useLocation: jest.fn(() => ({
        pathname: '/test',
        search: '',
        hash: '',
        state: null
    }))
}))

// Mock the useAppLocalization hook directly
jest.mock('./use-app-localization', () => ({
    useAppLocalization: jest.fn(() => ({
        targetLocale: 'en-US',
        messages: {
            'common.welcome': 'Welcome',
            'common.hello': 'Hello'
        },
        site: {id: 'RefArch', alias: 'test-site'},
        locale: {id: 'en-US'},
        buildUrl: jest.fn((href) => href), // Return the path as-is without prefix
        currency: 'USD',
        appOrigin: 'https://example.com'
    }))
}))

describe('useAppNavigation', () => {
    const mockPush = jest.fn()

    beforeEach(() => {
        jest.clearAllMocks()
        useHistory.mockReturnValue({
            push: mockPush
        })
    })

    // Simple wrapper with just ChakraProvider
    const wrapper = ({children}) => <ChakraProvider value={theme}>{children}</ChakraProvider>

    it('returns navigation handlers', () => {
        const {result} = renderHook(() => useAppNavigation(), {wrapper})

        expect(result.current).toMatchObject({
            onLogoClick: expect.any(Function),
            onCartClick: expect.any(Function),
            onAccountClick: expect.any(Function),
            onWishlistClick: expect.any(Function)
        })
    })

    it('handles logo click navigation', () => {
        const {result} = renderHook(() => useAppNavigation(), {wrapper})

        act(() => {
            result.current.onLogoClick()
        })

        expect(mockPush).toHaveBeenCalledWith('/')
    })

    it('handles cart click navigation', () => {
        const {result} = renderHook(() => useAppNavigation(), {wrapper})

        act(() => {
            result.current.onCartClick()
        })

        expect(mockPush).toHaveBeenCalledWith('/cart')
    })

    it('handles account click navigation', () => {
        const {result} = renderHook(() => useAppNavigation(), {wrapper})

        act(() => {
            result.current.onAccountClick()
        })

        expect(mockPush).toHaveBeenCalledWith('/account')
    })

    it('handles wishlist click navigation', () => {
        const {result} = renderHook(() => useAppNavigation(), {wrapper})

        act(() => {
            result.current.onWishlistClick()
        })

        expect(mockPush).toHaveBeenCalledWith('/account/wishlist')
    })

    it('handles multiple navigation calls', () => {
        const {result} = renderHook(() => useAppNavigation(), {wrapper})

        act(() => {
            result.current.onLogoClick()
            result.current.onCartClick()
            result.current.onAccountClick()
        })

        expect(mockPush).toHaveBeenCalledTimes(3)
        expect(mockPush).toHaveBeenNthCalledWith(1, '/')
        expect(mockPush).toHaveBeenNthCalledWith(2, '/cart')
        expect(mockPush).toHaveBeenNthCalledWith(3, '/account')
    })

    it('handles missing history object gracefully', () => {
        useHistory.mockReturnValue(null)

        const {result} = renderHook(() => useAppNavigation(), {wrapper})

        // Should not throw error when clicking handlers
        expect(() => {
            result.current.onLogoClick()
            result.current.onCartClick()
            result.current.onAccountClick()
            result.current.onWishlistClick()
        }).not.toThrow()
    })
})
