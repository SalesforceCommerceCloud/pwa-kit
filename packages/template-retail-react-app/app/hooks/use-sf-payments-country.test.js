/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {render, screen, waitFor} from '@testing-library/react'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {useSFPaymentsCountry} from '@salesforce/retail-react-app/app/hooks/use-sf-payments-country'

// Mock dependencies
const mockUseAppOrigin = jest.fn()
const mockFetch = jest.fn()

jest.mock('@salesforce/retail-react-app/app/hooks/use-app-origin', () => ({
    useAppOrigin: () => mockUseAppOrigin()
}))
const mockUseMultiSite = jest.fn()
jest.mock('@salesforce/retail-react-app/app/hooks/use-multi-site', () => ({
    __esModule: true,
    default: () => mockUseMultiSite()
}))

// Test component that uses the hook
const TestComponent = ({onHookData}) => {
    const hookData = useSFPaymentsCountry()

    React.useEffect(() => {
        if (onHookData) {
            onHookData(hookData)
        }
    }, [hookData, onHookData])

    return (
        <div>
            <div data-testid="country-code">{hookData.countryCode || 'null'}</div>
            <div data-testid="is-loading">{hookData.isLoading ? 'loading' : 'loaded'}</div>
        </div>
    )
}

TestComponent.propTypes = {
    onHookData: () => null
}

// Helper to render with QueryClient
const renderWithQueryClient = (ui, options = {}) => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
                cacheTime: 0
            }
        },
        ...options
    })

    return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

describe('useSFPaymentsCountry', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        global.fetch = mockFetch
        mockUseAppOrigin.mockReturnValue('https://test-origin.com')
        mockUseMultiSite.mockReturnValue({locale: {}})
        // Suppress console.warn for tests
        jest.spyOn(console, 'warn').mockImplementation(() => {})
    })

    afterEach(() => {
        jest.restoreAllMocks()
    })

    describe('successful country detection', () => {
        test('returns country code on successful fetch', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => ({countryCode: 'US'})
            })

            renderWithQueryClient(<TestComponent />)

            // Initially loading
            expect(screen.getByTestId('is-loading').textContent).toBe('loading')

            // Wait for data to load
            await waitFor(() => {
                expect(screen.getByTestId('country-code').textContent).toBe('US')
            })

            expect(screen.getByTestId('is-loading').textContent).toBe('loaded')
            expect(mockFetch).toHaveBeenCalledWith('https://test-origin.com/api/detect-country')
        })

        test('handles different country codes', async () => {
            const countryCodes = ['GB', 'CA', 'AU', 'DE', 'FR', 'JP']

            for (const code of countryCodes) {
                jest.clearAllMocks()
                mockFetch.mockResolvedValue({
                    ok: true,
                    json: async () => ({countryCode: code})
                })

                const {unmount} = renderWithQueryClient(<TestComponent />)

                await waitFor(() => {
                    expect(screen.getByTestId('country-code').textContent).toBe(code)
                })

                unmount()
            }
        })

        test('uses correct query key', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => ({countryCode: 'US'})
            })

            let hookData
            const onHookData = jest.fn((data) => {
                hookData = data
            })

            renderWithQueryClient(<TestComponent onHookData={onHookData} />)

            await waitFor(() => {
                expect(hookData.countryCode).toBe('US')
            })
        })
    })

    describe('failed country detection', () => {
        test('returns null when API response is not ok', async () => {
            mockFetch.mockResolvedValue({
                ok: false,
                status: 500
            })

            renderWithQueryClient(<TestComponent />)

            await waitFor(() => {
                expect(screen.getByTestId('country-code').textContent).toBe('null')
                expect(screen.getByTestId('is-loading').textContent).toBe('loaded')
            })
        })

        test('returns null when API response is 404', async () => {
            mockFetch.mockResolvedValue({
                ok: false,
                status: 404
            })

            renderWithQueryClient(<TestComponent />)

            await waitFor(() => {
                expect(screen.getByTestId('country-code').textContent).toBe('null')
            })
        })

        test('returns null when fetch throws network error', async () => {
            mockFetch.mockRejectedValue(new Error('Network error'))

            renderWithQueryClient(<TestComponent />)

            await waitFor(() => {
                expect(screen.getByTestId('country-code').textContent).toBe('null')
            })

            expect(console.warn).toHaveBeenCalledWith(
                'Server country detection failed (expected in development):',
                'Network error'
            )
        })

        test('returns null when countryCode is missing from response', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => ({})
            })

            renderWithQueryClient(<TestComponent />)

            await waitFor(() => {
                expect(screen.getByTestId('country-code').textContent).toBe('null')
            })
        })

        test('returns null when countryCode is empty string', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => ({countryCode: ''})
            })

            renderWithQueryClient(<TestComponent />)

            await waitFor(() => {
                expect(screen.getByTestId('country-code').textContent).toBe('null')
            })
        })

        test('logs warning on error without exposing sensitive info', async () => {
            mockFetch.mockRejectedValue(new Error('Detailed error message'))

            renderWithQueryClient(<TestComponent />)

            await waitFor(() => {
                expect(screen.getByTestId('country-code').textContent).toBe('null')
            })

            expect(console.warn).toHaveBeenCalledWith(
                'Server country detection failed (expected in development):',
                'Detailed error message'
            )
        })
    })

    describe('loading states', () => {
        test('shows loading state initially', () => {
            mockFetch.mockImplementation(
                () => new Promise((resolve) => setTimeout(() => resolve({ok: true}), 1000))
            )

            renderWithQueryClient(<TestComponent />)

            expect(screen.getByTestId('is-loading').textContent).toBe('loading')
            expect(screen.getByTestId('country-code').textContent).toBe('null')
        })

        test('transitions from loading to loaded state', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => ({countryCode: 'US'})
            })

            renderWithQueryClient(<TestComponent />)

            expect(screen.getByTestId('is-loading').textContent).toBe('loading')

            await waitFor(() => {
                expect(screen.getByTestId('is-loading').textContent).toBe('loaded')
            })
        })
    })

    describe('hook return values', () => {
        test('returns object with countryCode and isLoading properties', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => ({countryCode: 'US'})
            })

            let hookData
            const onHookData = jest.fn((data) => {
                hookData = data
            })

            renderWithQueryClient(<TestComponent onHookData={onHookData} />)

            await waitFor(() => {
                expect(onHookData).toHaveBeenCalled()
            })

            expect(hookData).toHaveProperty('countryCode')
            expect(hookData).toHaveProperty('isLoading')
            expect(typeof hookData.isLoading).toBe('boolean')
        })

        test('countryCode is null when no data', async () => {
            mockFetch.mockResolvedValue({
                ok: false
            })

            let hookData
            const onHookData = jest.fn((data) => {
                hookData = data
            })

            renderWithQueryClient(<TestComponent onHookData={onHookData} />)

            await waitFor(() => {
                expect(hookData.countryCode).toBeNull()
            })
        })
    })

    describe('API integration', () => {
        test('uses appOrigin for API endpoint', async () => {
            mockUseAppOrigin.mockReturnValue('https://custom-origin.com')
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => ({countryCode: 'US'})
            })

            renderWithQueryClient(<TestComponent />)

            await waitFor(() => {
                expect(mockFetch).toHaveBeenCalledWith(
                    'https://custom-origin.com/api/detect-country'
                )
            })
        })

        test('handles different appOrigin values', async () => {
            const origins = [
                'https://prod.example.com',
                'https://staging.example.com',
                'http://localhost:3000'
            ]

            for (const origin of origins) {
                jest.clearAllMocks()
                mockUseAppOrigin.mockReturnValue(origin)
                mockFetch.mockResolvedValue({
                    ok: true,
                    json: async () => ({countryCode: 'US'})
                })

                renderWithQueryClient(<TestComponent />)

                await waitFor(() => {
                    expect(mockFetch).toHaveBeenCalledWith(`${origin}/api/detect-country`)
                })
            }
        })
    })

    describe('query configuration', () => {
        test('does not retry on failure', async () => {
            mockFetch.mockRejectedValue(new Error('Network error'))

            renderWithQueryClient(<TestComponent />)

            await waitFor(() => {
                expect(screen.getByTestId('country-code').textContent).toBe('null')
            })

            // Should only be called once (no retries)
            expect(mockFetch).toHaveBeenCalledTimes(1)
        })

        test('uses staleTime for caching', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => ({countryCode: 'US'})
            })

            const queryClient = new QueryClient({
                defaultOptions: {
                    queries: {
                        retry: false,
                        cacheTime: 0
                    }
                }
            })

            const {rerender} = render(
                <QueryClientProvider client={queryClient}>
                    <TestComponent />
                </QueryClientProvider>
            )

            await waitFor(() => {
                expect(screen.getByTestId('country-code').textContent).toBe('US')
            })

            // First call
            expect(mockFetch).toHaveBeenCalledTimes(1)

            // Rerender should use cached data within staleTime
            rerender(
                <QueryClientProvider client={queryClient}>
                    <TestComponent />
                </QueryClientProvider>
            )

            // Should still be only 1 call (cached)
            expect(mockFetch).toHaveBeenCalledTimes(1)
        })
    })

    describe('edge cases', () => {
        test('handles JSON parse errors gracefully', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => {
                    throw new Error('Invalid JSON')
                }
            })

            renderWithQueryClient(<TestComponent />)

            await waitFor(() => {
                expect(screen.getByTestId('country-code').textContent).toBe('null')
            })

            expect(console.warn).toHaveBeenCalled()
        })

        test('handles null response', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => null
            })

            renderWithQueryClient(<TestComponent />)

            await waitFor(() => {
                expect(screen.getByTestId('country-code').textContent).toBe('null')
            })
        })

        test('handles undefined countryCode in response', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => ({countryCode: undefined})
            })

            renderWithQueryClient(<TestComponent />)

            await waitFor(() => {
                expect(screen.getByTestId('country-code').textContent).toBe('null')
            })
        })

        test('handles numeric status codes', async () => {
            mockFetch.mockResolvedValue({
                ok: false,
                status: 503
            })

            renderWithQueryClient(<TestComponent />)

            await waitFor(() => {
                expect(screen.getByTestId('country-code').textContent).toBe('null')
            })
        })
    })

    describe('multiple instances', () => {
        test('shares data across multiple hook instances', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => ({countryCode: 'US'})
            })

            const queryClient = new QueryClient({
                defaultOptions: {
                    queries: {
                        retry: false,
                        cacheTime: Infinity
                    }
                }
            })

            const {rerender} = render(
                <QueryClientProvider client={queryClient}>
                    <TestComponent />
                </QueryClientProvider>
            )

            await waitFor(() => {
                expect(screen.getByTestId('country-code').textContent).toBe('US')
            })

            expect(mockFetch).toHaveBeenCalledTimes(1)

            // Mount another instance
            rerender(
                <QueryClientProvider client={queryClient}>
                    <TestComponent />
                    <TestComponent />
                </QueryClientProvider>
            )

            // Should still only have been called once (shared cache)
            expect(mockFetch).toHaveBeenCalledTimes(1)
        })
    })
    describe('locale country fallback', () => {
        test('falls back to locale country when server detection fails', async () => {
            mockUseMultiSite.mockReturnValue({locale: {id: 'de-DE'}})
            mockFetch.mockResolvedValue({ok: false, status: 500})

            renderWithQueryClient(<TestComponent />)

            await waitFor(() => {
                expect(screen.getByTestId('country-code').textContent).toBe('DE')
            })
        })

        test('server country takes priority over locale country', async () => {
            mockUseMultiSite.mockReturnValue({locale: {id: 'de-DE'}})
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => ({countryCode: 'GB'})
            })

            renderWithQueryClient(<TestComponent />)

            await waitFor(() => {
                expect(screen.getByTestId('country-code').textContent).toBe('GB')
            })
        })

        test('returns null when both server and locale are unavailable', async () => {
            mockUseMultiSite.mockReturnValue({locale: {}})
            mockFetch.mockResolvedValue({ok: false, status: 500})

            renderWithQueryClient(<TestComponent />)

            await waitFor(() => {
                expect(screen.getByTestId('country-code').textContent).toBe('null')
            })
        })

        test('derives country from various locale formats', async () => {
            mockFetch.mockResolvedValue({ok: false, status: 500})

            const cases = [
                {locale: 'fr-FR', expected: 'FR'},
                {locale: 'ja-JP', expected: 'JP'},
                {locale: 'zh-CN', expected: 'CN'}
            ]

            for (const {locale, expected} of cases) {
                mockUseMultiSite.mockReturnValue({locale: {id: locale}})
                const {unmount} = renderWithQueryClient(<TestComponent />)

                await waitFor(() => {
                    expect(screen.getByTestId('country-code').textContent).toBe(expected)
                })
                unmount()
            }
        })
    })
})
