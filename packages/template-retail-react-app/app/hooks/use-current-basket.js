/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useCustomerId, useCustomerBaskets} from '@salesforce/commerce-sdk-react'
import {isServer} from '@salesforce/retail-react-app/app/utils/utils'
import {useEffect} from 'react'

// if id is not defined, by default use the first basket in the list
const findCurrentBasket = (id, basketsData) => {
    return (
        basketsData?.baskets?.find((basket) => basket?.basketId === id) || basketsData?.baskets?.[0]
    )
}

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

    let currentBasket = findCurrentBasket(id, basketsData)
    // useEffect(() => {
    //     currentBasket = findCurrentBasket(id, basketsData)
    // }, [id, basketsData])

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
