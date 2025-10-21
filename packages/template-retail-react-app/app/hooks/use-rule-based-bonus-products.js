/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useProductSearch} from '@salesforce/commerce-sdk-react'

/**
 * Hook to fetch rule-based bonus products using ShopperSearch productSearch endpoint.
 *
 * For rule-based bonus promotions, bonusProducts array is empty in the basket response.
 * This hook uses the productSearch endpoint with promotionId to fetch eligible bonus products.
 *
 * @param {string} promotionId - The promotion ID to fetch bonus products for
 * @param {Object} options - Additional options
 * @param {boolean} [options.enabled=true] - Whether to fetch products
 * @param {number} [options.limit=25] - Maximum number of products to return
 * @param {number} [options.offset=0] - Offset for pagination
 * @returns {Object} React Query result with products data
 *
 * @example
 * const {products, isLoading, error} = useRuleBasedBonusProducts(
 *   'my-promotion-id',
 *   {enabled: isModalOpen}
 * )
 */
export const useRuleBasedBonusProducts = (promotionId, {enabled = true, limit, offset} = {}) => {
    const {data, isLoading, error, ...rest} = useProductSearch(
        {
            parameters: {
                promotionId,
                limit: limit || 25,
                offset: offset || 0
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
