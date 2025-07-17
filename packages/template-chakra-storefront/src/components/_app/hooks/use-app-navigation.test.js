/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {renderHook, act} from '@testing-library/react'
import {useHistory} from 'react-router-dom'
import {useAppNavigation} from './use-app-navigation'

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
    useHistory: jest.fn()
}))

describe('useAppNavigation', () => {
    const mockPush = jest.fn()

    beforeEach(() => {
        jest.clearAllMocks()
        useHistory.mockReturnValue({
            push: mockPush
        })
    })

    it('returns navigation handlers', () => {
        const {result} = renderHook(() => useAppNavigation())

        expect(result.current).toMatchObject({
            onLogoClick: expect.any(Function),
            onCartClick: expect.any(Function),
            onAccountClick: expect.any(Function),
            onWishlistClick: expect.any(Function)
        })
    })

    it('handles logo click navigation', () => {
        const {result} = renderHook(() => useAppNavigation())

        act(() => {
            result.current.onLogoClick()
        })

        expect(mockPush).toHaveBeenCalledWith('/')
    })

    it('handles cart click navigation', () => {
        const {result} = renderHook(() => useAppNavigation())

        act(() => {
            result.current.onCartClick()
        })

        expect(mockPush).toHaveBeenCalledWith('/cart')
    })

    it('handles account click navigation', () => {
        const {result} = renderHook(() => useAppNavigation())

        act(() => {
            result.current.onAccountClick()
        })

        expect(mockPush).toHaveBeenCalledWith('/account')
    })

    it('handles wishlist click navigation', () => {
        const {result} = renderHook(() => useAppNavigation())

        act(() => {
            result.current.onWishlistClick()
        })

        expect(mockPush).toHaveBeenCalledWith('/account/wishlist')
    })

    it('handles multiple navigation calls', () => {
        const {result} = renderHook(() => useAppNavigation())

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

        const {result} = renderHook(() => useAppNavigation())

        // Should not throw error when clicking handlers
        expect(() => {
            result.current.onLogoClick()
            result.current.onCartClick()
            result.current.onAccountClick()
            result.current.onWishlistClick()
        }).not.toThrow()
    })
})
