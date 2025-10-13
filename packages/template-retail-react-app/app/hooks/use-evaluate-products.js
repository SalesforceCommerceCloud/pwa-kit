/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useQuery} from '@tanstack/react-query'
import {useCommerceApi} from '@salesforce/commerce-sdk-react'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'

/**
 * @deprecated Use useRuleBasedBonusProducts instead - it uses the simpler useProductSearch approach
 *
 * Custom hook to evaluate products for rule-based bonus promotions.
 *
 * This hook makes a manual API call to the SCAPI evaluate-products endpoint since
 * it's not yet available in commerce-sdk-isomorphic v4.0.0. This endpoint returns
 * products that are eligible as bonus products for a specific promotion based on
 * dynamic rules (e.g., category, attributes, price).
 *
 * NOTE: This approach uses custom fetch calls. The newer useRuleBasedBonusProducts
 * hook uses the standard useProductSearch with promotionId parameter, which is
 * simpler and better maintained.
 *
 * @param {Object} options - Hook options
 * @param {string} options.promotionId - The promotion ID to evaluate products for
 * @param {string} [options.promotionProductType='bonus'] - The type of promotion product (default: 'bonus')
 * @param {number} [options.limit] - Maximum number of products to return
 * @param {number} [options.offset] - Offset for pagination
 * @param {Object} queryOptions - React Query options
 * @param {boolean} [queryOptions.enabled=true] - Whether the query should run
 * @returns {Object} React Query result with products data
 *
 * @example
 * // DEPRECATED - Use useRuleBasedBonusProducts instead
 * const {data: products, isLoading, error} = useEvaluateProducts({
 *   promotionId: 'my-promotion-id',
 *   promotionProductType: 'bonus'
 * }, {
 *   enabled: isModalOpen
 * })
 */
export const useEvaluateProducts = (
    {promotionId, promotionProductType = 'bonus', limit, offset} = {},
    queryOptions = {}
) => {
    const commerceApi = useCommerceApi()
    const config = getConfig()

    // Get API configuration
    const {organizationId, shortCode, siteId} = commerceApi?.clientConfig || {}
    const proxyPath = config?.app?.commerceAPI?.proxyPath || '/mobify/proxy/api'

    return useQuery({
        queryKey: ['evaluate-products', promotionId, promotionProductType, limit, offset],
        queryFn: async () => {
            if (!promotionId) {
                throw new Error('❌ promotionId is required for useEvaluateProducts')
            }

            if (!organizationId || !shortCode || !siteId) {
                throw new Error(
                    '❌ Missing required API configuration (organizationId, shortCode, or siteId)'
                )
            }

            // Get auth token from commerce API
            const authToken = await commerceApi?.auth?.ready()

            if (!authToken || !authToken.access_token) {
                throw new Error('❌ Failed to get authentication token')
            }

            // Construct the API URL
            // Format: /mobify/proxy/api/organizations/{organizationId}/promotions/actions/evaluate-products
            const url = `${proxyPath}/organizations/${organizationId}/promotions/actions/evaluate-products`

            // Build request body
            const requestBody = {
                promotionId,
                promotionProductType
            }

            // Add optional parameters
            if (limit !== undefined) requestBody.limit = limit
            if (offset !== undefined) requestBody.offset = offset

            console.log('🔍 Fetching rule-based bonus products:', {
                url,
                promotionId,
                promotionProductType
            })

            // Make the API call
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${authToken.access_token}`,
                    'x-dw-client-id': commerceApi?.clientConfig?.parameters?.clientId || ''
                },
                body: JSON.stringify(requestBody)
            })

            if (!response.ok) {
                const errorText = await response.text()
                console.error('❌ evaluate-products API error:', {
                    status: response.status,
                    statusText: response.statusText,
                    error: errorText
                })

                throw new Error(
                    `API request failed: ${response.status} ${response.statusText} - ${errorText}`
                )
            }

            const data = await response.json()

            console.log('✅ Rule-based bonus products fetched successfully:', {
                count: data?.data?.length || 0,
                total: data?.total
            })

            return data
        },
        enabled:
            queryOptions.enabled !== false &&
            Boolean(promotionId) &&
            Boolean(organizationId) &&
            Boolean(shortCode) &&
            Boolean(siteId),
        ...queryOptions
    })
}
