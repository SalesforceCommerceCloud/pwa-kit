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

/**
 * Build the `productItems` array for an `OmsReturnOrderRequest`. Caller wraps
 * it: `body: {productItems: buildReturnProductItems(selection, defaultReasonCode)}`.
 *
 * Quantity is `number` / `format: double` per oms.yaml. UX is integer-valued
 * but we serialize as a JS Number, not a string. Reason is omitted when the
 * shopper kept the OMS-default code so the server applies the default per the
 * API contract.
 *
 * Rows without a positive numeric quantity are dropped — the upstream UI is
 * already gated by `isSelectionValid`, but this hardens reuse from elsewhere
 * (e.g. the review step) against malformed state.
 */
export const buildReturnProductItems = (selection, defaultReasonCode) =>
    Object.entries(selection || {})
        .filter(([, row]) => row?.checked)
        .reduce((items, [itemId, row]) => {
            const quantity = Number(row.quantity)
            if (!Number.isFinite(quantity) || quantity <= 0) return items
            const item = {itemId, quantity}
            if (row.reasonCode && row.reasonCode !== defaultReasonCode) {
                item.reason = row.reasonCode
            }
            items.push(item)
            return items
        }, [])
