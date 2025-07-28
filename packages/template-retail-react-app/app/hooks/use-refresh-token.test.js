/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {renderHook, act} from '@testing-library/react'
import useRefreshToken from '@salesforce/retail-react-app/app/hooks/use-refresh-token'
import useAuthContext from '@salesforce/commerce-sdk-react/hooks/useAuthContext'
import useCustomerType from '@salesforce/commerce-sdk-react/hooks/useCustomerType'

// Mock the hooks
jest.mock('@salesforce/commerce-sdk-react/hooks/useAuthContext')
jest.mock('@salesforce/commerce-sdk-react/hooks/useCustomerType')

describe('useRefreshToken', () => {
    let mockAuth
    let mockGet
    let mockReady

    beforeEach(() => {
        mockGet = jest.fn()
        mockReady = jest.fn()

        mockAuth = {
            get: mockGet,
            ready: mockReady
        }

        // Mock the hooks
        useAuthContext.mockReturnValue(mockAuth)
        useCustomerType.mockReturnValue({customerType: 'guest'})
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    describe('when authentication is ready', () => {
        it('should return refresh token from storage when available', () => {
            const refreshToken = 'test-refresh-token'
            mockGet.mockReturnValue(refreshToken)

            const {result} = renderHook(() => useRefreshToken())

            expect(result.current).toBe(refreshToken)
            expect(mockGet).toHaveBeenCalledWith('refresh_token_guest')
        })

        it('should return ready token when storage token is null', async () => {
            const readyToken = 'ready-refresh-token'
            mockGet.mockReturnValue(null)
            mockReady.mockResolvedValue({refresh_token: readyToken})

            const {result} = renderHook(() => useRefreshToken())

            // Initially should return null
            expect(result.current).toBeNull()

            // Wait for async operation
            await act(async () => {
                await new Promise((resolve) => setTimeout(resolve, 0))
            })

            // Should return the ready token
            expect(result.current).toBe(readyToken)
        })

        it('should handle authentication errors gracefully', async () => {
            mockGet.mockReturnValue(null)
            mockReady.mockRejectedValue(new Error('Auth failed'))

            const {result} = renderHook(() => useRefreshToken())

            // Initially should return null
            expect(result.current).toBeNull()

            // Wait for async operation
            await act(async () => {
                await new Promise((resolve) => setTimeout(resolve, 0))
            })

            // Should still return null after error
            expect(result.current).toBeNull()
        })
    })

    describe('when customer type is registered', () => {
        it('should get refresh token for registered user', () => {
            const refreshToken = 'registered-refresh-token'
            useCustomerType.mockReturnValue({customerType: 'registered'})
            mockGet.mockReturnValue(refreshToken)

            const {result} = renderHook(() => useRefreshToken())

            expect(result.current).toBe(refreshToken)
            expect(mockGet).toHaveBeenCalledWith('refresh_token_registered')
        })
    })

    describe('when customer type is null', () => {
        it('should return null when customer type is null', () => {
            useCustomerType.mockReturnValue({customerType: null})

            const {result} = renderHook(() => useRefreshToken())

            expect(result.current).toBeNull()
            expect(mockGet).not.toHaveBeenCalled()
        })
    })

    describe('when token response has no refresh token', () => {
        it('should return null when refresh_token is undefined', async () => {
            mockGet.mockReturnValue(null)
            mockReady.mockResolvedValue({})

            const {result} = renderHook(() => useRefreshToken())

            await act(async () => {
                await new Promise((resolve) => setTimeout(resolve, 0))
            })

            expect(result.current).toBeNull()
        })

        it('should return null when refresh_token is null', async () => {
            mockGet.mockReturnValue(null)
            mockReady.mockResolvedValue({refresh_token: null})

            const {result} = renderHook(() => useRefreshToken())

            await act(async () => {
                await new Promise((resolve) => setTimeout(resolve, 0))
            })

            expect(result.current).toBeNull()
        })
    })

    describe('dependency changes', () => {
        it('should refetch token when auth object changes', async () => {
            const token1 = 'token-1'
            mockGet.mockReturnValue(token1)

            const {result, rerender} = renderHook(() => useRefreshToken())

            expect(result.current).toBe(token1)

            // Create new auth object
            const newMockAuth = {
                get: jest.fn().mockReturnValue('token-2'),
                ready: jest.fn()
            }
            useAuthContext.mockReturnValue(newMockAuth)

            rerender()

            expect(result.current).toBe('token-2')
        })

        it('should refetch token when customer type changes', async () => {
            const guestToken = 'guest-token'
            mockGet.mockReturnValue(guestToken)

            const {result, rerender} = renderHook(() => useRefreshToken())

            expect(result.current).toBe(guestToken)

            // Change customer type
            useCustomerType.mockReturnValue({customerType: 'registered'})
            mockGet.mockReturnValue('registered-token')

            rerender()

            expect(result.current).toBe('registered-token')
            expect(mockGet).toHaveBeenCalledWith('refresh_token_registered')
        })
    })

    describe('edge cases', () => {
        it('should handle auth.ready throwing an error', async () => {
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
            mockGet.mockReturnValue(null)
            mockReady.mockRejectedValue(new Error('Network error'))

            const {result} = renderHook(() => useRefreshToken())

            await act(async () => {
                await new Promise((resolve) => setTimeout(resolve, 0))
            })

            expect(result.current).toBeNull()
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                'Failed to get refresh token:',
                expect.any(Error)
            )

            consoleErrorSpy.mockRestore()
        })

        it('should handle useAuthContext throwing an error', async () => {
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
            useAuthContext.mockImplementation(() => {
                throw new Error('Missing CommerceApiProvider')
            })

            // The hook will throw an error when useAuthContext fails
            expect(() => {
                renderHook(() => useRefreshToken())
            }).toThrow('Missing CommerceApiProvider')

            consoleErrorSpy.mockRestore()
        })
    })
})
