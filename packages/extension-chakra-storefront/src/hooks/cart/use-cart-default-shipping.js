/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useEffect} from 'react'
import {
    useShopperBasketsMutation,
    useShippingMethodsForShipment
} from '@salesforce/commerce-sdk-react'

/**
 * Custom hook to handle shipping method management for cart when shipping method is undefined
 * @param {Object} basket - The current basket data
 * @returns {Object} Object containing shipping method mutations
 */
export const useCartDefaultShipping = (basket) => {
    const updateShippingMethodForShipmentsMutation = useShopperBasketsMutation(
        'updateShippingMethodForShipment'
    )

    /******************* Shipping Methods for basket shipment *******************/
    // do this action only if the basket shipping method is not defined
    // we need to fetch the shippment methods to get the default value before we can add it to the basket
    const shippingMethodsQuery = useShippingMethodsForShipment(
        {
            parameters: {
                basketId: basket?.basketId,
                shipmentId: 'me'
            }
        },
        {
            // only fetch if basket is has no shipping method in the first shipment
            enabled:
                !!basket?.basketId &&
                basket.shipments.length > 0 &&
                !basket.shipments[0].shippingMethod
        }
    )

    // Handle shipping method update when data is returned
    useEffect(() => {
        if (!shippingMethodsQuery.isSuccess || !shippingMethodsQuery.data) {
            return
        }
        updateShippingMethodForShipmentsMutation.mutate({
            parameters: {
                basketId: basket?.basketId,
                shipmentId: 'me'
            },
            body: {
                id: shippingMethodsQuery.data.defaultShippingMethodId
            }
        })
    }, [shippingMethodsQuery.isSuccess, shippingMethodsQuery.data])
}
