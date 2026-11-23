/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

export const CART_ACTION_EVENT = 'cimulate:cart-action'
export const CART_UPDATE_EVENT = 'cimulate:cart-update'
export const CART_CHANGED_EVENT = 'commerceclient:cart-changed'
// Catalog decoration is excluded from serialized basket/version state.
export const CART_PRODUCTS = Symbol('commerce-client-products')

export const normalizeCartTransport = (value) =>
    typeof value === 'string' && value.trim().toLowerCase() === 'direct' ? 'direct' : 'agent'

export const normalizeCartPageUrl = (value) => {
    if (typeof value !== 'string' || !value.trim()) return ''
    const url = value.trim()
    // Backslashes and control characters can change the URL's parsed origin.
    if (url.includes('\\') || [...url].some((character) => character.charCodeAt(0) <= 32)) return ''
    if (url.startsWith('/') && !url.startsWith('//')) return url
    try {
        const parsed = new URL(url)
        return parsed.protocol === 'https:' && !parsed.username && !parsed.password ? url : ''
    } catch (error) {
        return ''
    }
}

// Compare storefront basket data with the last basket published to the widget.
export const basketVersion = (basket) => JSON.stringify(basket || null)

export const mapBasketToWidgetCart = (basket, {checkoutUrl = '/checkout'} = {}) => {
    const coupons = (basket?.couponItems || []).map(({code, couponItemId, status}) => ({
        code,
        id: couponItemId,
        status
    }))
    const promotions = (basket?.orderPriceAdjustments || [])
        .map((entry) => entry.itemText || entry.promotionId)
        .filter(Boolean)
    return {
        id: basket?.basketId || '',
        currencyCode: basket?.currency || '',
        items: (basket?.productItems || []).map((item) => {
            const product = basket[CART_PRODUCTS]?.[item.productId]
            const image =
                product?.imageGroups?.find((group) => group.viewType === 'small') ||
                product?.imageGroups?.[0]
            const variants =
                product?.variationAttributes
                    ?.map((attribute) => {
                        const value = product.variationValues?.[attribute.id]
                        return {
                            lbl: attribute.name || attribute.id,
                            type: attribute.id,
                            value:
                                attribute.values?.find((entry) => entry.value === value)?.name ||
                                value
                        }
                    })
                    .filter((entry) => entry.value) || []
            return {
                itemId: item.itemId,
                productId: item.productId,
                name: item.productName || item.productId,
                imageUrl: item.image?.link || image?.images?.[0]?.link || '',
                ...(product?.minOrderQuantity ? {minQuantity: product.minOrderQuantity} : {}),
                quantity: item.quantity,
                itemSubtotal:
                    item.priceAfterOrderDiscount ?? item.priceAfterItemDiscount ?? item.price ?? 0,
                originalSubtotal:
                    item.basePrice == null ? item.price ?? 0 : item.basePrice * item.quantity,
                variants: variants.length
                    ? variants
                    : (item.variationValues || []).map(({name, key, value}) => ({
                          lbl: name || key,
                          type: key,
                          value
                      })),
                promotions: (item.priceAdjustments || [])
                    .map((entry) => entry.itemText || entry.promotionId)
                    .filter(Boolean),
                coupons: []
            }
        }),
        subtotal: basket?.productSubTotal ?? 0,
        total: basket?.orderTotal ?? basket?.productSubTotal ?? 0,
        taxes: basket?.taxTotal ?? null,
        taxationMode: basket?.taxation || null,
        shippingCost: basket?.shippingTotal ?? null,
        shippingDiscount:
            basket?.shippingTotal != null && basket?.adjustedShippingTotal != null
                ? basket.shippingTotal - basket.adjustedShippingTotal
                : null,
        shippingPromotions: [],
        promotionsDiscount: basket?.orderPriceAdjustments?.length
            ? -basket.orderPriceAdjustments.reduce(
                  (sum, adjustment) => sum + (adjustment.price || 0),
                  0
              )
            : null,
        promotions,
        couponsDiscount: null,
        couponsApplied: coupons.filter((coupon) => coupon.status === 'applied'),
        coupons,
        headerMessage: null,
        bodyMessage: null,
        footerMessage: null,
        checkoutButtonUrl: checkoutUrl,
        expressPaymentUrl: null
    }
}

const CHECK_CART = 'Open View Cart to check the basket before making another change.'
const SHOPPER_CHANGED = 'Your shopper session changed. Open View Cart before trying again.'

/** Serialized, single-attempt adapter. Neither a timeout nor a failed follow-up
 * read resends a write. Only an explicit successful View Cart read clears an
 * uncertain-write barrier, after the original request has settled. */
export const createCommerceClientCart = ({
    getIdentity,
    readBasket,
    writeBasket,
    publish,
    clear,
    timeoutMs = 8000
}) => {
    let generation = 0
    let revision = 0
    let queue = Promise.resolve()
    let uncertain = false
    let pendingWrites = 0
    const valid = (identity, epoch, version) =>
        identity === getIdentity() && epoch === generation && version === revision
    const deadline = async (operation) => {
        let timer
        try {
            return await Promise.race([
                operation,
                new Promise((resolve, reject) => {
                    timer = setTimeout(() => reject(new Error(CHECK_CART)), timeoutMs)
                })
            ])
        } finally {
            clearTimeout(timer)
        }
    }
    const enqueue = (run) => {
        const result = queue.then(run, run)
        queue = result.catch(() => {})
        return result
    }
    const read = async (identity, epoch, version) => {
        const basket = await readBasket(identity)
        if (!valid(identity, epoch, version)) throw new Error(SHOPPER_CHANGED)
        const cart = publish(basket, identity)
        return {ok: true, cart}
    }
    const refresh = () => {
        const identity = getIdentity()
        const epoch = generation
        const version = ++revision
        return enqueue(async () => {
            if (!valid(identity, epoch, version)) return
            try {
                return await deadline(read(identity, epoch, version))
            } catch (error) {
                if (valid(identity, epoch, version)) revision++
                throw error
            }
        })
    }
    const action = (request) => {
        const identity = getIdentity()
        const epoch = generation
        return enqueue(async () => {
            if (epoch !== generation || identity !== getIdentity())
                return {ok: false, error: SHOPPER_CHANGED}
            const version = revision
            const isWrite = request.action !== 'get'
            let sent = false
            try {
                if (isWrite && uncertain) throw new Error(CHECK_CART)
                return await deadline(
                    (async () => {
                        if (!isWrite && pendingWrites) throw new Error(CHECK_CART)
                        // Always resolve the active shopper basket rather than using an old line's basket id.
                        let basket = await readBasket(identity)
                        if (!valid(identity, epoch, version)) throw new Error(SHOPPER_CHANGED)
                        if (isWrite) {
                            validateCartAction(request, basket)
                            sent = true
                            pendingWrites++
                            try {
                                await writeBasket(request, basket, identity)
                            } finally {
                                pendingWrites--
                            }
                            if (!valid(identity, epoch, version)) throw new Error(SHOPPER_CHANGED)
                            return read(identity, epoch, version)
                        }
                        if (pendingWrites) throw new Error(CHECK_CART)
                        const cart = publish(basket, identity)
                        uncertain = false
                        return {ok: true, cart}
                    })()
                )
            } catch (error) {
                // Invalidate late read/write completions after the deadline.
                if (valid(identity, epoch, version)) revision++
                if (isWrite && sent && epoch === generation) uncertain = true
                return {ok: false, error: sent ? CHECK_CART : error.message || CHECK_CART}
            }
        })
    }
    return {
        action,
        refresh,
        reset: () => {
            generation++
            revision++
            uncertain = false
            clear()
        }
    }
}

export const validateCartAction = (request, basket) => {
    if (!['add', 'quantity', 'remove', 'coupon'].includes(request.action))
        throw new Error('Unsupported cart action.')
    if (
        ['add', 'quantity'].includes(request.action) &&
        (!Number.isSafeInteger(request.quantity) || request.quantity < 1)
    )
        throw new Error('Choose a positive whole-number quantity.')
    if (
        request.action === 'add' &&
        (typeof request.productId !== 'string' || !request.productId.trim())
    )
        throw new Error('Select a product variant first.')
    if (request.action === 'coupon' && (typeof request.code !== 'string' || !request.code.trim()))
        throw new Error('Enter a coupon code.')
    if (
        ['quantity', 'remove'].includes(request.action) &&
        !basket?.productItems?.some(
            (item) => item.itemId === request.itemId && item.productId === request.productId
        )
    )
        throw new Error('This item changed. Open View Cart to refresh it.')
}
