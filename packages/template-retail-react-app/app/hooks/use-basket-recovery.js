/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useCommerceApi} from '@salesforce/commerce-sdk-react'
import useAuthContext from '@salesforce/commerce-sdk-react/hooks/useAuthContext'
import {useShopperBasketsMutation} from '@salesforce/commerce-sdk-react'

// Dev-only debug logger to keep recovery silent in production
const devDebug = (...args) => {
    if (process.env.NODE_ENV !== 'production') {
        console.debug(...args)
    }
}

/**
 * Reusable basket recovery hook to stabilize basket after OTP/auth swap.
 * - Attempts merge (if caller already merged, pass skipMerge=true)
 * - Hydrates destination basket by id with retry
 * - Fallbacks to create/copy items and re-apply shipping
 */
const useBasketRecovery = () => {
    const api = useCommerceApi()
    const auth = useAuthContext()

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
        destinationBasketId,
        items = [],
        shipment = null,
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
            await addItemToBasket.mutateAsync({
                parameters: {basketId: destinationBasketId},
                body: payload
            })
        }

        if (shipment) {
            const shippingAddress = shipment.shippingAddress
            if (shippingAddress) {
                await updateShippingAddressForShipment.mutateAsync({
                    parameters: {basketId: destinationBasketId, shipmentId},
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
            const methodId = shipment?.shippingMethod?.id
            if (methodId) {
                await updateShippingMethodForShipment.mutateAsync({
                    parameters: {basketId: destinationBasketId, shipmentId},
                    body: {id: methodId}
                })
            }
        }
    }

    const recoverBasketAfterAuth = async ({
        preLoginItems = [],
        shipment = null,
        doMerge = true
    } = {}) => {
        // Ensure fresh token in provider
        await auth.refreshAccessToken()

        let destinationBasketId
        if (doMerge) {
            try {
                const merged = await mergeBasket.mutateAsync({
                    parameters: {createDestinationBasket: true}
                })
                destinationBasketId = merged?.basketId || merged?.basket_id || merged?.id
            } catch (_e) {
                devDebug('useBasketRecovery: mergeBasket failed; proceeding without merge', _e)
            }
        }

        if (!destinationBasketId) {
            try {
                const list = await api.shopperCustomers.getCustomerBaskets({
                    parameters: {customerId: 'me'}
                })
                destinationBasketId = list?.baskets?.[0]?.basketId
            } catch (_e) {
                devDebug(
                    'useBasketRecovery: getCustomerBaskets failed; will attempt hydration/create',
                    _e
                )
            }
        }

        if (destinationBasketId) {
            // Avoid triggering a hook-level refetch that can cause UI remounts.
            // Instead, probe the destination basket directly for shipment id.
            let hydrated = null
            try {
                hydrated = await api.shopperBaskets.getBasket({
                    headers: {authorization: `Bearer ${auth.get('access_token')}`},
                    parameters: {basketId: destinationBasketId}
                })
            } catch (_e) {
                devDebug('useBasketRecovery: getBasket hydration failed', _e)
                hydrated = null
            }
            if (!hydrated) {
                try {
                    const created = await createBasket.mutateAsync({})
                    destinationBasketId =
                        created?.basketId ||
                        created?.basket_id ||
                        created?.id ||
                        destinationBasketId
                    await copyItemsAndShipping(destinationBasketId, preLoginItems, shipment)
                } catch (_e) {
                    devDebug(
                        'useBasketRecovery: createBasket/copyItems failed during hydration path',
                        _e
                    )
                }
            } else if (shipment) {
                // PII (shipping address/method) is not merged by API; re-apply from snapshot
                try {
                    const effectiveDestId = hydrated?.basketId || destinationBasketId
                    const destShipmentId =
                        hydrated?.shipments?.[0]?.shipmentId || hydrated?.shipments?.[0]?.id || 'me'
                    await copyItemsAndShipping(effectiveDestId, [], shipment, destShipmentId)
                } catch (_e) {
                    devDebug('useBasketRecovery: re-applying shipping from snapshot failed', _e)
                }
            }
        } else {
            try {
                const created = await createBasket.mutateAsync({})
                destinationBasketId = created?.basketId || created?.basket_id || created?.id
                await copyItemsAndShipping(destinationBasketId, preLoginItems, shipment)
            } catch (_e) {
                devDebug('useBasketRecovery: createBasket/copyItems failed in fallback path', _e)
            }
        }

        return destinationBasketId
    }

    return {recoverBasketAfterAuth}
}

export default useBasketRecovery
