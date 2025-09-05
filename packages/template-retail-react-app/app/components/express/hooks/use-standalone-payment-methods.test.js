/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {renderHook, waitFor} from '@testing-library/react'
import {useStandalonePaymentMethods} from '@salesforce/retail-react-app/app/components/express/hooks/use-standalone-payment-methods'
import {AdyenPaymentMethodsService} from '@salesforce/retail-react-app/app/components/express/utils/payment-methods'

// Mock the AdyenPaymentMethodsService
jest.mock('@salesforce/retail-react-app/app/components/express/utils/payment-methods')

describe('useStandalonePaymentMethods', () => {
    const mockAuthToken = 'test-auth-token'
    const mockRefreshToken = 'test-refresh-token'
    const mockSite = {id: 'test-site', name: 'Test Site'}
    const mockLocale = {id: 'en-US', currency: 'USD'}
    const mockUpdateTokens = jest.fn()
    const mockPaymentMethods = {
        paymentMethods: [
            {type: 'applepay', name: 'Apple Pay'},
            {type: 'scheme', name: 'Credit Card', brands: ['visa', 'mc']}
        ]
    }

    let mockGetPaymentMethods

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks()

        // Mock the service methods
        mockGetPaymentMethods = jest.fn()
        AdyenPaymentMethodsService.mockImplementation(() => ({
            getPaymentMethods: mockGetPaymentMethods
        }))

        // Mock console.error to avoid noise in test output
        jest.spyOn(console, 'error').mockImplementation(() => {})
    })

    afterEach(() => {
        jest.restoreAllMocks()
    })

    describe('initial state', () => {
        it('should initialize with correct default values when disabled', () => {
            const {result} = renderHook(() =>
                useStandalonePaymentMethods(mockAuthToken, mockRefreshToken, mockSite, mockLocale, false, mockUpdateTokens)
            )

            expect(result.current).toEqual({
                paymentMethods: null,
                loading: false,
                error: null
            })
        })

        it('should start in loading state when enabled', () => {
            mockGetPaymentMethods.mockResolvedValueOnce(mockPaymentMethods)

            const {result} = renderHook(() =>
                useStandalonePaymentMethods(mockAuthToken, mockRefreshToken, mockSite, mockLocale, true, mockUpdateTokens)
            )

            expect(result.current).toEqual({
                paymentMethods: null,
                loading: true,
                error: null
            })
        })
    })

    describe('successful API calls', () => {
        it('should fetch payment methods successfully', async () => {
            mockGetPaymentMethods.mockResolvedValueOnce(mockPaymentMethods)

            const {result} = renderHook(() =>
                useStandalonePaymentMethods(mockAuthToken, mockRefreshToken, mockSite, mockLocale, true, mockUpdateTokens)
            )

            // Should start loading
            expect(result.current.loading).toBe(true)
            expect(result.current.error).toBeNull()
            expect(result.current.paymentMethods).toBeNull()

            // Wait for the API call to complete
            await waitFor(() => {
                expect(result.current.loading).toBe(false)
            })

            expect(result.current.paymentMethods).toEqual(mockPaymentMethods)
            expect(result.current.error).toBeNull()
            expect(mockGetPaymentMethods).toHaveBeenCalledTimes(1)
        })

        it('should create AdyenPaymentMethodsService with correct parameters', async () => {
            mockGetPaymentMethods.mockResolvedValueOnce(mockPaymentMethods)

            renderHook(() => useStandalonePaymentMethods(mockAuthToken, mockRefreshToken, mockSite, mockLocale))

            await waitFor(() => {
                expect(AdyenPaymentMethodsService).toHaveBeenCalledWith(mockAuthToken, mockRefreshToken, mockSite, mockUpdateTokens)
            })
        })
    })

    describe('error handling', () => {
        it('should handle API errors correctly', async () => {
            const mockError = new Error('API request failed')
            mockGetPaymentMethods.mockRejectedValueOnce(mockError)

            const {result} = renderHook(() =>
                useStandalonePaymentMethods(mockAuthToken, mockRefreshToken, mockSite, mockLocale, true, mockUpdateTokens)
            )

            // Should start loading
            expect(result.current.loading).toBe(true)

            // Wait for the error to be set
            await waitFor(() => {
                expect(result.current.loading).toBe(false)
            })

            expect(result.current.error).toBe(mockError)
            expect(result.current.paymentMethods).toBeNull()
            expect(console.error).toHaveBeenCalledWith(
                'Error fetching standalone payment methods:',
                mockError
            )
        })

        it('should reset error state on successful retry', async () => {
            const mockError = new Error('API request failed')
            mockGetPaymentMethods
                .mockRejectedValueOnce(mockError)
                .mockResolvedValueOnce(mockPaymentMethods)

            const {result, rerender} = renderHook(
                ({authToken}) => useStandalonePaymentMethods(authToken, mockRefreshToken, mockSite, mockLocale, true, mockUpdateTokens),
                {
                    initialProps: {authToken: mockAuthToken}
                }
            )

            // Wait for first error
            await waitFor(() => {
                expect(result.current.error).toBe(mockError)
            })

            // Change authToken to trigger new API call
            rerender({authToken: 'new-token'})

            // Wait for successful response
            await waitFor(() => {
                expect(result.current.loading).toBe(false)
            })

            expect(result.current.error).toBeNull()
            expect(result.current.paymentMethods).toEqual(mockPaymentMethods)
        })
    })

    describe('conditional execution', () => {
        it('should not make API call when enabled is false', () => {
            renderHook(() =>
                useStandalonePaymentMethods(mockAuthToken, mockRefreshToken, mockSite, mockLocale, false, mockUpdateTokens)
            )

            expect(mockGetPaymentMethods).not.toHaveBeenCalled()
            expect(AdyenPaymentMethodsService).not.toHaveBeenCalled()
        })

        it('should not make API call when authToken is missing', () => {
            renderHook(() => useStandalonePaymentMethods(null, mockRefreshToken, mockSite, mockLocale, true, mockUpdateTokens))

            expect(mockGetPaymentMethods).not.toHaveBeenCalled()
            expect(AdyenPaymentMethodsService).not.toHaveBeenCalled()
        })

        it('should not make API call when site is missing', () => {
            renderHook(() => useStandalonePaymentMethods(mockAuthToken, mockRefreshToken, null, mockLocale))

            expect(mockGetPaymentMethods).not.toHaveBeenCalled()
            expect(AdyenPaymentMethodsService).not.toHaveBeenCalled()
        })

        it('should make API call when enabled changes from false to true', async () => {
            mockGetPaymentMethods.mockResolvedValueOnce(mockPaymentMethods)

            const {result, rerender} = renderHook(
                ({enabled}) =>
                    useStandalonePaymentMethods(mockAuthToken, mockRefreshToken, mockSite, mockLocale, enabled, mockUpdateTokens),
                {
                    initialProps: {enabled: false}
                }
            )

            // Initially should not call API
            expect(mockGetPaymentMethods).not.toHaveBeenCalled()

            // Enable the hook
            rerender({enabled: true})

            // Should now make API call
            await waitFor(() => {
                expect(mockGetPaymentMethods).toHaveBeenCalledTimes(1)
            })

            expect(result.current.paymentMethods).toEqual(mockPaymentMethods)
        })
    })

    describe('effect dependencies', () => {
        it('should refetch when authToken changes', async () => {
            mockGetPaymentMethods.mockResolvedValue(mockPaymentMethods)

            const {rerender} = renderHook(
                ({authToken}) => useStandalonePaymentMethods(authToken, mockRefreshToken, mockSite, mockLocale, true, mockUpdateTokens),
                {
                    initialProps: {authToken: 'token1'}
                }
            )

            await waitFor(() => {
                expect(mockGetPaymentMethods).toHaveBeenCalledTimes(1)
            })

            // Change authToken
            rerender({authToken: 'token2'})

            await waitFor(() => {
                expect(mockGetPaymentMethods).toHaveBeenCalledTimes(2)
            })

            expect(AdyenPaymentMethodsService).toHaveBeenCalledWith('token2', mockSite)
        })

        it('should refetch when site changes', async () => {
            mockGetPaymentMethods.mockResolvedValue(mockPaymentMethods)

            const {rerender} = renderHook(
                ({site}) => useStandalonePaymentMethods(mockAuthToken, mockRefreshToken, site, mockLocale, true, mockUpdateTokens),
                {
                    initialProps: {site: mockSite}
                }
            )

            await waitFor(() => {
                expect(mockGetPaymentMethods).toHaveBeenCalledTimes(1)
            })

            // Change site
            const newSite = {id: 'new-site', name: 'New Site'}
            rerender({site: newSite})

            await waitFor(() => {
                expect(mockGetPaymentMethods).toHaveBeenCalledTimes(2)
            })

            expect(AdyenPaymentMethodsService).toHaveBeenCalledWith(mockAuthToken, newSite)
        })

        it('should refetch when locale changes', async () => {
            mockGetPaymentMethods.mockResolvedValue(mockPaymentMethods)

            const {rerender} = renderHook(
                ({locale}) => useStandalonePaymentMethods(mockAuthToken, mockRefreshToken, mockSite, locale, true, mockUpdateTokens),
                {
                    initialProps: {locale: mockLocale}
                }
            )

            await waitFor(() => {
                expect(mockGetPaymentMethods).toHaveBeenCalledTimes(1)
            })

            // Change locale
            const newLocale = {id: 'de-DE', currency: 'EUR'}
            rerender({locale: newLocale})

            await waitFor(() => {
                expect(mockGetPaymentMethods).toHaveBeenCalledTimes(2)
            })
        })

        it('should refetch when enabled changes', async () => {
            mockGetPaymentMethods.mockResolvedValue(mockPaymentMethods)

            const {rerender} = renderHook(
                ({enabled}) =>
                    useStandalonePaymentMethods(mockAuthToken, mockRefreshToken, mockSite, mockLocale, enabled, mockUpdateTokens),
                {
                    initialProps: {enabled: true}
                }
            )

            await waitFor(() => {
                expect(mockGetPaymentMethods).toHaveBeenCalledTimes(1)
            })

            // Disable and re-enable
            rerender({enabled: false})
            rerender({enabled: true})

            await waitFor(() => {
                expect(mockGetPaymentMethods).toHaveBeenCalledTimes(2)
            })
        })
    })

    describe('loading states', () => {
        it('should set loading to true during API call', async () => {
            let resolvePromise
            const promise = new Promise((resolve) => {
                resolvePromise = resolve
            })
            mockGetPaymentMethods.mockReturnValueOnce(promise)

            const {result} = renderHook(() =>
                useStandalonePaymentMethods(mockAuthToken, mockRefreshToken, mockSite, mockLocale, true, mockUpdateTokens)
            )

            // Should be loading
            expect(result.current.loading).toBe(true)
            expect(result.current.paymentMethods).toBeNull()
            expect(result.current.error).toBeNull()

            // Resolve the promise
            resolvePromise(mockPaymentMethods)

            await waitFor(() => {
                expect(result.current.loading).toBe(false)
            })

            expect(result.current.paymentMethods).toEqual(mockPaymentMethods)
        })

        it('should set loading to false after error', async () => {
            const mockError = new Error('Test error')
            mockGetPaymentMethods.mockRejectedValueOnce(mockError)

            const {result} = renderHook(() =>
                useStandalonePaymentMethods(mockAuthToken, mockRefreshToken, mockSite, mockLocale, true, mockUpdateTokens)
            )

            expect(result.current.loading).toBe(true)

            await waitFor(() => {
                expect(result.current.loading).toBe(false)
            })

            expect(result.current.error).toBe(mockError)
        })
    })
})
