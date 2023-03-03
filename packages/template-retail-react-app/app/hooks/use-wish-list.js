/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useProductLists} from './use-product-lists'
import {useProducts} from 'commerce-sdk-react-preview'

export const useWishList = ({listId = '', shouldFetchProductDetail = false} = {}) => {
    const {
        productLists,
        error: productListsError,
        isLoading: isProductListsLoading
    } = useProductLists()
    const wishLists = productLists?.data?.filter((list) => list.type === 'wish_list')
    // current use wish list
    const wishlist = wishLists?.data?.find((list) => list.id === listId) || productLists?.data?.[0]

    const productIds =
        wishlist?.customerProductListItems?.map(({productId}) => productId).join(',') ?? ''

    const {
        data: products,
        isLoading: isProductsLoading,
        error: productsError
    } = useProducts(
        {
            ids: productIds,
            allImages: true
        },
        {
            enabled: shouldFetchProductDetail && !!productIds,
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
        isLoading: isProductListsLoading || isProductsLoading,
        productItemDetail: {
            products
        },
        wishlist
    }
}
