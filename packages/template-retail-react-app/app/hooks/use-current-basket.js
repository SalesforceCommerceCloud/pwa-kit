/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {
    useCustomerId,
    useCustomerBaskets,
    useShopperBasketsMutation
} from '@salesforce/commerce-sdk-react'
import {isServer} from '@salesforce/retail-react-app/app/utils/utils'
import {LAZY_BASKET_INITIALIZATION} from '@salesforce/retail-react-app/app/constants'

/**
 * This hook combine some commerce-react-sdk hooks to provide more derived data for Retail App baskets
 * @param id - basket id to get the current used basket among baskets returned, use first basket in the array if not defined
 * @param shouldFetchProductDetail - boolean to indicate if the baskets should fetch product details based on basket items
 */
export const useCurrentBasket = ({id = ''} = {}) => {
    const customerId = useCustomerId()
    const {data: basketsData, ...restOfQuery} = useCustomerBaskets(
        {parameters: {customerId}},
        {
            enabled: !!customerId && !isServer
        }
    )

    const addItemToBasketMutation = useShopperBasketsMutation('addItemToBasket')
    const createBasket = useShopperBasketsMutation('createBasket')

    const currentBasket =
        basketsData?.baskets?.find((basket) => basket?.basketId === id) || basketsData?.baskets?.[0]

    return {
        ...restOfQuery,
        data: currentBasket,
        mutations: {
            addItemToBasket: async (body) => {
                if (basketsData?.total > 0 || !LAZY_BASKET_INITIALIZATION) {
                    return await addItemToBasketMutation.mutateAsync({
                        parameters: {basketId: currentBasket.basketId},
                        body
                    })
                } else {
                    const data = await createBasket.mutateAsync({
                        body: {}
                    })
                    return await addItemToBasketMutation.mutateAsync({
                        parameters: {basketId: data.basketId},
                        body
                    })
                }
            }
        },
        derivedData: {
            hasBasket: basketsData?.total > 0,
            totalItems:
                currentBasket?.productItems?.reduce((acc, item) => acc + item.quantity, 0) || 0
        }
    }
}
