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
 * than zero AND the parent order's status is one of `returnEligibleStatuses`.
 * Status comparison is case-insensitive and trims surrounding whitespace.
 *
 * Order documents without an `omsData` envelope (ECOM-only) safely return [],
 * because the order-level OMS status is undefined and cannot match.
 *
 * @param {Object} order Shopper Orders order document, optionally with `omsData`.
 * @param {string[]} [returnEligibleStatuses] Order-level statuses that allow returns.
 * @returns {Array<Object>} The subset of `order.productItems` that are returnable, or [].
 */
export const getReturnableItems = (order, returnEligibleStatuses = []) => {
    if (!order?.productItems?.length) return []
    const allowed = (returnEligibleStatuses || [])
        .map((s) => String(s).trim().toLowerCase())
        .filter(Boolean)
    if (!allowed.length) return []
    const orderStatus = (order.omsData?.status || order.status || '').trim().toLowerCase()
    if (!allowed.includes(orderStatus)) return []
    return order.productItems.filter((item) => (item?.omsData?.quantityAvailableToReturn ?? 0) > 0)
}
