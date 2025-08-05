/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {renderHook, act} from '@testing-library/react'
import useRefreshToken from '@salesforce/retail-react-app/app/hooks/use-refresh-token'
import useAuthContext from '@salesforce/commerce-sdk-react/hooks/useAuthContext'

// Mock the hooks
jest.mock('@salesforce/commerce-sdk-react/hooks/useAuthContext')

describe('useRefreshToken', () => {
    let mockAuth
    let mockReady

    beforeEach(() => {
        mockReady = jest.fn()
        mockAuth = {
            ready: mockReady
        }

        // Mock the hooks
        useAuthContext.mockReturnValue(mockAuth)
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    describe('when authentication is ready', () => {
        it('should return refresh token when available', async () => {
            const refreshToken = 'test-refresh-token'
            mockReady.mockResolvedValue({refresh_token: refreshToken})

            const {result} = renderHook(() => useRefreshToken())

            // Initially should return null
            expect(result.current).toBeNull()

            // Wait for async operation
            await act(async () => {
                await new Promise((resolve) => setTimeout(resolve, 0))
            })

            expect(result.current).toBe(refreshToken)
            expect(mockReady).toHaveBeenCalled()
        })

        it('should return null when refresh token is not available', async () => {
            mockReady.mockResolvedValue({refresh_token: null})

            const {result} = renderHook(() => useRefreshToken())

            // Initially should return null
            expect(result.current).toBeNull()

            // Wait for async operation
            await act(async () => {
                await new Promise((resolve) => setTimeout(resolve, 0))
            })

            expect(result.current).toBeNull()
            expect(mockReady).toHaveBeenCalled()
        })

        it('should return undefined when refresh token is undefined', async () => {
            mockReady.mockResolvedValue({refresh_token: undefined})

            const {result} = renderHook(() => useRefreshToken())

            // Initially should return null
            expect(result.current).toBeNull()

            // Wait for async operation
            await act(async () => {
                await new Promise((resolve) => setTimeout(resolve, 0))
            })

            expect(result.current).toBeUndefined()
            expect(mockReady).toHaveBeenCalled()
        })

        it('should return empty string when refresh token is empty string', async () => {
            mockReady.mockResolvedValue({refresh_token: ''})

            const {result} = renderHook(() => useRefreshToken())

            // Initially should return null
            expect(result.current).toBeNull()

            // Wait for async operation
            await act(async () => {
                await new Promise((resolve) => setTimeout(resolve, 0))
            })

            expect(result.current).toBe('')
            expect(mockReady).toHaveBeenCalled()
        })

        it('should return undefined when auth.ready response has no refresh_token property', async () => {
            mockReady.mockResolvedValue({})

            const {result} = renderHook(() => useRefreshToken())

            // Initially should return null
            expect(result.current).toBeNull()

            // Wait for async operation
            await act(async () => {
                await new Promise((resolve) => setTimeout(resolve, 0))
            })

            expect(result.current).toBeUndefined()
            expect(mockReady).toHaveBeenCalled()
        })
    })

    describe('when authentication fails', () => {
        it('should return null when auth.ready throws an error', async () => {
            mockReady.mockRejectedValue(new Error('Auth failed'))

            const {result} = renderHook(() => useRefreshToken())

            // Initially should return null
            expect(result.current).toBeNull()

            // Wait for async operation
            await act(async () => {
                await new Promise((resolve) => setTimeout(resolve, 0))
            })

            expect(result.current).toBeNull()
            expect(mockReady).toHaveBeenCalled()
        })

        it('should return null when auth.ready returns a promise that rejects', async () => {
            mockReady.mockRejectedValue('Network error')

            const {result} = renderHook(() => useRefreshToken())

            // Initially should return null
            expect(result.current).toBeNull()

            // Wait for async operation
            await act(async () => {
                await new Promise((resolve) => setTimeout(resolve, 0))
            })

            expect(result.current).toBeNull()
            expect(mockReady).toHaveBeenCalled()
        })
    })

    describe('dependency changes', () => {
        it('should refetch token when auth object changes', async () => {
            const token1 = 'token-1'
            mockReady.mockResolvedValue({refresh_token: token1})

            const {result, rerender} = renderHook(() => useRefreshToken())

            // Wait for first async operation
            await act(async () => {
                await new Promise((resolve) => setTimeout(resolve, 0))
            })

            expect(result.current).toBe(token1)

            // Create new auth object
            const newMockAuth = {
                ready: jest.fn().mockResolvedValue({refresh_token: 'token-2'})
            }
            useAuthContext.mockReturnValue(newMockAuth)

            rerender()

            // Wait for second async operation
            await act(async () => {
                await new Promise((resolve) => setTimeout(resolve, 0))
            })

            expect(result.current).toBe('token-2')
        })
    })
})
