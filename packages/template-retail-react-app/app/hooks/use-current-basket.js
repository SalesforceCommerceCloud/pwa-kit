/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useCustomerId, useCustomerBaskets} from '@salesforce/commerce-sdk-react'
import {isServer} from '@salesforce/retail-react-app/app/utils/utils'

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

    const currentBasket =
        basketsData?.baskets?.find((basket) => basket?.basketId === id) || basketsData?.baskets?.[0]

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

/**
 * This function is a wrapper hook for all basket mutations. It will make sure basket has been created before a mutation is performed to the API
 * @param mutations {array} - list of baskets actions to be performed at once
 * @param basket - includes hasBasket and basketId (if applicable)
 * @param createBasket {object} - create basket mutation
 */
export const performBasketAction = async (mutations, basket, createBasket) => {
    const {hasBasket = true, basketId} = basket
    if (hasBasket && !basketId) {
        throw new Error('Basket Id is undefined. Please try again.')
    }
    // You can't initialize mutation in this function since it violates the princile or hook.
    // You need to initialize in the component level and pass it into this function
    if (
        typeof createBasket.mutate !== 'function' ||
        typeof createBasket.mutateAsync !== 'function'
    ) {
        throw new Error('createBasket needs to be an instance of Mutation.')
    }
    if (!hasBasket) {
        const data = await createBasket.mutateAsync({
            body: {}
        })
        // after basket has successfully created, performance list of mutation
        for (let item of mutations) {
            const {mutation, opts, args} = item
            await mutation.mutateAsync(
                {
                    parameters: {
                        basketId: data.basketId
                    },
                    ...args
                },
                opts
            )
        }
    } else {
        for (let item of mutations) {
            const {mutation, opts, args} = item
            await mutation.mutateAsync(
                {
                    parameters: {
                        basketId
                    },
                    ...args
                },
                opts
            )
        }
    }
}
