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
        id: 'return_order_modal.heading.return_items'
    },
    subhead: {
        defaultMessage: 'Select the items you want to return and tell us why.',
        id: 'return_order_modal.text.select_items_description'
    },
    availableToReturn: {
        defaultMessage: 'Up to {count, plural, one {# available} other {# available}} to return',
        id: 'return_order_modal.text.available_to_return'
    },
    quantityLabel: {
        defaultMessage: 'Quantity',
        id: 'return_order_modal.label.quantity'
    },
    reasonLabel: {
        defaultMessage: 'Reason',
        id: 'return_order_modal.label.reason'
    },
    selectReasonPlaceholder: {
        defaultMessage: 'Select a reason',
        id: 'return_order_modal.placeholder.select_reason'
    },
    cancelButton: {
        defaultMessage: 'Cancel',
        id: 'return_order_modal.button.cancel'
    },
    reviewButton: {
        defaultMessage: 'Review return',
        id: 'return_order_modal.button.review_return'
    },
    reviewDisabledHint: {
        defaultMessage: 'Select at least one item and choose a reason to continue.',
        id: 'return_order_modal.hint.review_disabled'
    },
    loadingReasons: {
        defaultMessage: 'Loading return reasons…',
        id: 'return_order_modal.text.loading_reasons'
    },
    reasonsError: {
        defaultMessage: 'We could not load the return reasons. Please try again.',
        id: 'return_order_modal.text.reasons_error'
    },
    retryButton: {
        defaultMessage: 'Retry',
        id: 'return_order_modal.button.retry'
    },
    itemCheckboxLabel: {
        defaultMessage:
            '{name}, up to {count, plural, one {# available} other {# available}} to return',
        id: 'return_order_modal.label.item_checkbox'
    }
})

/**
 * Build the API payload from the modal selection.
 *
 * Shape (matches `OmsReturnOrderRequest` in shopper-orders-oas):
 *   { productItems: [{ itemId, quantity: Number, reason? }, ...] }
 *
 * Quantity is `number` / `format: double` per the schema (oms.yaml). UX is
 * integer-valued, but we serialize as a JS Number rather than a string. Reason
 * is omitted when the shopper kept the OMS-default code, so the server applies
 * the default per the API contract.
 *
 * Caller is responsible for ensuring at least one row is `checked`. The helper
 * silently drops unchecked rows.
 */
export const buildReturnPayload = (selection, defaultReasonCode) =>
    Object.entries(selection || {})
        .filter(([, row]) => row?.checked)
        .map(([itemId, row]) => {
            const payload = {itemId, quantity: Number(row.quantity)}
            if (row.reasonCode && row.reasonCode !== defaultReasonCode) {
                payload.reason = row.reasonCode
            }
            return payload
        })
