/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {
    useShippingMethodsForShipment,
    useShopperBasketsMutation
} from '@salesforce/commerce-sdk-react'

// do this action only if the basket shipping method is not defined
// we need to fetch the shippment methods to get the default value before we can add it to the basket
export const useAssignDefaultShippingMethod = (basket) => {
    const updateShippingMethodForShipmentsMutation = useShopperBasketsMutation(
        'updateShippingMethodForShipment'
    )

    useShippingMethodsForShipment(
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
                !basket.shipments[0].shippingMethod,
            onSuccess: (data) => {
                updateShippingMethodForShipmentsMutation.mutate({
                    parameters: {
                        basketId: basket?.basketId,
                        shipmentId: 'me'
                    },
                    body: {
                        id: data.defaultShippingMethodId
                    }
                })
            }
        }
    )
}
