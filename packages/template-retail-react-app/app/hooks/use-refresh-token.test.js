/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {renderHook} from '@testing-library/react'
import useRefreshToken from '@salesforce/retail-react-app/app/hooks/use-refresh-token'
import useAuthContext from '@salesforce/commerce-sdk-react/hooks/useAuthContext'
import useCustomerType from '@salesforce/commerce-sdk-react/hooks/useCustomerType'

// Mock the hooks
jest.mock('@salesforce/commerce-sdk-react/hooks/useAuthContext')
jest.mock('@salesforce/commerce-sdk-react/hooks/useCustomerType')

describe('useRefreshToken', () => {
    let mockAuth
    let mockGet

    beforeEach(() => {
        mockGet = jest.fn()
        mockAuth = {
            get: mockGet
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

        it('should return empty string when storage token is not available', () => {
            mockGet.mockReturnValue('')

            const {result} = renderHook(() => useRefreshToken())

            expect(result.current).toBe('')
            expect(mockGet).toHaveBeenCalledWith('refresh_token_guest')
        })

        it('should return null when storage token is null', () => {
            mockGet.mockReturnValue(null)

            const {result} = renderHook(() => useRefreshToken())

            expect(result.current).toBeNull()
            expect(mockGet).toHaveBeenCalledWith('refresh_token_guest')
        })

        it('should return undefined when storage token is undefined', () => {
            mockGet.mockReturnValue(undefined)

            const {result} = renderHook(() => useRefreshToken())

            expect(result.current).toBeUndefined()
            expect(mockGet).toHaveBeenCalledWith('refresh_token_guest')
        })

        it('should return false when storage token is false', () => {
            mockGet.mockReturnValue(false)

            const {result} = renderHook(() => useRefreshToken())

            expect(result.current).toBe(false)
            expect(mockGet).toHaveBeenCalledWith('refresh_token_guest')
        })

        it('should return 0 when storage token is 0', () => {
            mockGet.mockReturnValue(0)

            const {result} = renderHook(() => useRefreshToken())

            expect(result.current).toBe(0)
            expect(mockGet).toHaveBeenCalledWith('refresh_token_guest')
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

    describe('when customer type is undefined', () => {
        it('should return null when customer type is undefined', () => {
            useCustomerType.mockReturnValue({customerType: undefined})

            const {result} = renderHook(() => useRefreshToken())

            expect(result.current).toBeNull()
            expect(mockGet).not.toHaveBeenCalled()
        })
    })

    describe('when customer type is falsy or invalid', () => {
        it('should return null when customer type is empty string', () => {
            useCustomerType.mockReturnValue({customerType: ''})

            const {result} = renderHook(() => useRefreshToken())

            expect(result.current).toBeNull()
            expect(mockGet).not.toHaveBeenCalled()
        })

        it('should return null when customer type is false', () => {
            useCustomerType.mockReturnValue({customerType: false})

            const {result} = renderHook(() => useRefreshToken())

            expect(result.current).toBeNull()
            expect(mockGet).not.toHaveBeenCalled()
        })

        it('should call auth.get with invalid customer type', () => {
            useCustomerType.mockReturnValue({customerType: 'invalid'})
            mockGet.mockReturnValue('some-token')

            const {result} = renderHook(() => useRefreshToken())

            expect(result.current).toBe('some-token')
            expect(mockGet).toHaveBeenCalledWith('refresh_token_invalid')
        })
    })

    describe('dependency changes', () => {
        it('should refetch token when auth object changes', () => {
            const token1 = 'token-1'
            mockGet.mockReturnValue(token1)

            const {result, rerender} = renderHook(() => useRefreshToken())

            expect(result.current).toBe(token1)

            // Create new auth object
            const newMockAuth = {
                get: jest.fn().mockReturnValue('token-2')
            }
            useAuthContext.mockReturnValue(newMockAuth)

            rerender()

            expect(result.current).toBe('token-2')
        })

        it('should refetch token when customer type changes', () => {
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

        it('should handle customer type changing from valid to null', () => {
            const guestToken = 'guest-token'
            mockGet.mockReturnValue(guestToken)

            const {result, rerender} = renderHook(() => useRefreshToken())

            expect(result.current).toBe(guestToken)

            // Change customer type to null
            useCustomerType.mockReturnValue({customerType: null})

            rerender()

            expect(result.current).toBeNull()
            expect(mockGet).not.toHaveBeenCalled()
        })

        it('should handle customer type changing from null to valid', () => {
            useCustomerType.mockReturnValue({customerType: null})

            const {result, rerender} = renderHook(() => useRefreshToken())

            expect(result.current).toBeNull()

            // Change customer type to valid
            useCustomerType.mockReturnValue({customerType: 'guest'})
            mockGet.mockReturnValue('guest-token')

            rerender()

            expect(result.current).toBe('guest-token')
            expect(mockGet).toHaveBeenCalledWith('refresh_token_guest')
        })
    })

    describe('edge cases', () => {
        it('should handle auth object being null', () => {
            useAuthContext.mockReturnValue(null)

            const {result} = renderHook(() => useRefreshToken())

            // This will throw an error when trying to call auth.get, but React will catch it
            // The test will fail if the hook doesn't handle this gracefully
            expect(() => result.current).toThrow()
        })

        it('should handle auth object being undefined', () => {
            useAuthContext.mockReturnValue(undefined)

            const {result} = renderHook(() => useRefreshToken())

            // This will throw an error when trying to call auth.get, but React will catch it
            expect(() => result.current).toThrow()
        })

        it('should handle auth.get being undefined', () => {
            mockAuth.get = undefined

            const {result} = renderHook(() => useRefreshToken())

            // This will throw an error when trying to call auth.get, but React will catch it
            expect(() => result.current).toThrow()
        })
    })
})
