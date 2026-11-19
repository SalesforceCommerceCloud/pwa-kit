/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {DEFAULT_SHIPMENT_ID} from '@salesforce/retail-react-app/app/constants'

const PREFIX = 'commerceclient:wallet:'
const MAX_AGE = 15 * 60 * 1000

// Store a quote version rather than duplicating addresses or payment details in
// sessionStorage. lastModified also binds non-price basket changes on Commerce.
export const walletBasketVersion = (basket) =>
    JSON.stringify({
        basketId: basket?.basketId,
        lastModified: basket?.lastModified,
        currency: basket?.currency,
        total: basket?.orderTotal,
        subtotal: basket?.productSubTotal,
        shipping: basket?.shippingTotal,
        tax: basket?.taxTotal,
        items: basket?.productItems?.map(
            ({
                itemId,
                productId,
                quantity,
                price,
                priceAfterItemDiscount,
                priceAfterOrderDiscount
            }) => ({
                itemId,
                productId,
                quantity,
                price,
                priceAfterItemDiscount,
                priceAfterOrderDiscount
            })
        ),
        coupons: basket?.couponItems?.map(({code, status}) => ({code, status})),
        shipments: basket?.shipments?.map(({shipmentId, shippingMethod, c_fromStoreId}) => ({
            shipmentId,
            method: shippingMethod?.id,
            store: c_fromStoreId
        }))
    })

export const isWalletBasketEligible = (basket) =>
    Boolean(
        basket?.basketId &&
            basket.productItems?.length &&
            Number.isFinite(basket.orderTotal) &&
            basket.orderTotal > 0 &&
            basket.shipments?.length === 1 &&
            basket.shipments[0].shipmentId === DEFAULT_SHIPMENT_ID &&
            !basket.shipments[0].c_fromStoreId &&
            !basket.temporaryBasket
    )

export const createWalletLaunch = ({basket, identity, url}) => {
    if (!isWalletBasketEligible(basket) || !identity) return null
    try {
        const launch = window.crypto.randomUUID()
        window.sessionStorage.setItem(
            PREFIX + launch,
            JSON.stringify({
                identity,
                basketId: basket.basketId,
                version: walletBasketVersion(basket),
                createdAt: Date.now()
            })
        )
        return {id: launch, url: `${url}?launch=${encodeURIComponent(launch)}`}
    } catch (error) {
        return null
    }
}

export const removeWalletLaunch = (id) => {
    if (!id) return
    try {
        window.sessionStorage.removeItem(PREFIX + id)
    } catch (error) {
        /* Storage may be disabled. */
    }
}

export const readWalletLaunch = (id) => {
    try {
        const launch = JSON.parse(window.sessionStorage.getItem(PREFIX + id))
        return launch &&
            Date.now() - launch.createdAt >= 0 &&
            Date.now() - launch.createdAt < MAX_AGE
            ? launch
            : null
    } catch (error) {
        return null
    }
}

export const validateWalletLaunch = ({launch, identity, basket, checkVersion = true}) => {
    if (
        !launch ||
        launch.identity !== identity ||
        launch.basketId !== basket?.basketId ||
        !isWalletBasketEligible(basket) ||
        (checkVersion && launch.version !== walletBasketVersion(basket))
    ) {
        throw new Error('Your cart changed. Open View Cart before starting express checkout again.')
    }
    return basket
}
