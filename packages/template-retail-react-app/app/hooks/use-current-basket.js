/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useCustomerId, useCustomerBaskets} from '@salesforce/commerce-sdk-react'
import {isServer} from '@salesforce/retail-react-app/app/utils/utils'
import {isPickupShipment} from '@salesforce/retail-react-app/app/utils/shipment-utils'
import {isAddressEmpty} from '@salesforce/retail-react-app/app/utils/address-utils'
import {STORE_LOCATOR_IS_ENABLED} from '@salesforce/retail-react-app/app/constants'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import {useMemo} from 'react'

/**
 * This hook combine some commerce-react-sdk hooks to provide more derived data for Retail App baskets
 * @param id - basket id to get the current used basket among baskets returned, use first basket in the array if not defined
 * @param shouldFetchProductDetail - boolean to indicate if the baskets should fetch product details based on basket items
 */
export const useCurrentBasket = ({id = ''} = {}) => {
    const storeLocatorEnabled = getConfig()?.app?.storeLocatorEnabled ?? STORE_LOCATOR_IS_ENABLED
    const customerId = useCustomerId()
    const {data: basketsData, ...restOfQuery} = useCustomerBaskets(
        {parameters: {customerId}},
        {
            enabled: !!customerId && !isServer
        }
    )

    const currentBasket =
        basketsData?.baskets?.find((basket) => basket?.basketId === id) || basketsData?.baskets?.[0]

    const memoizedDerived = useMemo(() => {
        // count the number of items in each shipment and rollup total
        let totalItems = 0
        const shipmentIdToTotalItems =
            currentBasket?.productItems?.reduce((acc, item) => {
                totalItems += item.quantity
                acc[item.shipmentId] = acc[item.shipmentId] || 0
                acc[item.shipmentId] += item.quantity
                return acc
            }, {}) ?? {}

        // count the number on non-empty pickup and delivery shipments
        // also count the number of delivery shipments missing an address or shipping method
        let totalDeliveryShipments = 0
        let totalPickupShipments = 0
        const pickupStoreIds = []
        let isMissingShippingAddress = false
        let isMissingShippingMethod = false
        currentBasket?.shipments?.forEach((shipment) => {
            if (shipmentIdToTotalItems[shipment.shipmentId]) {
                if (storeLocatorEnabled && isPickupShipment(shipment)) {
                    totalPickupShipments += 1
                    pickupStoreIds.push(shipment.c_fromStoreId)
                } else {
                    totalDeliveryShipments += 1
                    if (isAddressEmpty(shipment.shippingAddress)) {
                        isMissingShippingAddress = true
                    }
                    if (!shipment.shippingMethod) {
                        isMissingShippingMethod = true
                    }
                }
            }
        })
        // sorting helps with query caching
        pickupStoreIds.sort()

        // Calculate total shipping cost
        // Use currentBasket.shippingTotal to include all costs (base _ promotions + surcharges + other fees)
        const totalShippingCost = currentBasket?.shippingTotal || 0

        return {
            totalItems,
            shipmentIdToTotalItems,
            totalDeliveryShipments,
            totalPickupShipments,
            pickupStoreIds,
            isMissingShippingAddress,
            isMissingShippingMethod,
            totalShippingCost
        }
    }, [
        currentBasket?.productItems,
        currentBasket?.shipments,
        currentBasket?.shippingItems,
        storeLocatorEnabled
    ])

    return {
        ...restOfQuery,
        data: currentBasket,
        derivedData: {
            hasBasket: basketsData?.total > 0,
            ...memoizedDerived
        }
    }
}
