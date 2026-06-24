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
        defaultMessage: 'Submit return',
        id: 'return_items_modal.button.submit_return'
    },
    submitError: {
        defaultMessage: 'Something went wrong submitting your return. Please try again.',
        id: 'return_items_modal.text.submit_error'
    },
    // --- WI-5 (W-22821839) error-code-specific inline messages ---
    submitErrorInvalidReason: {
        defaultMessage: 'The selected reason is no longer available. Please choose another.',
        id: 'return_items_modal.text.submit_error_invalid_reason'
    },
    submitErrorUnknownItems: {
        defaultMessage:
            "One or more items couldn't be found on this order. Please refresh and try again.",
        id: 'return_items_modal.text.submit_error_unknown_items'
    },
    // Shown on the select view above the rows after a quantity-exceeded error,
    // naming the items whose limits changed (when the API tells us which).
    quantityExceededAffected: {
        defaultMessage:
            'The return quantity changed for: {items}. Please review the updated limits below.',
        id: 'return_items_modal.text.quantity_exceeded_affected'
    },
    quantityExceededAffectedGeneric: {
        defaultMessage:
            "Some items' available return quantities changed. Please review the updated limits below.",
        id: 'return_items_modal.text.quantity_exceeded_affected_generic'
    },
    submitErrorNetwork: {
        defaultMessage:
            "We're unable to process your request right now. Please try again in a few minutes.",
        id: 'return_items_modal.text.submit_error_network'
    }
})
