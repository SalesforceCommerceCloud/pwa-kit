/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useProducts} from '@salesforce/commerce-sdk-react'

const onClient = typeof window !== 'undefined'

/**
 * Custom hook to fetch and merge product data with order items.
 *
 * @param {Array} productItems - Array of product items from order
 * @returns {Object} Object containing variants array, loading state, and error state
 */
export const useOrderProducts = (productItems = []) => {
    const productIds = productItems.map((product) => product.productId)

    const {
        data: products,
        isLoading,
        error
    } = useProducts(
        {
            parameters: {
                ids: productIds.join(','),
                allImages: true
            }
        },
        {
            enabled: !!productIds.length && onClient,
            select: (result) => {
                return result?.data?.reduce((result, item) => {
                    const key = item.id
                    result[key] = item
                    return result
                }, {})
            }
        }
    )

    const variants = productItems?.map((item) => {
        const product = products?.[item.productId]
        return {
            ...(product ? product : {}),
            isProductUnavailable: !product,
            ...item
        }
    })

    return {
        variants: variants || [],
        isLoading,
        error
    }
}
