/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useCustomerBaskets} from '@salesforce/commerce-sdk-react'

/**
 * This hook combines commerce-react-sdk hooks to provide basket data for a specific customer ID
 * @param customerId - customer ID to get baskets for
 * @param id - basket id to get the current used basket among baskets returned, use first basket in the array if not defined
 * @param shouldFetchProductDetail - boolean to indicate if the baskets should fetch product details based on basket items
 */
export const useBasketWithCustomerId = ({customerId, id = ''} = {}) => {
    const {data: basketsData, ...restOfQuery} = useCustomerBaskets(
        {parameters: {customerId}},
        {enabled: !!customerId}
    )

    const currentBasket =
        basketsData?.baskets?.find((basket) => basket?.basketId === id) || basketsData?.baskets?.[0]

    console.log('===passed in customer id to basket hook===', customerId)
    console.log('===passed in basket id to basket hook===', id)
    console.log('===basketsData===', basketsData)
    console.log('===currentBasket===', currentBasket)

    return {
        ...restOfQuery,
        data: currentBasket,
        derivedData: {
            hasBasket: basketsData?.total > 0,
            totalItems:
                currentBasket?.productItems?.reduce((acc, item) => acc + item.quantity, 0) || 0
        }
    }
}
