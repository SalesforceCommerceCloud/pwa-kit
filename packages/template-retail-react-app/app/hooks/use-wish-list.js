/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useCustomerProductLists, useShopperCustomersMutation} from 'commerce-sdk-react-preview'
import {useCurrentCustomer} from './use-current-customer'

export const useWishList = ({listId = ''} = {}) => {
    const {data: customer} = useCurrentCustomer()
    const {isRegistered, customerId} = customer
    const createCustomerProductList = useShopperCustomersMutation('createCustomerProductList')
    const {data: productLists, ...restOfQuery} = useCustomerProductLists(
        {
            parameters: {customerId}
        },
        {
            onSuccess: (data) => {
                if (!data.total) {
                    createCustomerProductList.mutate({
                        parameters: {customerId},
                        // we only use one type of product lists for now
                        body: {type: 'wish_list'}
                    })
                }
            },
            // only registered user can have product lists
            enabled: isRegistered
        }
    )
    const wishLists = productLists?.data?.filter((list) => list.type === 'wish_list') || []
    const currentWishlist = wishLists?.data?.find((list) => list.id === listId) || wishLists[0]
    return {
        data: currentWishlist,
        ...restOfQuery
    }
}
