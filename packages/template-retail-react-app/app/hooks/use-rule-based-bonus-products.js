/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useProductSearch} from '@salesforce/commerce-sdk-react'
import {useMemo} from 'react'
import {DEFAULT_BONUS_PRODUCT_SEARCH_PARAMS} from '@salesforce/retail-react-app/app/constants'

/**
 * Hook to fetch rule-based bonus products using ShopperSearch productSearch endpoint.
 *
 * For rule-based bonus promotions, bonusProducts array is empty in the basket response.
 * This hook uses the productSearch endpoint with refine parameters to fetch eligible bonus products.
 *
 * Uses two refinement parameters:
 * - pmid=${promotionId} - Filters products by promotion ID
 * - pmpt=bonus - Filters to only show bonus products (excludes qualifying products)
 *
 * @param {string} promotionId - The promotion ID to fetch bonus products for
 * @param {Object} options - Additional options
 * @param {boolean} [options.enabled=true] - Whether to fetch products
 * @param {number} [options.limit] - Maximum number of products to return (defaults to DEFAULT_BONUS_PRODUCT_SEARCH_PARAMS.limit)
 * @param {number} [options.offset] - Offset for pagination (defaults to DEFAULT_BONUS_PRODUCT_SEARCH_PARAMS.offset)
 * @returns {Object} React Query result with products data
 *
 * @example
 * const {products, isLoading, error} = useRuleBasedBonusProducts(
 *   'my-promotion-id',
 *   {enabled: isModalOpen}
 * )
 */
export const useRuleBasedBonusProducts = (promotionId, {enabled = true, limit, offset} = {}) => {
    // Build refine array with promotion ID and product type filters
    const refine = useMemo(() => [`pmid=${promotionId}`, 'pmpt=bonus'], [promotionId])

    const {data, isLoading, error, ...rest} = useProductSearch(
        {
            parameters: {
                refine,
                limit: limit || DEFAULT_BONUS_PRODUCT_SEARCH_PARAMS.limit,
                offset: offset || DEFAULT_BONUS_PRODUCT_SEARCH_PARAMS.offset
            }
        },
        {
            enabled: enabled && Boolean(promotionId)
        }
    )

    return {
        products: data?.hits || [],
        total: data?.total || 0,
        isLoading,
        error,
        ...rest
    }
}
