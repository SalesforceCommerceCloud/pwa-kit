/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useEffect} from 'react'
import {useCustomerProductLists, useShopperCustomersMutation} from '@salesforce/commerce-sdk-react'
import {useCurrentCustomer} from './use-current-customer'

const onClient = typeof window !== 'undefined'
// TODO: remove `listId` input -> use the first list of type wish_list instead
// (mimic the logic in the other older hook 'use-wishlist.js')
export const useWishList = ({listId = ''} = {}) => {
    const {data: customer} = useCurrentCustomer()
    const {customerId} = customer
    const createCustomerProductList = useShopperCustomersMutation('createCustomerProductList')

    const {
        data: productLists,
        isSuccess: isProductListsSuccess,
        ...restOfQuery
    } = useCustomerProductLists(
        {
            parameters: {customerId}
        },
        {
            enabled: onClient && Boolean(customerId)
        }
    )

    // Handle product list creation when no lists exist
    useEffect(() => {
        if (!productLists || !isProductListsSuccess || productLists.total) return
        createCustomerProductList.mutate({
            parameters: {customerId},
            // we only use one type of product lists for now
            body: {type: 'wish_list'}
        })
    }, [productLists, isProductListsSuccess])

    const wishLists = productLists?.data?.filter((list) => list.type === 'wish_list') || []
    const currentWishlist = wishLists.find((list) => list.id === listId)

    return {
        data: !listId ? wishLists[0] : currentWishlist,
        ...restOfQuery
    }
}
