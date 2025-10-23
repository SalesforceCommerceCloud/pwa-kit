/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useQuery} from '@tanstack/react-query'
import {useCommerceApi} from '@salesforce/commerce-sdk-react'
import {getAppOrigin} from '@salesforce/pwa-kit-react-sdk/utils/url'
import {useAccessToken} from '@salesforce/commerce-sdk-react'

/**
 * Hook to fetch rule-based bonus products using ShopperSearch productSearch endpoint.
 *
 * For rule-based bonus promotions, bonusProducts array is empty in the basket response.
 * This hook uses the productSearch endpoint with refine=pmid parameter to fetch eligible bonus products.
 *
 * Note: We use fetch directly instead of useProductSearch because the Commerce SDK
 * doesn't pass through custom refine parameters that are not in its TypeScript definitions.
 * The pmid must be passed as a refinement: refine=pmid=<promotionId>
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
    const api = useCommerceApi()
    const {getTokenWhenReady} = useAccessToken()

    const {data, isLoading, error, ...rest} = useQuery(
        {
            queryKey: ['rule-based-bonus-products', promotionId, limit, offset],
            queryFn: async () => {
                // Get auth token
                const token = await getTokenWhenReady()

                // Get site configuration
                const siteId = api.shopperSearch.clientConfig.parameters.siteId
                const locale = api.shopperSearch.clientConfig.parameters.locale
                const currency =
                    api.shopperSearch.clientConfig.parameters.currency || 'USD'
                const organizationId =
                    api.shopperSearch.clientConfig.parameters.organizationId
                const shortCode = api.shopperSearch.clientConfig.parameters.shortCode

                // Build URL with refine parameter using pmid
                // Based on Deepali's script: uses refine=pmid=<promotionId> format
                const params = new URLSearchParams({
                    siteId,
                    locale,
                    currency,
                    refine: `pmid=${promotionId}`,
                    limit: String(limit || 25),
                    offset: String(offset || 0)
                })

                // Use proxy (direct SCAPI blocked by CSP)
                // The proxy should pass through the refine parameter to SCAPI
                const url = `${getAppOrigin()}/mobify/proxy/api/search/shopper-search/v1/organizations/${organizationId}/product-search?${params.toString()}`

                // Make direct fetch call
                const response = await fetch(url, {
                    headers: {
                        Authorization: token ? `Bearer ${token}` : '',
                        'Content-Type': 'application/json'
                    }
                })

                if (!response.ok) {
                    const errorText = await response.text()
                    throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`)
                }

                return await response.json()
            },
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
