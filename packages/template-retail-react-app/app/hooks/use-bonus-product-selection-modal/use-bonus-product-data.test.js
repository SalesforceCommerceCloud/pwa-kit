/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {renderHook} from '@testing-library/react'
import {useBonusProductData} from '@salesforce/retail-react-app/app/hooks/use-bonus-product-selection-modal/use-bonus-product-data'

jest.mock('@salesforce/commerce-sdk-react', () => ({
    useProducts: jest.fn()
}))

jest.mock('@salesforce/retail-react-app/app/hooks/use-current-basket', () => ({
    useCurrentBasket: jest.fn()
}))

jest.mock('@salesforce/retail-react-app/app/utils/bonus-product', () => ({
    findAvailableBonusDiscountLineItemIds: jest.fn()
}))

import {useProducts} from '@salesforce/commerce-sdk-react'
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'
import {findAvailableBonusDiscountLineItemIds} from '@salesforce/retail-react-app/app/utils/bonus-product'

describe('useBonusProductData', () => {
    const mockBasket = {
        productItems: [
            {
                productId: 'product-1',
                bonusProductLineItem: true,
                bonusDiscountLineItemId: 'bonus-1',
                quantity: 1
            },
            {
                productId: 'product-2',
                bonusProductLineItem: false,
                quantity: 2
            }
        ]
    }

    const mockModalData = {
        bonusDiscountLineItems: [
            {
                id: 'bonus-1',
                promotionId: 'promo-1',
                maxBonusItems: 2,
                bonusProducts: [{productId: 'bonus-product-1'}, {productId: 'bonus-product-2'}]
            },
            {
                id: 'bonus-2',
                promotionId: 'promo-2',
                maxBonusItems: 1,
                bonusProducts: [{productId: 'bonus-product-1'}]
            }
        ]
    }

    const mockProductData = {
        data: [
            {
                id: 'bonus-product-1',
                name: 'Bonus Product 1',
                imageGroups: []
            },
            {
                id: 'bonus-product-2',
                name: 'Bonus Product 2',
                imageGroups: []
            }
        ]
    }

    beforeEach(() => {
        jest.clearAllMocks()
        useCurrentBasket.mockReturnValue({data: mockBasket})
        useProducts.mockReturnValue({
            data: mockProductData,
            isLoading: false
        })
        findAvailableBonusDiscountLineItemIds.mockReturnValue([['bonus-1', 1]])
    })

    test('returns correct bonus products data', () => {
        const {result} = renderHook(() => useBonusProductData(mockModalData))

        expect(result.current.bonusProducts).toBe(mockModalData.bonusDiscountLineItems)
        expect(result.current.bonusLineItemIds).toEqual(['bonus-1', 'bonus-2'])
        expect(result.current.maxBonusItems).toBe(3)
        expect(result.current.selectedBonusItems).toBe(1)
    })

    test('deduplicates bonus products by productId', () => {
        const {result} = renderHook(() => useBonusProductData(mockModalData))

        expect(result.current.uniqueBonusProducts).toHaveLength(2)
        expect(result.current.uniqueBonusProducts).toEqual([
            {productId: 'bonus-product-1'},
            {productId: 'bonus-product-2'}
        ])
    })

    test('creates correct product IDs string', () => {
        const {result} = renderHook(() => useBonusProductData(mockModalData))

        expect(result.current.productIds).toBe('bonus-product-1,bonus-product-2')
    })

    test('calls useProducts with correct parameters', () => {
        renderHook(() => useBonusProductData(mockModalData))

        expect(useProducts).toHaveBeenCalledWith(
            {
                parameters: {
                    ids: 'bonus-product-1,bonus-product-2',
                    allImages: true
                }
            },
            {
                enabled: true,
                placeholderData: null
            }
        )
    })

    test('creates productById map correctly', () => {
        const {result} = renderHook(() => useBonusProductData(mockModalData))

        expect(result.current.productById.get('bonus-product-1')).toEqual({
            id: 'bonus-product-1',
            name: 'Bonus Product 1',
            imageGroups: []
        })
        expect(result.current.productById.get('bonus-product-2')).toEqual({
            id: 'bonus-product-2',
            name: 'Bonus Product 2',
            imageGroups: []
        })
    })

    test('computeBonusMeta returns correct metadata', () => {
        const {result} = renderHook(() => useBonusProductData(mockModalData))
        const bonusProduct = {productId: 'bonus-product-1'}

        const meta = result.current.computeBonusMeta(bonusProduct)

        expect(meta).toEqual({
            promotionId: 'promo-1',
            bonusDiscountLineItemId: 'bonus-1'
        })
    })

    test('normalizeProduct returns normalized product data', () => {
        const {result} = renderHook(() => useBonusProductData(mockModalData))
        const bonusProduct = {productId: 'bonus-product-1'}
        const foundData = mockProductData.data[0]

        const normalized = result.current.normalizeProduct(bonusProduct, foundData)

        expect(normalized).toEqual({
            productId: 'bonus-product-1',
            id: 'bonus-product-1',
            name: 'Bonus Product 1',
            imageGroups: [],
            variants: [],
            variationAttributes: [],
            type: {set: false, bundle: false}
        })
    })

    test('normalizeProduct handles missing product data', () => {
        const {result} = renderHook(() => useBonusProductData(mockModalData))
        const bonusProduct = {productId: 'missing-product'}

        const normalized = result.current.normalizeProduct(bonusProduct, null)

        expect(normalized).toEqual({
            productId: 'missing-product',
            imageGroups: [],
            variants: [],
            variationAttributes: [],
            type: {set: false, bundle: false}
        })
    })

    test('handles empty modal data', () => {
        const {result} = renderHook(() => useBonusProductData(null))

        expect(result.current.bonusProducts).toEqual([])
        expect(result.current.bonusLineItemIds).toEqual([])
        expect(result.current.maxBonusItems).toBe(0)
        expect(result.current.selectedBonusItems).toBe(0)
        expect(result.current.uniqueBonusProducts).toEqual([])
        expect(result.current.productIds).toBe('')
    })

    test('handles missing basket data', () => {
        useCurrentBasket.mockReturnValue({data: null})
        const {result} = renderHook(() => useBonusProductData(mockModalData))

        expect(result.current.selectedBonusItems).toBe(0)
    })

    test('returns loading state from useProducts', () => {
        useProducts.mockReturnValue({
            data: null,
            isLoading: true
        })

        const {result} = renderHook(() => useBonusProductData(mockModalData))

        expect(result.current.isLoading).toBe(true)
    })

    test('computeBonusMeta handles no available pairs', () => {
        findAvailableBonusDiscountLineItemIds.mockReturnValue([])
        const {result} = renderHook(() => useBonusProductData(mockModalData))
        const bonusProduct = {productId: 'bonus-product-1'}

        const meta = result.current.computeBonusMeta(bonusProduct)

        expect(meta).toEqual({
            promotionId: 'promo-1',
            bonusDiscountLineItemId: 'bonus-1'
        })
    })
})
