/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// Adapter for the `ProductTileExtension` slot Cimulate exposes on the in-widget
// product detail card. Contract:
//
//   1. `registerTileExtensionElement()` defines the custom element on module load
//      (the tag must be defined before Cimulate first calls document.createElement
//      on it).
//   2. Merchants advertise the tag name to Cimulate via the commerce-agent
//      config: `cc_overrides: { ProductTileExtension: 'sf-product-tile-extension' }`.
//      The runtime plumbing (resolveCommerceClientOverrideOptions) forwards it to
//      the widget's OverridesProvider; this module does not touch
//      `window.CimulateOverrides` directly.
//   3. This React component subscribes to the custom-element registry and portals
//      React content into every mounted `<sf-product-tile-extension>` from within
//      our host tree — so the portalled subtree inherits QueryClient,
//      CommerceApiProvider, ChakraProvider, and SF Payments state without a
//      separate provider bridge.

import React, {useCallback, useSyncExternalStore} from 'react'
import {createPortal} from 'react-dom'

import {useShopperBasketsV2Mutation as useShopperBasketsMutation} from '@salesforce/commerce-sdk-react'

import {useSFPaymentsEnabled} from '@salesforce/retail-react-app/app/hooks/use-sf-payments'
import {useCurrency} from '@salesforce/retail-react-app/app/hooks/use-currency'
import {useCleanupTemporaryBaskets} from '@salesforce/retail-react-app/app/hooks/use-cleanup-temporary-baskets'
import SFPaymentsExpressAgent from '@salesforce/retail-react-app/app/components/sf-payments-express-agent'
import {
    getTileExtensionElements,
    getTileExtensionVersion,
    registerTileExtensionElement,
    subscribeToTileExtensionElements
} from '@salesforce/retail-react-app/app/components/sf-payments-express-agent/tile-extension-element'

// Register the custom element on module load. Idempotent so re-importing this
// module doesn't create duplicate definitions.
registerTileExtensionElement()

// SCAPI Order → Cimulate OrderDetails. Kept intentionally lossy: Cimulate's
// order-confirmation card renders whatever we hand it and gracefully hides
// fields left as null / empty arrays, so we only map what we can source
// unambiguously from an SCAPI order and defer the rest (shipping/promotion
// breakdown, header/body/footer copy) to future work.
const scapiOrderToOrderDetails = (order) => {
    const currencyCode = order?.currency ?? 'USD'
    const items = (order?.productItems ?? []).map((item) => ({
        itemId: item.itemId ?? item.productId,
        productId: item.productId,
        name: item.productName ?? '',
        imageUrl: '',
        quantity: item.quantity ?? 1,
        itemSubtotal: item.priceAfterItemDiscount ?? item.price ?? 0,
        originalSubtotal: item.price ?? item.priceAfterItemDiscount ?? 0,
        variants: [],
        promotions: [],
        coupons: []
    }))
    return {
        id: order?.orderNo ?? '',
        orderedOn: order?.creationDate ?? new Date().toISOString(),
        currencyCode,
        items,
        subtotal: order?.productSubTotal ?? 0,
        total: order?.orderTotal ?? 0,
        taxes: order?.taxTotal ?? null,
        shippingCost: order?.shippingTotal ?? null,
        shippingDiscount: null,
        shippingPromotions: [],
        promotionsDiscount: null,
        promotions: [],
        couponsDiscount: null,
        couponsApplied: (order?.couponItems ?? []).map((c) => c.code).filter(Boolean),
        headerMessage: null,
        bodyMessage: null,
        footerMessage: null
    }
}

const ExtensionContents = ({element}) => {
    const payload = element.props?.payload ?? {}
    const data = payload.data ?? {}
    const selection = payload.selection
    const api = element.props?.api

    // Widget passes the resolved orderable SKU + selected quantity + price via
    // `selection` on every variant/quantity change. Prefer them; fall back to the
    // block's `vmat[0]`/top-level id for backward compatibility with widget
    // versions that predate the selection contract. Note the fallback is
    // best-effort: on variant-required products `vmat[0]` may not be the SKU the
    // user actually chose.
    const productId = selection?.sku ?? data.vmat?.[0]?.pid ?? data.id
    const quantity = selection?.quantity ?? 1
    const initialAmount = selection?.price?.cur ?? selection?.price?.orig ?? data.pr?.cur ?? data.pr?.orig
    const available = selection ? selection.available !== false : true

    const {currency: paymentCurrency} = useCurrency()

    const {mutateAsync: createBasket} = useShopperBasketsMutation('createBasket')
    const {mutateAsync: addItemToBasket} = useShopperBasketsMutation('addItemToBasket')
    const cleanupTemporaryBaskets = useCleanupTemporaryBaskets()

    const prepareBasket = useCallback(async () => {
        if (!productId) throw new Error('tile-extension: missing productId in payload')

        await cleanupTemporaryBaskets()

        const newBasket = await createBasket({
            parameters: {temporary: true},
            body: {}
        })

        return addItemToBasket({
            parameters: {basketId: newBasket.basketId},
            body: [{productId, quantity}]
        })
    }, [productId, quantity, cleanupTemporaryBaskets, createBasket, addItemToBasket])

    const onComplete = (order) => {
        api?.appendOrderConfirmation?.(scapiOrderToOrderDetails(order))
    }
    const onCancel = () => {}
    const onError = () => {}

    if (!productId || !initialAmount || !paymentCurrency) return null
    if (!available) return null

    return (
        <div data-testid="sf-product-tile-extension-adapter">
            <SFPaymentsExpressAgent
                prepareBasket={prepareBasket}
                paymentCurrency={paymentCurrency}
                paymentCountryCode={null}
                initialAmount={initialAmount}
                onComplete={onComplete}
                onCancel={onCancel}
                onError={onError}
            />
        </div>
    )
}

export const SFPaymentsTileExtensionAdapter = () => {
    const sfPaymentsEnabled = useSFPaymentsEnabled()

    useSyncExternalStore(
        subscribeToTileExtensionElements,
        getTileExtensionVersion,
        () => 0
    )

    if (!sfPaymentsEnabled) return null

    const elements = getTileExtensionElements()
    if (!elements.length) return null

    return (
        <>
            {elements.map((element) => {
                const productId = element.props?.payload?.id ?? 'unknown'
                return createPortal(
                    <ExtensionContents element={element} />,
                    element,
                    productId
                )
            })}
        </>
    )
}

export default SFPaymentsTileExtensionAdapter
