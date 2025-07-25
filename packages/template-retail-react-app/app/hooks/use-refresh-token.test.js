/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {renderHook, act} from '@testing-library/react'
import useRefreshToken from '@salesforce/retail-react-app/app/hooks/use-refresh-token'
import useAuthContext from '@salesforce/commerce-sdk-react/hooks/useAuthContext'

// Mock the useAuthContext hook
jest.mock('@salesforce/commerce-sdk-react/hooks/useAuthContext')

describe('useRefreshToken', () => {
    let mockAuth
    let mockReady

    beforeEach(() => {
        mockReady = jest.fn()
        
        mockAuth = {
            ready: mockReady
        }

        // Mock the useAuthContext hook to return our mock auth
        useAuthContext.mockReturnValue(mockAuth)
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    describe('when authentication is ready', () => {
        it('should return refresh token from token response', async () => {
            const refreshToken = 'test-refresh-token'
            const tokenResponse = {
                refresh_token: refreshToken,
                access_token: 'test-access-token',
                customer_id: 'test-customer-id'
            }
            mockReady.mockResolvedValue(tokenResponse)

            const {result} = renderHook(() => useRefreshToken())

            // Initially should be null while waiting for auth
            expect(result.current).toBe(null)

            // Wait for the async effect to complete
            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 0))
            })

            expect(mockReady).toHaveBeenCalledTimes(1)
            expect(result.current).toBe(refreshToken)
        })

        it('should handle authentication errors gracefully', async () => {
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
            mockReady.mockRejectedValue(new Error('Auth failed'))

            const {result} = renderHook(() => useRefreshToken())

            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 0))
            })

            expect(mockReady).toHaveBeenCalledTimes(1)
            expect(result.current).toBe(null)
            expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to get refresh token:', expect.any(Error))

            consoleErrorSpy.mockRestore()
        })
    })

    describe('when token response has no refresh token', () => {
        it('should return null when refresh_token is undefined', async () => {
            const tokenResponse = {
                access_token: 'test-access-token',
                customer_id: 'test-customer-id'
                // refresh_token is undefined
            }
            mockReady.mockResolvedValue(tokenResponse)

            const {result} = renderHook(() => useRefreshToken())

            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 0))
            })

            expect(result.current).toBe(null)
        })

        it('should return null when refresh_token is null', async () => {
            const tokenResponse = {
                refresh_token: null,
                access_token: 'test-access-token',
                customer_id: 'test-customer-id'
            }
            mockReady.mockResolvedValue(tokenResponse)

            const {result} = renderHook(() => useRefreshToken())

            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 0))
            })

            expect(result.current).toBe(null)
        })
    })

    describe('dependency changes', () => {
        it('should refetch token when auth object changes', async () => {
            const token1 = 'token-1'
            const token2 = 'token-2'
            
            mockReady.mockResolvedValue({refresh_token: token1})

            const {result, rerender} = renderHook(() => useRefreshToken())

            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 0))
            })

            expect(result.current).toBe(token1)

            // Create new auth object
            const newMockAuth = {
                ready: jest.fn().mockResolvedValue({refresh_token: token2})
            }
            useAuthContext.mockReturnValue(newMockAuth)

            rerender()

            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 0))
            })

            expect(newMockAuth.ready).toHaveBeenCalledTimes(1)
            expect(result.current).toBe(token2)
        })
    })

    describe('edge cases', () => {
        it('should handle auth.ready throwing an error', async () => {
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
            mockReady.mockImplementation(() => {
                throw new Error('Unexpected error')
            })

            const {result} = renderHook(() => useRefreshToken())

            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 0))
            })

            expect(result.current).toBe(null)
            expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to get refresh token:', expect.any(Error))

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