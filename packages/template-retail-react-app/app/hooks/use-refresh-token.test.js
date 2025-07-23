/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {renderHook, act} from '@testing-library/react'
import useRefreshToken from '@salesforce/retail-react-app/app/hooks/use-refresh-token'

describe('useRefreshToken', () => {
    let mockAuth
    let mockReady
    let mockGet

    beforeEach(() => {
        mockReady = jest.fn()
        mockGet = jest.fn()
        
        mockAuth = {
            ready: mockReady,
            get: mockGet
        }
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    describe('when user is registered', () => {
        it('should return refresh_token_registered when authentication is ready', async () => {
            const registeredToken = 'registered-refresh-token'
            mockReady.mockResolvedValue(undefined)
            mockGet.mockReturnValue(registeredToken)

            const {result} = renderHook(() => 
                useRefreshToken(mockAuth, true, false)
            )

            // Initially should be null while waiting for auth
            expect(result.current).toBe(null)

            // Wait for the async effect to complete
            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 0))
            })

            expect(mockReady).toHaveBeenCalledTimes(1)
            expect(mockGet).toHaveBeenCalledWith('refresh_token_registered')
            expect(mockGet).not.toHaveBeenCalledWith('refresh_token_guest')
            expect(result.current).toBe(registeredToken)
        })

        it('should handle authentication errors gracefully', async () => {
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
            mockReady.mockRejectedValue(new Error('Auth failed'))

            const {result} = renderHook(() => 
                useRefreshToken(mockAuth, true, false)
            )

            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 0))
            })

            expect(mockReady).toHaveBeenCalledTimes(1)
            expect(mockGet).not.toHaveBeenCalled()
            expect(result.current).toBe(null)
            expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to get refresh token:', expect.any(Error))

            consoleErrorSpy.mockRestore()
        })
    })

    describe('when user is guest', () => {
        it('should return refresh_token_guest when authentication is ready', async () => {
            const guestToken = 'guest-refresh-token'
            mockReady.mockResolvedValue(undefined)
            mockGet.mockReturnValue(guestToken)

            const {result} = renderHook(() => 
                useRefreshToken(mockAuth, false, true)
            )

            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 0))
            })

            expect(mockReady).toHaveBeenCalledTimes(1)
            expect(mockGet).toHaveBeenCalledWith('refresh_token_guest')
            expect(mockGet).not.toHaveBeenCalledWith('refresh_token_registered')
            expect(result.current).toBe(guestToken)
        })
    })

    describe('when auth.get returns null or undefined', () => {
        it('should return null when auth.get returns null for registered user', async () => {
            mockReady.mockResolvedValue(undefined)
            mockGet.mockReturnValue(null)

            const {result} = renderHook(() => 
                useRefreshToken(mockAuth, true, false)
            )

            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 0))
            })

            expect(mockGet).toHaveBeenCalledWith('refresh_token_registered')
            expect(result.current).toBe(null)
        })

        it('should return undefined when auth.get returns undefined for guest user', async () => {
            mockReady.mockResolvedValue(undefined)
            mockGet.mockReturnValue(undefined)

            const {result} = renderHook(() => 
                useRefreshToken(mockAuth, false, true)
            )

            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 0))
            })

            expect(mockGet).toHaveBeenCalledWith('refresh_token_guest')
            expect(result.current).toBe(undefined)
        })
    })

    describe('dependency changes', () => {
        it('should refetch token when auth object changes', async () => {
            const token1 = 'token-1'
            const token2 = 'token-2'
            
            mockReady.mockResolvedValue(undefined)
            mockGet.mockReturnValue(token1)

            const {result, rerender} = renderHook(
                ({auth, isRegistered, isGuest}) => useRefreshToken(auth, isRegistered, isGuest),
                {
                    initialProps: {auth: mockAuth, isRegistered: true, isGuest: false}
                }
            )

            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 0))
            })

            expect(result.current).toBe(token1)

            // Create new auth object
            const newMockAuth = {
                ready: jest.fn().mockResolvedValue(undefined),
                get: jest.fn().mockReturnValue(token2)
            }

            rerender({auth: newMockAuth, isRegistered: true, isGuest: false})

            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 0))
            })

            expect(newMockAuth.ready).toHaveBeenCalledTimes(1)
            expect(newMockAuth.get).toHaveBeenCalledWith('refresh_token_registered')
            expect(result.current).toBe(token2)
        })

        it('should refetch token when user type changes from guest to registered', async () => {
            const guestToken = 'guest-token'
            const registeredToken = 'registered-token'
            
            mockReady.mockResolvedValue(undefined)
            mockGet.mockImplementation((key) => {
                if (key === 'refresh_token_guest') return guestToken
                if (key === 'refresh_token_registered') return registeredToken
                return null
            })

            const {result, rerender} = renderHook(
                ({auth, isRegistered, isGuest}) => useRefreshToken(auth, isRegistered, isGuest),
                {
                    initialProps: {auth: mockAuth, isRegistered: false, isGuest: true}
                }
            )

            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 0))
            })

            expect(mockGet).toHaveBeenCalledWith('refresh_token_guest')
            expect(result.current).toBe(guestToken)

            // Change to registered user
            rerender({auth: mockAuth, isRegistered: true, isGuest: false})

            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 0))
            })

            expect(mockGet).toHaveBeenCalledWith('refresh_token_registered')
            expect(result.current).toBe(registeredToken)
        })
    })

    describe('edge cases', () => {
        it('should handle auth object being null or undefined', async () => {
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

            const {result} = renderHook(() => 
                useRefreshToken(null, true, false)
            )

            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 0))
            })

            expect(result.current).toBe(null)
            expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to get refresh token:', expect.any(Error))

            consoleErrorSpy.mockRestore()
        })

        it('should handle auth.ready throwing an error', async () => {
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
            mockReady.mockImplementation(() => {
                throw new Error('Unexpected error')
            })

            const {result} = renderHook(() => 
                useRefreshToken(mockAuth, true, false)
            )

            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 0))
            })

            expect(result.current).toBe(null)
            expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to get refresh token:', expect.any(Error))

            consoleErrorSpy.mockRestore()
        })
    })
}) 