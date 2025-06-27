/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {HOME_SHOP_PRODUCTS_LIMIT} from '@salesforce/retail-react-app/app/constants'
import {useProductSearch} from '@salesforce/commerce-sdk-react'

/**
 * Fetch bonus products for rule based promotions when promotionId is provided.
 * @param {string} promotionId - The promotion ID to fetch bonus products for.
 * @returns {Object} - The product search result.
 */
export const useBonusProductSearch = (promotionId) => {
    const {data: productSearchResult} = useProductSearch(
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
            enabled: !!promotionId
        }
    )

    return {
        data: productSearchResult
    }
}
