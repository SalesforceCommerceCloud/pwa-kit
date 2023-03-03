/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useProductLists} from '../contexts'
import {useProducts} from 'commerce-sdk-react-preview'

export const useWishList = ({listId = '', shouldFetchProductDetail = false} = {}) => {
    const {
        productLists,
        error: productListsError,
        isLoading: isProductListsLoading
    } = useProductLists()
    const wishLists = productLists?.data?.filter((list) => list.type === 'wish_list')
    const currentWishlist =
        wishLists?.data?.find((list) => list.id === listId) || wishLists?.data?.[0]

    const productIds =
        currentWishlist?.customerProductListItems?.map(({productId}) => productId).join(',') ?? ''

    const {
        data: products,
        isLoading: isProductsLoading,
        error: productsError
    } = useProducts(
        {
            parameters: {
                ids: productIds,
                allImages: true
            }
        },
        {
            enabled: shouldFetchProductDetail && Boolean(productIds),
            select: (result) => {
                // Convert array into key/value object with key is the product id
                return result?.data?.reduce((result, item) => {
                    const key = item.id
                    result[key] = item
                    return result
                }, {})
            }
        }
    )
    return {
        error: productListsError || productsError,
        // isProductListsLoading is always true if shouldFetchProductDetail is false
        isLoading: shouldFetchProductDetail
            ? isProductListsLoading || isProductsLoading
            : isProductListsLoading,
        productItemDetail: {
            products
        },
        wishlist: currentWishlist
    }
}
