/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// Adapter for the `CartExtension` slot Cimulate exposes on the in-widget cart
// summary card. Contract:
//
//   1. `registerCartExtensionElement()` defines the custom element on module load
//      (the tag must be defined before Cimulate first calls document.createElement
//      on it).
//   2. Merchants advertise the tag name to Cimulate via the commerce-agent
//      config: `cc_overrides: { CartExtension: 'sf-cart-extension' }`.
//      The runtime plumbing (resolveCommerceClientOverrideOptions) forwards it to
//      the widget's OverridesProvider; this module does not touch
//      `window.CimulateOverrides` directly.
//   3. This React component subscribes to the custom-element registry and portals
//      React content into every mounted `<sf-cart-extension>` from within our
//      host tree — so the portalled subtree inherits QueryClient,
//      CommerceApiProvider, ChakraProvider, and SF Payments state without a
//      separate provider bridge.
//
// Unlike the PDP tile extension, this adapter binds to the shopper's live
// (non-temporary) basket via `useCurrentBasket`. No temporary basket is
// created and no cleanup is scheduled — the current basket IS the checkout.

import React, {useCallback, useEffect, useRef, useSyncExternalStore} from 'react'
import {createPortal} from 'react-dom'
import {useQueryClient} from '@tanstack/react-query'

import {useSFPaymentsEnabled} from '@salesforce/retail-react-app/app/hooks/use-sf-payments'
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'
import SFPaymentsExpressAgent from '@salesforce/retail-react-app/app/components/sf-payments-express-agent'
import {
    getCartExtensionElements,
    getCartExtensionVersion,
    registerCartExtensionElement,
    subscribeToCartExtensionElements
} from '@salesforce/retail-react-app/app/components/sf-payments-express-agent/cart-extension-element'

registerCartExtensionElement()

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

const ExtensionContents = ({element, currentBasket}) => {
    const payload = element.props?.payload ?? {}
    const selection = payload.selection
    const api = element.props?.api

    // The widget's cart payload carries its own currency + running total in
    // `selection`; no need to consult useCurrency() here (the cart may be
    // priced differently than the site default on multi-currency storefronts).
    const initialAmount = selection?.total
    const paymentCurrency = selection?.currency
    const available = selection?.available !== false

    const prepareBasket = useCallback(async () => {
        if (!currentBasket?.basketId) {
            throw new Error('cart-extension: no current basket')
        }
        return currentBasket
    }, [currentBasket])

    const onComplete = (order) => {
        api?.appendOrderConfirmation?.(scapiOrderToOrderDetails(order))
    }
    const onCancel = () => {}
    const onError = () => {}

    // Sync bridge: the widget mutates the basket server-side (Core → SCAPI)
    // without going through PWA Kit's React Query mutations, so our
    // customerBaskets cache never sees those updates. When Cimulate hands us a
    // selection with items but our basket cache is empty, force a refetch so
    // the SF Payments guard below sees the real basket. Deduplicated by widget
    // total to avoid re-invalidating the same mismatch every render.
    const queryClient = useQueryClient()
    const lastInvalidatedForTotal = useRef(null)
    const widgetHasItems = (selection?.total ?? 0) > 0
    const pwaBasketId = currentBasket?.basketId
    useEffect(() => {
        if (widgetHasItems && !pwaBasketId && lastInvalidatedForTotal.current !== selection?.total) {
            lastInvalidatedForTotal.current = selection?.total
            queryClient.invalidateQueries()
        }
    }, [widgetHasItems, pwaBasketId, selection?.total, queryClient])

    if (!currentBasket?.basketId || !initialAmount || !paymentCurrency || !available) {
        return null
    }

    return (
        <div data-testid="sf-cart-extension-adapter">
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

export const SFPaymentsCartExtensionAdapter = () => {
    const sfPaymentsEnabled = useSFPaymentsEnabled()

    // Hoisted so useCustomerBaskets fetches as soon as this adapter mounts
    // (i.e. on any page where the agent is enabled), not just when Cimulate
    // mounts the cart card. Without this, opening the widget on a route that
    // never touches the basket (home, PDP, PLP) leaves currentBasket undefined
    // and the extension renders nothing until the shopper visits /cart.
    const {data: currentBasket} = useCurrentBasket()

    useSyncExternalStore(
        subscribeToCartExtensionElements,
        getCartExtensionVersion,
        () => 0
    )

    if (!sfPaymentsEnabled) return null

    const elements = getCartExtensionElements()
    if (!elements.length) return null

    return (
        <>
            {elements.map((element) => {
                const basketId = element.props?.payload?.cart?.id ?? 'unknown'
                return createPortal(
                    <ExtensionContents element={element} currentBasket={currentBasket} />,
                    element,
                    basketId
                )
            })}
        </>
    )
}

export default SFPaymentsCartExtensionAdapter
