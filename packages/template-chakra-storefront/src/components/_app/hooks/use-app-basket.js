/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useEffect} from 'react'
import {useShopperBasketsMutation} from '@salesforce/commerce-sdk-react'

/**
 * Custom hook for managing basket updates and customer synchronization
 * Handles basket currency updates and customer email synchronization
 *
 * @param {Object} basket - Current basket data
 * @param {Object} customer - Current customer data
 * @param {string} currency - Current currency
 * @returns {Object} Basket management functions and state
 */
export const useAppBasket = (basket, customer, currency) => {
    const updateBasket = useShopperBasketsMutation('updateBasket')
    const updateCustomerForBasket = useShopperBasketsMutation('updateCustomerForBasket')

    // Update the basket currency if it doesn't match the current locale currency
    useEffect(() => {
        if (basket?.currency && basket?.currency !== currency) {
            updateBasket.mutate({
                parameters: {basketId: basket.basketId},
                body: {currency}
            })
        }
    }, [basket?.currency, basket?.basketId, currency, updateBasket])

    // Update the basket customer email when customer is registered and email changes
    useEffect(() => {
        if (
            basket &&
            customer?.isRegistered &&
            customer?.email &&
            customer?.email !== basket?.customerInfo?.email
        ) {
            updateCustomerForBasket.mutate({
                parameters: {basketId: basket.basketId},
                body: {
                    email: customer.email
                }
            })
        }
    }, [
        basket?.basketId,
        customer?.isRegistered,
        customer?.email,
        basket?.customerInfo?.email,
        updateCustomerForBasket
    ])

    return {
        updateBasket,
        updateCustomerForBasket,
        isUpdatingBasket: updateBasket.isPending,
        isUpdatingCustomer: updateCustomerForBasket.isPending
    }
}
