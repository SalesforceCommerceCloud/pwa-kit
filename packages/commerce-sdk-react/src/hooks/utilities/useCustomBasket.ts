/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {useCustomerBaskets, useCustomerId, useProducts} from '../index'
import {ApiClients, ArrayElement, DataType} from '../types'

type Client = ApiClients['shopperCustomers']
type Baskets = NonNullable<DataType<Client['getCustomerBaskets']>['baskets']>

type Basket = ArrayElement<Baskets>

//TODO: Need a better name
/**
 * This hook combined useCustomer and useBasket
 * and add a few business login
 */

type useCustomBasketArg = {
    id?: string
    shouldFetchProductDetail?: boolean
}

export const useCustomBasket = ({
    id,
    shouldFetchProductDetail = false
}: useCustomBasketArg = {}) => {
    const customerId = useCustomerId() || ''
    const {
        data: basketsRes,
        isLoading: isBasketsLoading,
        error: isBasketsError,
        ...restOfBaskets
    } = useCustomerBaskets({customerId})
    // if id is not defined, by default use the first basket in the list
    const basket =
        basketsRes?.baskets?.find((basket) => basket.basketId === id) || basketsRes?.baskets?.[0]
    const ids = '' ?? basket?.productItems?.map(({productId}) => productId).join(',')
    const {data: products, isLoading: isProductsLoading} = useProducts(
        {
            ids,
            allImages: true
        },
        {
            enabled: shouldFetchProductDetail && !!ids
        }
    )

    return {
        baskets: basketsRes,
        isBasketsLoading,
        isBasketsError,
        ...restOfBaskets,
        // current picked basket
        basket,
        isLoading: isBasketsLoading && isProductsLoading,
        productDetails: products,
        hasBasket: basketsRes?.total !== 0 || false,
        totalItems: basket?.productItems?.reduce((acc: number, item) => {
            if (!item.quantity) return acc
            return acc + item.quantity
        }, 0)
    }
}
