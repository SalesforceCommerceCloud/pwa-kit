/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {renderHook} from '@testing-library/react'
import {ShopperBaskets, ShopperProducts} from 'commerce-sdk-isomorphic'
import {useResolvedClient} from './useResolvedClient'
import useCommerceApi from './useCommerceApi'
import {ApiClients} from './types'

// Mock the useCommerceApi hook
jest.mock('./useCommerceApi')
const mockUseCommerceApi = useCommerceApi as jest.MockedFunction<typeof useCommerceApi>

describe('useResolvedClient', () => {
    // Required config for creating client instances
    const mockConfig = {
        shortCode: 'test-shortcode',
        clientId: 'test-client-id',
        organizationId: 'test-org-id',
        siteId: 'test-site-id'
    }

    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('when client exists', () => {
        test('returns the client for shopperBaskets', () => {
            const mockShopperBaskets = new ShopperBaskets({parameters: mockConfig})
            const mockApiClients: ApiClients = {
                shopperBaskets: mockShopperBaskets,
                shopperProducts: undefined
            }

            mockUseCommerceApi.mockReturnValue(mockApiClients)

            const {result} = renderHook(() => useResolvedClient('shopperBaskets'))

            expect(result.current).toBe(mockShopperBaskets)
            expect(useCommerceApi).toHaveBeenCalledTimes(1)
        })

        test('returns the client for shopperProducts', () => {
            const mockShopperProducts = new ShopperProducts({parameters: mockConfig})
            const mockApiClients: ApiClients = {
                shopperBaskets: undefined,
                shopperProducts: mockShopperProducts
            }

            mockUseCommerceApi.mockReturnValue(mockApiClients)

            const {result} = renderHook(() => useResolvedClient('shopperProducts'))

            expect(result.current).toBe(mockShopperProducts)
            expect(useCommerceApi).toHaveBeenCalledTimes(1)
        })

        test('returns the client when multiple clients are available', () => {
            const mockShopperBaskets = new ShopperBaskets({parameters: mockConfig})
            const mockShopperProducts = new ShopperProducts({parameters: mockConfig})
            const mockApiClients: ApiClients = {
                shopperBaskets: mockShopperBaskets,
                shopperProducts: mockShopperProducts
            }

            mockUseCommerceApi.mockReturnValue(mockApiClients)

            const {result: basketsResult} = renderHook(() => useResolvedClient('shopperBaskets'))
            const {result: productsResult} = renderHook(() => useResolvedClient('shopperProducts'))

            expect(basketsResult.current).toBe(mockShopperBaskets)
            expect(productsResult.current).toBe(mockShopperProducts)
        })
    })

    describe('when client does not exist', () => {
        test('throws error when shopperBaskets is undefined', () => {
            const mockApiClients: ApiClients = {
                shopperBaskets: undefined,
                shopperProducts: new ShopperProducts({parameters: mockConfig})
            }

            mockUseCommerceApi.mockReturnValue(mockApiClients)

            expect(() => {
                renderHook(() => useResolvedClient('shopperBaskets'))
            }).toThrow(
                'Missing required client: shopperBaskets. ' +
                    "Please initialize shopperBaskets class and provide it in CommerceApiProvider's apiClients prop."
            )
        })

        test('throws error when shopperProducts is undefined', () => {
            const mockApiClients: ApiClients = {
                shopperBaskets: new ShopperBaskets({parameters: mockConfig}),
                shopperProducts: undefined
            }

            mockUseCommerceApi.mockReturnValue(mockApiClients)

            expect(() => {
                renderHook(() => useResolvedClient('shopperProducts'))
            }).toThrow(
                'Missing required client: shopperProducts. ' +
                    "Please initialize shopperProducts class and provide it in CommerceApiProvider's apiClients prop."
            )
        })

        test('throws error when all clients are undefined', () => {
            const mockApiClients: ApiClients = {}

            mockUseCommerceApi.mockReturnValue(mockApiClients)

            expect(() => {
                renderHook(() => useResolvedClient('shopperBaskets'))
            }).toThrow(
                'Missing required client: shopperBaskets. ' +
                    "Please initialize shopperBaskets class and provide it in CommerceApiProvider's apiClients prop."
            )
        })

        test('throws error when client is null', () => {
            const mockApiClients: ApiClients = {
                // @ts-expect-error - testing null case
                shopperBaskets: null
            }

            mockUseCommerceApi.mockReturnValue(mockApiClients)

            expect(() => {
                renderHook(() => useResolvedClient('shopperBaskets'))
            }).toThrow(
                'Missing required client: shopperBaskets. ' +
                    "Please initialize shopperBaskets class and provide it in CommerceApiProvider's apiClients prop."
            )
        })
    })

    describe('error message formatting', () => {
        test('includes correct client name in error message', () => {
            const clientNames: (keyof ApiClients)[] = [
                'shopperBaskets',
                'shopperProducts',
                'shopperCustomers',
                'shopperLogin',
                'shopperOrders'
            ]

            clientNames.forEach((clientName) => {
                const mockApiClients: ApiClients = {}
                mockUseCommerceApi.mockReturnValue(mockApiClients)

                expect(() => {
                    renderHook(() => useResolvedClient(clientName))
                }).toThrow(
                    `Missing required client: ${clientName}. ` +
                        `Please initialize ${clientName} class and provide it in CommerceApiProvider's apiClients prop.`
                )
            })
        })
    })

    describe('integration with useCommerceApi', () => {
        test('calls useCommerceApi exactly once per hook invocation', () => {
            const mockShopperBaskets = new ShopperBaskets({parameters: mockConfig})
            const mockApiClients: ApiClients = {
                shopperBaskets: mockShopperBaskets
            }

            mockUseCommerceApi.mockReturnValue(mockApiClients)

            const {result, rerender} = renderHook(() => useResolvedClient('shopperBaskets'))

            expect(useCommerceApi).toHaveBeenCalledTimes(1)
            expect(result.current).toBe(mockShopperBaskets)

            // Re-render should call useCommerceApi again
            rerender()
            expect(useCommerceApi).toHaveBeenCalledTimes(2)
        })

        test('uses the latest API clients from useCommerceApi', () => {
            const mockShopperBaskets1 = new ShopperBaskets({parameters: mockConfig})
            const mockShopperBaskets2 = new ShopperBaskets({
                parameters: {...mockConfig, siteId: 'different-site'}
            })

            // First render with first client
            mockUseCommerceApi.mockReturnValueOnce({
                shopperBaskets: mockShopperBaskets1
            })

            const {result, rerender} = renderHook(() => useResolvedClient('shopperBaskets'))

            expect(result.current).toBe(mockShopperBaskets1)

            // Second render with different client
            mockUseCommerceApi.mockReturnValueOnce({
                shopperBaskets: mockShopperBaskets2
            })

            rerender()

            expect(result.current).toBe(mockShopperBaskets2)
        })
    })
})
