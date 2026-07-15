/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * SCAPI coupon statuses that mean a discount is actually on the basket.
 *
 * `addCouponToBasket` returns HTTP 200 and adds a coupon item even when the
 * code is valid but no promotion in the cart qualifies — it signals the real
 * outcome via `couponItems[].statusCode`, NOT via an error. Only `applied`
 * (a campaign promotion qualified) and `adhoc` (a coupon applied via a custom,
 * non-campaign price adjustment) represent a coupon that took effect; every
 * other status (`no_applicable_promotion`, `no_active_promotion`,
 * `coupon_disabled`, `redemption_limit_exceeded`, …) is a coupon that was
 * recognized but produced no price adjustment.
 *
 * Note: the `valid` field is NOT a substitute for this check — per the SCAPI
 * schema, `valid` is `true` for `no_applicable_promotion` too, so keying on
 * `valid` would reintroduce the false "applied" state.
 */
export const APPLIED_COUPON_STATUSES = ['applied', 'adhoc']

/**
 * Whether a coupon item reflects a discount actually applied to the basket.
 * Use this to decide which `couponItems` to present as applied in the UI.
 *
 * @param {{statusCode?: string}} [item] A basket coupon item.
 * @returns {boolean}
 */
export const isCouponApplied = (item) =>
    Boolean(item?.statusCode) && APPLIED_COUPON_STATUSES.includes(item.statusCode)

/**
 * Given the basket before an `addCouponToBasket` call and the basket it
 * returned, find the coupon item the call added.
 *
 * Identify by `couponItemId` diff rather than by matching the submitted `code`:
 * SCAPI normalizes the code it stores (e.g. lowercases it), so an equality check
 * against the shopper's typed value can miss the coupon. When the code was
 * already on the basket, SCAPI adds no new item, so this returns `undefined` —
 * which callers treat as "not newly applied".
 *
 * @param {{couponItems?: Array<{couponItemId?: string}>}} [priorBasket]
 * @param {{couponItems?: Array<{couponItemId?: string}>}} [updatedBasket]
 * @returns {object | undefined} The newly-added coupon item, or `undefined`.
 */
export const findAddedCoupon = (priorBasket, updatedBasket) => {
    const priorIds = new Set((priorBasket?.couponItems ?? []).map((item) => item.couponItemId))
    return (updatedBasket?.couponItems ?? []).find((item) => !priorIds.has(item.couponItemId))
}

/**
 * Decide whether an `addCouponToBasket` response represents a coupon that
 * actually discounted the basket.
 *
 * `addCouponToBasket` returns HTTP 200 even when the code is valid but no
 * promotion qualifies — it parks the coupon and signals the real outcome via
 * `couponItems[].statusCode`. So a non-throwing 2xx is NOT sufficient to declare
 * success: locate the coupon the call added and confirm its status is applied.
 *
 * @param {object} [priorBasket] Basket state before the mutation.
 * @param {object} [updatedBasket] Basket returned by `addCouponToBasket`.
 * @returns {boolean} `true` only when the added coupon took effect.
 */
export const wasCouponApplied = (priorBasket, updatedBasket) =>
    isCouponApplied(findAddedCoupon(priorBasket, updatedBasket))
