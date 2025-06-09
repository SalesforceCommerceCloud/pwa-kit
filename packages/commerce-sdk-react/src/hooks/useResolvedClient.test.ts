/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { ShopperBaskets, ShopperProducts } from 'commerce-sdk-isomorphic'
import { renderHookWithProviders } from '../test-utils'
import { useResolvedClient } from './useResolvedClient'
import useCommerceApi from './useCommerceApi'

jest.mock('./useCommerceApi')

const mockedUseCommerceApi = useCommerceApi as jest.MockedFunction<typeof useCommerceApi>

describe('useResolvedClient', () => {
    const mockShopperBaskets = {} as ShopperBaskets<any>
    const mockShopperProducts = {} as ShopperProducts<any>

    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('returns client when it exists', () => {
        mockedUseCommerceApi.mockReturnValue({
            shopperBaskets: mockShopperBaskets,
            shopperProducts: mockShopperProducts
        } as any)

        const { result } = renderHookWithProviders(() => 
            useResolvedClient('shopperBaskets')
        )

        expect(result.current).toBe(mockShopperBaskets)
    })

    test('returns different client types correctly', () => {
        mockedUseCommerceApi.mockReturnValue({
            shopperBaskets: mockShopperBaskets,
            shopperProducts: mockShopperProducts
        } as any)

        const { result: basketsResult } = renderHookWithProviders(() => 
            useResolvedClient('shopperBaskets')
        )
        const { result: productsResult } = renderHookWithProviders(() => 
            useResolvedClient('shopperProducts')
        )

        expect(basketsResult.current).toBe(mockShopperBaskets)
        expect(productsResult.current).toBe(mockShopperProducts)
    })

    test('throws error when client is undefined', () => {
        mockedUseCommerceApi.mockReturnValue({
            shopperBaskets: undefined,
            shopperProducts: mockShopperProducts
        } as any)

        expect(() => {
            renderHookWithProviders(() => useResolvedClient('shopperBaskets'))
        }).toThrow(
            'Missing required client: shopperBaskets. Please initialize shopperBaskets class and provide it in CommerceApiProvider\'s apiClients prop.'
        )
    })

    test('throws error with correct client name for different clients', () => {
        mockedUseCommerceApi.mockReturnValue({
            shopperBaskets: mockShopperBaskets,
            shopperProducts: undefined
        } as any)

        expect(() => {
            renderHookWithProviders(() => useResolvedClient('shopperProducts'))
        }).toThrow(
            'Missing required client: shopperProducts. Please initialize shopperProducts class and provide it in CommerceApiProvider\'s apiClients prop.'
        )
    })

    test('throws error when no clients are provided', () => {
        mockedUseCommerceApi.mockReturnValue({} as any)

        expect(() => {
            renderHookWithProviders(() => useResolvedClient('shopperBaskets'))
        }).toThrow(
            'Missing required client: shopperBaskets. Please initialize shopperBaskets class and provide it in CommerceApiProvider\'s apiClients prop.'
        )
    })
})
