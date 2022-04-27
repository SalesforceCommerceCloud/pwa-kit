/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useEffect} from 'react'
import useBasket from './useBasket'
import useCustomer from './useCustomer'

/**
 * Joins basket and customer hooks into a single hook for initializing their states
 * when the app loads on the client-side. Should only be use at top-level of app.
 * @returns {Object} - customer and basket objects
 */
const useShopper = (opts = {}) => {
    const {currency} = opts
    const customer = useCustomer()
    const basket = useBasket({currency})

    // Create or restore the user session upon mounting
    useEffect(() => {
        customer.login()
    }, [])

    // Handle basket init/updates in response to customer/basket changes.
    useEffect(() => {
        const hasBasket = basket?.loaded

        // We have a customer but no basket, so we fetch a new or existing basket
        if (customer.isInitialized && !hasBasket) {
            basket.getOrCreateBasket()
            return
        }

        // We have a customer and a basket, but the basket does not belong to this customer
        // so we get their existing basket or create a new one for them
        if (
            hasBasket &&
            customer.isInitialized &&
            customer.customerId !== basket.customerInfo.customerId
        ) {
            basket.getOrCreateBasket()
            return
        }

        // We have a registered customer (customer with email), and we have their basket,
        // but the email applied to the basket is missing or doesn't match the customer
        // email. In this case, we update the basket with their email.
        if (
            hasBasket &&
            customer.isRegistered &&
            customer.customerId === basket.customerInfo.customerId &&
            customer.email !== basket.customerInfo.email
        ) {
            basket.updateCustomerInfo({email: customer.email})
            return
        }
    }, [customer.authType, basket.loaded])

    // Call merge basket whenever user type changes from guest to registered
    useEffect(() => {
        if (customer.authType === 'registered') {
            basket.mergeBasket()
        }
    }, [customer.authType])

    useEffect(() => {
        // Fetch product details for all items in cart
        if (customer.customerId && basket?.basketId) {
            if (basket.itemCount > 0) {
                const allImages = true
                let ids = basket.productItems?.map((item) => item.productId)
                if (basket?._productItemsDetail) {
                    ids = ids.filter((id) => !basket?._productItemsDetail[id])
                }

                basket.getProductsInBasket(ids.toString(), {allImages})
            }
        }
    }, [customer, basket])

    return {customer, basket}
}

export default useShopper
