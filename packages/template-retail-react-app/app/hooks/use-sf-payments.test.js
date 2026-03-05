/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'
import {render, screen, waitFor, act, renderHook} from '@testing-library/react'
import {
    useSFPayments,
    useSFPaymentsEnabled,
    useAutomaticCapture,
    useFutureUsageOffSession,
    EXPRESS_BUY_NOW,
    EXPRESS_PAY_NOW,
    STATUS_SUCCESS,
    store as sfPaymentsStore
} from '@salesforce/retail-react-app/app/hooks/use-sf-payments'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {rest} from 'msw'
// Mock dependencies
const mockUseScript = jest.fn()
const mockGetConfig = jest.fn()
const mockUseAppOrigin = jest.fn()
const mockFetch = jest.fn()
const mockUseShopperConfiguration = jest.fn()

jest.mock('@salesforce/retail-react-app/app/hooks/use-script', () => ({
    __esModule: true,
    default: () => mockUseScript()
}))

jest.mock('@salesforce/pwa-kit-runtime/utils/ssr-config', () => ({
    getConfig: () => mockGetConfig()
}))

jest.mock('@salesforce/retail-react-app/app/hooks/use-app-origin', () => ({
    useAppOrigin: () => mockUseAppOrigin()
}))

jest.mock('@salesforce/retail-react-app/app/hooks/use-shopper-configuration', () => ({
    useShopperConfiguration: (configId) => mockUseShopperConfiguration(configId)
}))

// Mock SFPayments class
class MockSFPayments {
    constructor() {
        this.initialized = true
    }

    checkout() {
        return {confirm: jest.fn()}
    }
}

// Test component that uses the hook
const TestComponent = ({onHookData}) => {
    const hookData = useSFPayments()

    React.useEffect(() => {
        if (onHookData) {
            onHookData(hookData)
        }
    }, [hookData, onHookData])

    return (
        <div>
            <div data-testid="sfp-loaded">{hookData.sfp ? 'loaded' : 'not-loaded'}</div>
            <div data-testid="metadata-loading">
                {hookData.isMetadataLoading ? 'loading' : 'not-loading'}
            </div>
            <div data-testid="metadata">{JSON.stringify(hookData.metadata)}</div>
            <div data-testid="confirming-basket">
                {hookData.confirmingBasket ? 'confirming' : 'not-confirming'}
            </div>
        </div>
    )
}

TestComponent.propTypes = {
    onHookData: PropTypes.func
}
// Helper to render with providers
const renderWithQueryClient = (ui) => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
                cacheTime: 0
            }
        }
    })

    return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

describe('useSFPayments hook', () => {
    beforeEach(() => {
        jest.clearAllMocks()

        // Reset global state - don't try to redefine window, just delete the property
        if (global.window && global.window.SFPayments) {
            delete global.window.SFPayments
        }

        // Reset the store state
        sfPaymentsStore.sfp = null
        sfPaymentsStore.confirmingBasket = null

        // Reset fetch mock
        global.fetch = mockFetch
        global.server.resetHandlers()

        global.server.use(
            rest.get('/api/payment-metadata', (req, res, ctx) => {
                return res(
                    ctx.delay(0),
                    ctx.status(200),
                    ctx.json({apiKey: 'test-key', publishableKey: 'pk_test'})
                )
            })
        )
        // Default mock implementations
        mockUseScript.mockReturnValue({loaded: false, error: false})
        mockGetConfig.mockReturnValue({
            app: {
                sfPayments: {
                    sdkUrl: 'https://test.sfpayments.com/sdk.js',
                    metadataUrl: 'https://test.sfpayments.com/metadata'
                }
            }
        })
        mockUseAppOrigin.mockReturnValue('https://test-origin.com')
        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => ({apiKey: 'test-key', publishableKey: 'pk_test'})
        })
    })

    afterEach(() => {
        jest.clearAllMocks()
        if (global.window && global.window.SFPayments) {
            delete global.window.SFPayments
        }
        // Clean up any rendered components
        document.body.innerHTML = ''
        sfPaymentsStore.sfp = null
        sfPaymentsStore.confirmingBasket = null
    })

    describe('constants', () => {
        test('exports correct constant values', () => {
            expect(EXPRESS_BUY_NOW).toBe(0)
            expect(EXPRESS_PAY_NOW).toBe(1)
            expect(STATUS_SUCCESS).toBe(0)
        })
    })

    describe('initialization', () => {
        test('returns initial state when script not loaded', () => {
            renderWithQueryClient(<TestComponent />)

            expect(screen.getByTestId('sfp-loaded').textContent).toBe('not-loaded')
            expect(screen.getByTestId('metadata-loading').textContent).toBe('loading')
        })

        test('creates SFPayments instance when script loads', async () => {
            global.window.SFPayments = MockSFPayments
            mockUseScript.mockReturnValue({loaded: true, error: false})

            renderWithQueryClient(<TestComponent />)

            await waitFor(() => {
                expect(screen.getByTestId('sfp-loaded').textContent).toBe('loaded')
            })
        })

        test('does not create SFPayments instance if window.SFPayments is not defined', async () => {
            mockUseScript.mockReturnValue({loaded: true, error: false})

            renderWithQueryClient(<TestComponent />)

            await waitFor(() => {
                expect(screen.getByTestId('sfp-loaded').textContent).toBe('not-loaded')
            })
        })

        test('only creates SFPayments instance once', async () => {
            const SFPaymentsSpy = jest.fn().mockImplementation(function () {
                this.initialized = true
            })
            global.window.SFPayments = SFPaymentsSpy
            mockUseScript.mockReturnValue({loaded: true, error: false})

            // First render
            const {unmount: unmount1} = renderWithQueryClient(<TestComponent />)

            await waitFor(() => {
                expect(screen.getAllByTestId('sfp-loaded')[0].textContent).toBe('loaded')
            })

            unmount1()

            // Second render - should reuse existing instance
            renderWithQueryClient(<TestComponent />)

            await waitFor(() => {
                expect(screen.getByTestId('sfp-loaded').textContent).toBe('loaded')
            })

            // Should only be called once across both renders
            expect(SFPaymentsSpy).toHaveBeenCalledTimes(1)
        })
    })

    describe('metadata loading', () => {
        test('fetches payment metadata from API', async () => {
            const mockMetadata = {apiKey: 'test-key', publishableKey: 'pk_test'}
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => mockMetadata
            })

            renderWithQueryClient(<TestComponent />)

            await waitFor(() => {
                expect(mockFetch).toHaveBeenCalledWith(
                    'https://test-origin.com/api/payment-metadata'
                )
            })

            await waitFor(() => {
                expect(screen.getByTestId('metadata').textContent).toBe(
                    JSON.stringify(mockMetadata)
                )
            })
        })

        test('handles metadata fetch error', async () => {
            // Suppress expected error message
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

            mockFetch.mockResolvedValue({
                ok: false
            })

            global.server.use(
                rest.get('*/api/payment-metadata', (req, res, ctx) => {
                    return res(ctx.delay(0), ctx.status(500))
                })
            )
            renderWithQueryClient(<TestComponent />)

            await waitFor(() => {
                expect(mockFetch).toHaveBeenCalled()
            })

            // Metadata should remain undefined on error
            await waitFor(() => {
                expect(screen.getByTestId('metadata').textContent).toBe('')
            })

            await waitFor(() => {
                expect(consoleErrorSpy).toHaveBeenCalled()
                // Check that it was called with an Error containing the message
                const errorCall = consoleErrorSpy.mock.calls.find(
                    (call) =>
                        call[0]?.message === 'Failed to load payment metadata' ||
                        call[0]?.toString().includes('Failed to load payment metadata')
                )
                expect(errorCall).toBeDefined()
            })

            // Restore console.error
            consoleErrorSpy.mockRestore()
        })

        test('uses correct app origin for metadata request', async () => {
            mockUseAppOrigin.mockReturnValue('https://custom-origin.com')

            global.server.use(
                rest.get('*/api/payment-metadata', (req, res, ctx) => {
                    return res(
                        ctx.delay(0),
                        ctx.status(200),
                        ctx.json({apiKey: 'test-key', publishableKey: 'pk_test'})
                    )
                })
            )
            renderWithQueryClient(<TestComponent />)

            await waitFor(() => {
                expect(mockFetch).toHaveBeenCalledWith(
                    'https://custom-origin.com/api/payment-metadata'
                )
            })
        })
    })

    describe('metadata query guard', () => {
        test('does not fetch metadata when metadataUrl is empty', async () => {
            mockGetConfig.mockReturnValue({
                app: {
                    sfPayments: {
                        sdkUrl: 'https://test.sfpayments.com/sdk.js',
                        metadataUrl: ''
                    }
                }
            })

            renderWithQueryClient(<TestComponent />)

            await waitFor(() => {
                expect(mockFetch).not.toHaveBeenCalled()
            })
        })

        test('does not fetch metadata when sfPayments is disabled', async () => {
            mockGetConfig.mockReturnValue({
                app: {
                    sfPayments: {
                        enabled: false,
                        sdkUrl: 'https://test.sfpayments.com/sdk.js',
                        metadataUrl: 'https://test.sfpayments.com/metadata'
                    }
                }
            })

            renderWithQueryClient(<TestComponent />)

            await waitFor(() => {
                expect(mockFetch).not.toHaveBeenCalled()
            })
        })
    })

    describe('confirming basket state', () => {
        test('startConfirming updates confirmingBasket', async () => {
            let hookData
            const onHookData = jest.fn((data) => {
                hookData = data
            })

            renderWithQueryClient(<TestComponent onHookData={onHookData} />)

            await waitFor(() => {
                expect(onHookData).toHaveBeenCalled()
            })

            expect(screen.getByTestId('confirming-basket').textContent).toBe('not-confirming')

            // Start confirming
            const mockBasket = {basketId: 'test-basket-123', orderTotal: 100}
            act(() => {
                hookData.startConfirming(mockBasket)
            })

            await waitFor(() => {
                expect(screen.getByTestId('confirming-basket').textContent).toBe('confirming')
            })
        })

        test('endConfirming clears confirmingBasket', async () => {
            let latestHookData
            const onHookData = jest.fn((data) => {
                latestHookData = data
            })

            renderWithQueryClient(<TestComponent onHookData={onHookData} />)

            await waitFor(() => {
                expect(onHookData).toHaveBeenCalled()
            })

            // Start confirming
            const mockBasket = {basketId: 'test-basket-123'}
            act(() => {
                latestHookData.startConfirming(mockBasket)
            })

            // Wait for component to re-render with new state
            await waitFor(() => {
                expect(sfPaymentsStore.confirmingBasket).toEqual(mockBasket)
            })

            // End confirming
            act(() => {
                latestHookData.endConfirming()
            })

            // Wait for store to update
            await waitFor(
                () => {
                    expect(sfPaymentsStore.confirmingBasket).toBeNull()
                },
                {timeout: 2000}
            )
        })

        test('confirmingBasket state persists across rerenders', async () => {
            let hookData
            const onHookData = jest.fn((data) => {
                hookData = data
            })

            const queryClient = new QueryClient({
                defaultOptions: {
                    queries: {retry: false}
                }
            })

            const {rerender} = render(
                <QueryClientProvider client={queryClient}>
                    <TestComponent onHookData={onHookData} />
                </QueryClientProvider>
            )

            await waitFor(() => {
                expect(onHookData).toHaveBeenCalled()
            })

            // Start confirming
            const mockBasket = {basketId: 'test-basket-123'}
            act(() => {
                hookData.startConfirming(mockBasket)
            })

            await waitFor(() => {
                expect(hookData.confirmingBasket).toEqual(mockBasket)
            })

            // Rerender with the same QueryClientProvider
            rerender(
                <QueryClientProvider client={queryClient}>
                    <TestComponent onHookData={onHookData} />
                </QueryClientProvider>
            )

            // State should persist
            await waitFor(() => {
                expect(hookData.confirmingBasket).toEqual(mockBasket)
            })
        })
    })

    describe('state synchronization', () => {
        test('multiple components share the same store state', async () => {
            global.window.SFPayments = MockSFPayments
            mockUseScript.mockReturnValue({loaded: true, error: false})

            let hookData1
            let hookData2

            const TestComponent1 = () => {
                hookData1 = useSFPayments()
                return <div data-testid="component-1">Component 1</div>
            }

            const TestComponent2 = () => {
                hookData2 = useSFPayments()
                return <div data-testid="component-2">Component 2</div>
            }

            const queryClient = new QueryClient({
                defaultOptions: {
                    queries: {retry: false}
                }
            })

            render(
                <QueryClientProvider client={queryClient}>
                    <TestComponent1 />
                    <TestComponent2 />
                </QueryClientProvider>
            )

            await waitFor(() => {
                expect(hookData1?.sfp).toBeDefined()
                expect(hookData2?.sfp).toBeDefined()
            })

            // Both should reference the same SFP instance
            expect(hookData1.sfp).toBe(hookData2.sfp)

            // Start confirming in component 1
            const mockBasket = {basketId: 'shared-basket'}
            act(() => {
                hookData1.startConfirming(mockBasket)
            })

            await waitFor(() => {
                // Both components should see the same confirming basket
                expect(hookData1.confirmingBasket).toEqual(mockBasket)
                expect(hookData2.confirmingBasket).toEqual(mockBasket)
            })
        })
    })

    describe('return value', () => {
        test('returns all expected properties', async () => {
            let hookData
            const onHookData = jest.fn((data) => {
                hookData = data
            })

            renderWithQueryClient(<TestComponent onHookData={onHookData} />)

            await waitFor(() => {
                expect(onHookData).toHaveBeenCalled()
            })

            expect(hookData).toHaveProperty('sfp')
            expect(hookData).toHaveProperty('metadata')
            expect(hookData).toHaveProperty('isMetadataLoading')
            expect(hookData).toHaveProperty('confirmingBasket')
            expect(hookData).toHaveProperty('startConfirming')
            expect(hookData).toHaveProperty('endConfirming')
            expect(typeof hookData.startConfirming).toBe('function')
            expect(typeof hookData.endConfirming).toBe('function')
        })

        test('isMetadataLoading updates correctly', async () => {
            let resolveMetadata
            mockFetch.mockReturnValue(
                new Promise((resolve) => {
                    resolveMetadata = resolve
                })
            )

            renderWithQueryClient(<TestComponent />)

            // Should be loading initially
            expect(screen.getByTestId('metadata-loading').textContent).toBe('loading')

            // Resolve the metadata
            await act(async () => {
                resolveMetadata({
                    ok: true,
                    json: async () => ({apiKey: 'test'})
                })
            })

            await waitFor(() => {
                expect(screen.getByTestId('metadata-loading').textContent).toBe('not-loading')
            })
        })
    })

    describe('edge cases', () => {
        test('handles script loading without window.SFPayments available', async () => {
            // Ensure window.SFPayments is not available
            // Reset global state - don't try to redefine window, just delete the property
            if (global.window && global.window.SFPayments) {
                delete global.window.SFPayments
            }
            sfPaymentsStore.sfp = null
            mockUseScript.mockReturnValue({loaded: true, error: false})

            renderWithQueryClient(<TestComponent />)

            // Even if script is loaded, SFP won't be initialized without window.SFPayments
            await waitFor(() => {
                expect(screen.getByTestId('sfp-loaded').textContent).toBe('not-loaded')
            })
        })

        test('handles multiple calls to startConfirming', async () => {
            let latestHookData
            const onHookData = jest.fn((data) => {
                latestHookData = data
            })

            renderWithQueryClient(<TestComponent onHookData={onHookData} />)

            await waitFor(() => {
                expect(onHookData).toHaveBeenCalled()
            })

            // Start confirming with first basket
            const mockBasket1 = {basketId: 'basket-1'}
            act(() => {
                latestHookData.startConfirming(mockBasket1)
            })

            // Wait for store to update
            await waitFor(
                () => {
                    expect(sfPaymentsStore.confirmingBasket).toEqual(mockBasket1)
                },
                {timeout: 2000}
            )

            // Start confirming with second basket (replaces first)
            const mockBasket2 = {basketId: 'basket-2'}
            act(() => {
                latestHookData.startConfirming(mockBasket2)
            })

            // Wait for store to update
            await waitFor(
                () => {
                    expect(sfPaymentsStore.confirmingBasket).toEqual(mockBasket2)
                },
                {timeout: 2000}
            )
        })
    })
})

describe('useSFPaymentsEnabled hook', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('returns true when SalesforcePaymentsAllowed is true', () => {
        mockUseShopperConfiguration.mockReturnValue(true)

        const {result} = renderHook(() => useSFPaymentsEnabled())

        expect(result.current).toBe(true)
        expect(mockUseShopperConfiguration).toHaveBeenCalledWith('SalesforcePaymentsAllowed')
    })

    test('returns false when SalesforcePaymentsAllowed is false', () => {
        mockUseShopperConfiguration.mockReturnValue(false)

        const {result} = renderHook(() => useSFPaymentsEnabled())

        expect(result.current).toBe(false)
        expect(mockUseShopperConfiguration).toHaveBeenCalledWith('SalesforcePaymentsAllowed')
    })

    test('returns false when SalesforcePaymentsAllowed is undefined', () => {
        mockUseShopperConfiguration.mockReturnValue(undefined)

        const {result} = renderHook(() => useSFPaymentsEnabled())

        expect(result.current).toBe(false)
        expect(mockUseShopperConfiguration).toHaveBeenCalledWith('SalesforcePaymentsAllowed')
    })
})

describe('useAutomaticCapture hook', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('returns true when cardCaptureAutomatic is true', () => {
        mockUseShopperConfiguration.mockReturnValue(true)

        const {result} = renderHook(() => useAutomaticCapture())

        expect(result.current).toBe(true)
        expect(mockUseShopperConfiguration).toHaveBeenCalledWith('cardCaptureAutomatic')
    })

    test('returns false when cardCaptureAutomatic is false', () => {
        mockUseShopperConfiguration.mockReturnValue(false)

        const {result} = renderHook(() => useAutomaticCapture())

        expect(result.current).toBe(false)
        expect(mockUseShopperConfiguration).toHaveBeenCalledWith('cardCaptureAutomatic')
    })

    test('returns true (default) when cardCaptureAutomatic is undefined', () => {
        mockUseShopperConfiguration.mockReturnValue(undefined)

        const {result} = renderHook(() => useAutomaticCapture())

        expect(result.current).toBe(true)
        expect(mockUseShopperConfiguration).toHaveBeenCalledWith('cardCaptureAutomatic')
    })
})

describe('useFutureUsageOffSession hook', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('returns true when futureUsageOffSession is true', () => {
        mockUseShopperConfiguration.mockReturnValue(true)

        const {result} = renderHook(() => useFutureUsageOffSession())

        expect(result.current).toBe(true)
        expect(mockUseShopperConfiguration).toHaveBeenCalledWith('futureUsageOffSession')
    })

    test('returns false when futureUsageOffSession is false', () => {
        mockUseShopperConfiguration.mockReturnValue(false)

        const {result} = renderHook(() => useFutureUsageOffSession())

        expect(result.current).toBe(false)
        expect(mockUseShopperConfiguration).toHaveBeenCalledWith('futureUsageOffSession')
    })

    test('returns false (default) when futureUsageOffSession is undefined', () => {
        mockUseShopperConfiguration.mockReturnValue(undefined)

        const {result} = renderHook(() => useFutureUsageOffSession())

        expect(result.current).toBe(false)
        expect(mockUseShopperConfiguration).toHaveBeenCalledWith('futureUsageOffSession')
    })

    test('returns false (default) when futureUsageOffSession is null', () => {
        mockUseShopperConfiguration.mockReturnValue(null)

        const {result} = renderHook(() => useFutureUsageOffSession())

        expect(result.current).toBe(false)
        expect(mockUseShopperConfiguration).toHaveBeenCalledWith('futureUsageOffSession')
    })
})
