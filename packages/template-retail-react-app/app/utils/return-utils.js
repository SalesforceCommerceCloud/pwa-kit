/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * Returns the subset of an order's product items that can currently be returned.
 *
 * Eligibility is OMS-driven: an item is returnable when its
 * `omsData.quantityAvailableToReturn` is greater than zero. OMS computes this
 * field per item, factoring whatever order/item state matters; we trust it
 * verbatim. The authoritative refusal happens server-side via the 409 returned
 * by `POST .../actions/oms-return-order` when the order is no longer in a
 * returnable state — there is no client-side status allowlist.
 *
 * ECOM-only orders have no `omsData` on items, so they always return [].
 *
 * @param {Object} order Shopper Orders order document.
 * @returns {Array<Object>} The subset of `order.productItems` that are returnable, or [].
 */
export const getReturnableItems = (order) => {
    if (!order?.productItems?.length) return []
    return order.productItems.filter((item) => {
        const qty = item?.omsData?.quantityAvailableToReturn
        return Number.isFinite(qty) && qty > 0
    })
}
