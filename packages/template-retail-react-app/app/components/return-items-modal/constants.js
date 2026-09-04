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
        defaultMessage: 'Review Return',
        id: 'return_items_modal.button.review_return'
    },
    reviewDisabledHint: {
        defaultMessage: 'Select at least one item and choose a reason to continue.',
        id: 'return_items_modal.hint.review_disabled'
    },
    reviewDisabledHintNoReason: {
        defaultMessage: 'Select at least one item to continue.',
        id: 'return_items_modal.hint.review_disabled_no_reason'
    },
    itemCheckboxLabel: {
        defaultMessage: '{name}, {count, plural, one {# unit} other {# units}} available to return',
        id: 'return_items_modal.label.item_checkbox'
    },
    reviewTitle: {
        defaultMessage: 'Review your return',
        id: 'return_items_modal.heading.review_return'
    },
    reviewSubhead: {
        defaultMessage:
            "Confirm the items below. We'll email a return label once your request is submitted.",
        id: 'return_items_modal.text.review_description'
    },
    reviewQuantity: {
        defaultMessage: 'Quantity: {count}',
        id: 'return_items_modal.text.review_quantity'
    },
    reviewReason: {
        defaultMessage: 'Reason: {reason}',
        id: 'return_items_modal.text.review_reason'
    },
    backButton: {
        defaultMessage: 'Back',
        id: 'return_items_modal.button.back'
    },
    submitButton: {
        defaultMessage: 'Submit Return',
        id: 'return_items_modal.button.submit_return'
    },
    submitError: {
        defaultMessage:
            "We couldn't submit your return. Your return wasn't processed. Please wait a moment and try again.",
        id: 'return_items_modal.text.submit_error'
    },
    // --- error-code-specific inline messages ---
    submitErrorInvalidReason: {
        defaultMessage: 'The selected reason is no longer available. Choose another reason.',
        id: 'return_items_modal.text.submit_error_invalid_reason'
    },
    submitErrorUnknownItems: {
        defaultMessage: "We can't find one or more items on this order. Refresh and try again.",
        id: 'return_items_modal.text.submit_error_unknown_items'
    },
    // Shown on the select view above the rows after a quantity-exceeded error.
    quantityExceededAffectedGeneric: {
        defaultMessage:
            'The available return quantities for some items changed. Review the updated limits.',
        id: 'return_items_modal.text.quantity_exceeded_affected_generic'
    },
    submitErrorNetwork: {
        defaultMessage:
            "We're unable to process your request right now. Try again in a few minutes.",
        id: 'return_items_modal.text.submit_error_network'
    },
    // Terminal errors (404/409): retrying the same payload can't succeed, so the
    // banner is informational and Submit is disabled — the shopper closes the modal.
    terminalErrorTitle: {
        defaultMessage: "We're unable to submit this return.",
        id: 'return_items_modal.text.terminal_error_title'
    },
    terminalErrorNotFound: {
        defaultMessage: "We can't find this order.",
        id: 'return_items_modal.text.terminal_error_not_found'
    },
    terminalErrorConflict: {
        defaultMessage: "This order can't be returned at this time. Reach out to the merchant.",
        id: 'return_items_modal.text.terminal_error_conflict'
    }
})
