/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useCustomerProductLists, useProducts, useShopperCustomersMutation} from 'commerce-sdk-react-preview'
import {useCurrentCustomer} from "./use-current-customer";

export const useWishList = ({listId = '', shouldFetchProductDetail = false} = {}) => {
    const {data: customer} = useCurrentCustomer()
    const {isRegistered, customerId} = customer
    const createCustomerProductList = useShopperCustomersMutation('createCustomerProductList')
    const {data: productLists, isLoading: isProductListsLoading, error: productListsError} = useCustomerProductLists(
        {
            parameters: {customerId}
        },
        {
            onError: (e) => {
                console.error('e', e)
            },
            onSuccess: (data) => {
                if (!data.total) {
                    createCustomerProductList.mutate({
                        parameters: {customerId},
                        // we only use one type of product list for now
                        body: {type: 'wish_list'}
                    })
                }
            },
            // only registered user can have product lists
            enabled: isRegistered
        }
    )
    const wishLists = productLists?.data?.filter((list) => list.type === 'wish_list') || []
    const currentWishlist =
        wishLists?.data?.find((list) => list.id === listId) || wishLists[0]
    const productIds =
        currentWishlist?.customerProductListItems?.map(({productId}) => productId).join(',') ?? ''
    const fetchProductDetail = shouldFetchProductDetail && Boolean(productIds)

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
            enabled: fetchProductDetail,
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
        // if fetchProductDetail is true, we need to wait for both product lists and products to be loaded
        // otherwise, just need to consider productLists loading state
        isLoading: fetchProductDetail
            ? isProductListsLoading || isProductsLoading
            : isProductListsLoading,
        productItemDetail: {
            products
        },
        wishlist: currentWishlist
    }
}
