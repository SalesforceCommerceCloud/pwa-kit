/*
 * Copyright (c) 2026, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {defineMessages} from 'react-intl'

export const messages = defineMessages({
    title: {
        defaultMessage: 'Return items from order #{orderNo}',
        id: 'return_items_modal.heading.return_items'
    },
    subhead: {
        defaultMessage: 'Select the items you want to return and tell us why.',
        id: 'return_items_modal.text.select_items_description'
    },
    availableToReturn: {
        defaultMessage: 'Up to {count, plural, one {# unit} other {# units}} available to return',
        id: 'return_items_modal.text.available_to_return'
    },
    quantityLabel: {
        defaultMessage: 'Quantity',
        id: 'return_items_modal.label.quantity'
    },
    reasonLabel: {
        defaultMessage: 'Reason',
        id: 'return_items_modal.label.reason'
    },
    reasonFor: {
        defaultMessage: 'Reason for {name}',
        id: 'return_items_modal.label.reason_for'
    },
    selectReasonPlaceholder: {
        defaultMessage: 'Select a reason',
        id: 'return_items_modal.placeholder.select_reason'
    },
    cancelButton: {
        defaultMessage: 'Cancel',
        id: 'return_items_modal.button.cancel'
    },
    reviewButton: {
        defaultMessage: 'Review return',
        id: 'return_items_modal.button.review_return'
    },
    reviewDisabledHint: {
        defaultMessage: 'Select at least one item and choose a reason to continue.',
        id: 'return_items_modal.hint.review_disabled'
    },
    loadingReasons: {
        defaultMessage: 'Loading return reasons…',
        id: 'return_items_modal.text.loading_reasons'
    },
    reasonsError: {
        defaultMessage: 'We could not load the return reasons. Please try again.',
        id: 'return_items_modal.text.reasons_error'
    },
    retryButton: {
        defaultMessage: 'Retry',
        id: 'return_items_modal.button.retry'
    },
    itemCheckboxLabel: {
        defaultMessage: '{name}, {count, plural, one {# unit} other {# units}} available to return',
        id: 'return_items_modal.label.item_checkbox'
    }
})

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
 * (e.g. step 2's review modal in W-22821838) against malformed state.
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
