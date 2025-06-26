/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {renderHook} from '@testing-library/react'
import {useProductSearch} from '@salesforce/commerce-sdk-react'
import {useBonusProductSearch} from '@salesforce/retail-react-app/../../app/hooks/use-bonus-product-search'
import {HOME_SHOP_PRODUCTS_LIMIT} from '@salesforce/retail-react-app/app/constants'

// Mock the commerce SDK hook
jest.mock('@salesforce/commerce-sdk-react')

describe('useBonusProductSearch', () => {
    let mockUseProductSearch

    beforeEach(() => {
        mockUseProductSearch = {
            data: null,
            isLoading: false,
            error: null
        }
        useProductSearch.mockReturnValue(mockUseProductSearch)
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    test('should call useProductSearch with correct parameters when promotionId is provided', () => {
        const promotionId = 'test-promotion-id'

        renderHook(() => useBonusProductSearch(promotionId))

        expect(useProductSearch).toHaveBeenCalledWith({
            parameters: {
                allImages: true,
                allVariationProperties: true,
                expand: ['promotions', 'variations', 'prices', 'images', 'custom_properties'],
                limit: HOME_SHOP_PRODUCTS_LIMIT,
                perPricebook: true,
                refine: [`pmid=${promotionId}`, 'htype=master']
            }
        })
    })

    test('should call useProductSearch with null promotionId', () => {
        renderHook(() => useBonusProductSearch(null))

        expect(useProductSearch).toHaveBeenCalledWith({
            parameters: {
                allImages: true,
                allVariationProperties: true,
                expand: ['promotions', 'variations', 'prices', 'images', 'custom_properties'],
                limit: HOME_SHOP_PRODUCTS_LIMIT,
                perPricebook: true,
                refine: ['pmid=null', 'htype=master']
            }
        })
    })

    test('should call useProductSearch with undefined promotionId', () => {
        renderHook(() => useBonusProductSearch(undefined))

        expect(useProductSearch).toHaveBeenCalledWith({
            parameters: {
                allImages: true,
                allVariationProperties: true,
                expand: ['promotions', 'variations', 'prices', 'images', 'custom_properties'],
                limit: HOME_SHOP_PRODUCTS_LIMIT,
                perPricebook: true,
                refine: ['pmid=undefined', 'htype=master']
            }
        })
    })

    test('should return data from useProductSearch', () => {
        const mockData = {
            hits: [
                {
                    productId: 'test-product-1',
                    productName: 'Test Product 1'
                },
                {
                    productId: 'test-product-2',
                    productName: 'Test Product 2'
                }
            ]
        }

        mockUseProductSearch.data = mockData

        const {result} = renderHook(() => useBonusProductSearch('test-promotion'))

        expect(result.current.data).toBe(mockData)
    })

    test('should return null data when useProductSearch returns null', () => {
        mockUseProductSearch.data = null

        const {result} = renderHook(() => useBonusProductSearch('test-promotion'))

        expect(result.current.data).toBeNull()
    })

    test('should handle empty string promotionId', () => {
        renderHook(() => useBonusProductSearch(''))

        expect(useProductSearch).toHaveBeenCalledWith({
            parameters: {
                allImages: true,
                allVariationProperties: true,
                expand: ['promotions', 'variations', 'prices', 'images', 'custom_properties'],
                limit: HOME_SHOP_PRODUCTS_LIMIT,
                perPricebook: true,
                refine: ['pmid=', 'htype=master']
            }
        })
    })

    test('should use correct refine parameters for promotion search', () => {
        const promotionId = 'ChoiceOfBonusProdect-ProductLevel-ruleBased'

        renderHook(() => useBonusProductSearch(promotionId))

        expect(useProductSearch).toHaveBeenCalledWith({
            parameters: {
                allImages: true,
                allVariationProperties: true,
                expand: ['promotions', 'variations', 'prices', 'images', 'custom_properties'],
                limit: HOME_SHOP_PRODUCTS_LIMIT,
                perPricebook: true,
                refine: [`pmid=${promotionId}`, 'htype=master']
            }
        })
    })
})
