/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useCommerceApi} from '@salesforce/commerce-sdk-react'
import useAuthContext from '@salesforce/commerce-sdk-react/hooks/useAuthContext'
import {useShopperBasketsMutation} from '@salesforce/commerce-sdk-react'

/**
 * Reusable basket recovery hook to stabilize basket after OTP/auth swap.
 * - Attempts merge (if caller already merged, pass skipMerge=true)
 * - Hydrates destination basket by id with retry
 * - Fallbacks to create/copy items and re-apply shipping
 */
const useBasketRecovery = () => {
    const api = useCommerceApi()
    const auth = useAuthContext()
    // const currentBasketQuery = useCurrentBasket()

    const mergeBasket = useShopperBasketsMutation('mergeBasket')
    const createBasket = useShopperBasketsMutation('createBasket')
    const addItemToBasket = useShopperBasketsMutation('addItemToBasket')
    const updateShippingAddressForShipment = useShopperBasketsMutation(
        'updateShippingAddressForShipment'
    )
    const updateShippingMethodForShipment = useShopperBasketsMutation(
        'updateShippingMethodForShipment'
    )

    const copyItemsAndShipping = async (
        destBasketId,
        items = [],
        shipmentSnapshot = null,
        shipmentId = 'me'
    ) => {
        if (items?.length) {
            const payload = items.map((item) => {
                const productId = item.productId || item.product_id || item.id || item.product?.id
                const quantity = item.quantity || item.amount || 1
                const variationAttributes =
                    item.variationAttributes || item.variation_attributes || []
                const optionItems = item.optionItems || item.option_items || []
                const mappedVariations = Array.isArray(variationAttributes)
                    ? variationAttributes.map((v) => ({
                          attributeId: v.attributeId || v.attribute_id || v.id,
                          valueId: v.valueId || v.value_id || v.value
                      }))
                    : []
                const mappedOptions = Array.isArray(optionItems)
                    ? optionItems.map((o) => ({
                          optionId: o.optionId || o.option_id || o.id,
                          optionValueId:
                              o.optionValueId || o.optionValue || o.option_value || o.value
                      }))
                    : []
                const obj = {productId, quantity}
                if (mappedVariations.length) obj.variationAttributes = mappedVariations
                if (mappedOptions.length) obj.optionItems = mappedOptions
                return obj
            })
            await addItemToBasket.mutateAsync({parameters: {basketId: destBasketId}, body: payload})
        }

        if (shipmentSnapshot) {
            const shippingAddress = shipmentSnapshot.shippingAddress
            if (shippingAddress) {
                await updateShippingAddressForShipment.mutateAsync({
                    parameters: {basketId: destBasketId, shipmentId},
                    body: {
                        address1: shippingAddress.address1,
                        address2: shippingAddress.address2,
                        city: shippingAddress.city,
                        countryCode: shippingAddress.countryCode,
                        firstName: shippingAddress.firstName,
                        lastName: shippingAddress.lastName,
                        phone: shippingAddress.phone,
                        postalCode: shippingAddress.postalCode,
                        stateCode: shippingAddress.stateCode
                    }
                })
            }
            const methodId = shipmentSnapshot?.shippingMethod?.id
            if (methodId) {
                await updateShippingMethodForShipment.mutateAsync({
                    parameters: {basketId: destBasketId, shipmentId},
                    body: {id: methodId}
                })
            }
        }
    }

    const recoverBasketAfterAuth = async ({
        preLoginItems = [],
        shipmentSnapshot = null,
        doMerge = true
    } = {}) => {
        // Ensure fresh token in provider
        await auth.refreshAccessToken()
        // Defer invalidation to the end to avoid duplicate basket/shipping-method refetches

        let destId
        if (doMerge) {
            try {
                const merged = await mergeBasket.mutateAsync({
                    parameters: {createDestinationBasket: true}
                })
                destId = merged?.basketId || merged?.basket_id || merged?.id
            } catch (_e) {
                /* noop */
            }
        }

        if (!destId) {
            try {
                const list = await api.shopperCustomers.getCustomerBaskets({
                    parameters: {customerId: 'me'}
                })
                destId = list?.baskets?.[0]?.basketId
            } catch (_e) {
                /* noop */
            }
        }

        if (destId) {
            // Avoid triggering a hook-level refetch that can cause UI remounts.
            // Instead, probe the destination basket directly for shipment id.
            let hydrated = null
            try {
                hydrated = await api.shopperBaskets.getBasket({
                    headers: {authorization: `Bearer ${auth.get('access_token')}`},
                    parameters: {basketId: destId}
                })
            } catch (_e) {
                hydrated = null
            }
            if (!hydrated) {
                try {
                    const created = await createBasket.mutateAsync({})
                    destId = created?.basketId || created?.basket_id || created?.id || destId
                    await copyItemsAndShipping(destId, preLoginItems, shipmentSnapshot)
                } catch (_e) {
                    /* noop */
                }
            } else if (shipmentSnapshot) {
                // PII (shipping address/method) is not merged by API; re-apply from snapshot
                try {
                    const effectiveDestId = hydrated?.basketId || destId
                    const destShipmentId =
                        hydrated?.shipments?.[0]?.shipmentId || hydrated?.shipments?.[0]?.id || 'me'
                    await copyItemsAndShipping(
                        effectiveDestId,
                        [],
                        shipmentSnapshot,
                        destShipmentId
                    )
                } catch (_e) {
                    /* noop */
                }
            }
        } else {
            try {
                const created = await createBasket.mutateAsync({})
                destId = created?.basketId || created?.basket_id || created?.id
                await copyItemsAndShipping(destId, preLoginItems, shipmentSnapshot)
            } catch (_e) {
                /* noop */
            }
        }

        return destId
    }

    return {recoverBasketAfterAuth}
}

export default useBasketRecovery
