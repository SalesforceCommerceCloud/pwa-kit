/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * Pure utility functions for return-eligibility on an order.
 * No side effects, easily testable.
 */

/**
 * Returns the subset of an order's product items that can currently be returned.
 *
 * An item is returnable when its `omsData.quantityAvailableToReturn` is greater
 * than zero AND the parent order's `omsData.status` is one of
 * `returnEligibleStatuses`. Status comparison is case-insensitive and trims
 * surrounding whitespace.
 *
 * Eligibility is strictly OMS-driven: orders without an `omsData` envelope
 * (ECOM-only) always return [] regardless of the plain `order.status`.
 *
 * Adversarial inputs are normalized rather than thrown on, since
 * `returnEligibleStatuses` originates from merchant config and `omsData.status`
 * comes from a backend response: a non-array `returnEligibleStatuses` is treated
 * as empty, and a non-string `omsData.status` is coerced to a string.
 *
 * @param {Object} order Shopper Orders order document, optionally with `omsData`.
 * @param {string[]} [returnEligibleStatuses] Order-level statuses that allow returns.
 * @returns {Array<Object>} The subset of `order.productItems` that are returnable, or [].
 */
export const getReturnableItems = (order, returnEligibleStatuses = []) => {
    if (!order?.productItems?.length) return []
    const statuses = Array.isArray(returnEligibleStatuses) ? returnEligibleStatuses : []
    const allowed = statuses
        .map((s) =>
            String(s ?? '')
                .trim()
                .toLowerCase()
        )
        .filter(Boolean)
    if (!allowed.length) return []
    const orderStatus = String(order.omsData?.status ?? '')
        .trim()
        .toLowerCase()
    if (!allowed.includes(orderStatus)) return []
    return order.productItems.filter((item) => {
        const qty = item?.omsData?.quantityAvailableToReturn
        return Number.isFinite(qty) && qty > 0
    })
}
