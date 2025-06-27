/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {renderHook} from '@testing-library/react'
import {useProductSearch} from '@salesforce/commerce-sdk-react'
import {useBonusProductSearch} from '@salesforce/retail-react-app/app/hooks/use-bonus-product-search'
import {HOME_SHOP_PRODUCTS_LIMIT} from '@salesforce/retail-react-app/app/constants'

// Mock the commerce SDK hook
jest.mock('@salesforce/commerce-sdk-react')

describe('useBonusProductSearch', () => {
    let mockUseProductSearch

    beforeEach(() => {
        mockUseProductSearch = jest.fn()
        useProductSearch.mockImplementation(mockUseProductSearch)
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    it('should call useProductSearch with correct parameters when promotionId is provided', () => {
        const promotionId = 'test-promotion-id'
        const mockData = {hits: []}
        mockUseProductSearch.mockReturnValue({data: mockData})

        renderHook(() => useBonusProductSearch(promotionId))

        expect(useProductSearch).toHaveBeenCalledWith(
            {
                parameters: {
                    allImages: true,
                    allVariationProperties: true,
                    expand: ['promotions', 'variations', 'prices', 'images', 'custom_properties'],
                    limit: HOME_SHOP_PRODUCTS_LIMIT,
                    perPricebook: true,
                    refine: [`pmid=${promotionId}`, 'htype=master']
                }
            },
            {
                enabled: true
            }
        )
    })

    it('should return data from useProductSearch when promotionId is provided', () => {
        const promotionId = 'test-promotion-id'
        const mockData = {hits: [{productId: '123', productName: 'Test Product'}]}
        mockUseProductSearch.mockReturnValue({data: mockData})

        const {result} = renderHook(() => useBonusProductSearch(promotionId))

        expect(result.current.data).toBe(mockData)
    })

    it('should use correct refine parameters for promotion search', () => {
        const promotionId = 'ChoiceOfBonusProdect-ProductLevel-ruleBased'
        const mockData = {hits: []}
        mockUseProductSearch.mockReturnValue({data: mockData})

        renderHook(() => useBonusProductSearch(promotionId))

        expect(useProductSearch).toHaveBeenCalledWith(
            {
                parameters: {
                    allImages: true,
                    allVariationProperties: true,
                    expand: ['promotions', 'variations', 'prices', 'images', 'custom_properties'],
                    limit: HOME_SHOP_PRODUCTS_LIMIT,
                    perPricebook: true,
                    refine: [`pmid=${promotionId}`, 'htype=master']
                }
            },
            {
                enabled: true
            }
        )
    })
})
