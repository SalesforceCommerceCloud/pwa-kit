/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {
    EXPRESS_PAYMENT_EVENTS,
    MAX_EXPRESS_PAYMENT_ORDER_ID_LENGTH,
    MAX_EXPRESS_PAYMENT_SHOPPER_MESSAGE_LENGTH
} from '@salesforce/retail-react-app/app/components/shopper-agent/express-payment/messages'

const normalizeOptionalString = (value, maxLength) => {
    if (typeof value !== 'string') return null
    const normalized = value.trim()
    return normalized && normalized.length <= maxLength ? normalized : null
}

const optionalParentMessage = (field, shopperMessage) => {
    if (typeof shopperMessage !== 'string') return {}
    const normalized = shopperMessage.trim().slice(0, MAX_EXPRESS_PAYMENT_SHOPPER_MESSAGE_LENGTH)
    return normalized ? {[field]: normalized} : {}
}

/**
 * Provider-facing lifecycle translated to the Shopper Agent message contract.
 * Failure and cancellation remain retryable; success is terminal for the frame.
 */
export const createExpressPaymentLifecycle = ({
    availableDetailsRef,
    successSentRef,
    notifyParent,
    notifyParentOfAvailability
}) => ({
    available: () => {
        if (successSentRef.current) return
        availableDetailsRef.current = {}
        notifyParentOfAvailability()
    },
    unavailable: () => {
        if (successSentRef.current) return
        availableDetailsRef.current = null
        notifyParent(EXPRESS_PAYMENT_EVENTS.UNAVAILABLE)
    },
    success: ({orderId} = {}) => {
        const normalizedOrderId = normalizeOptionalString(
            orderId,
            MAX_EXPRESS_PAYMENT_ORDER_ID_LENGTH
        )
        if (successSentRef.current || !normalizedOrderId) return

        const sent = notifyParent(EXPRESS_PAYMENT_EVENTS.SUCCESS, {orderId: normalizedOrderId})
        if (sent) successSentRef.current = true
    },
    failure: ({shopperMessage} = {}) => {
        if (successSentRef.current) return
        notifyParent(EXPRESS_PAYMENT_EVENTS.FAILURE, {
            ...optionalParentMessage('error', shopperMessage)
        })
    },
    cancel: ({shopperMessage} = {}) => {
        if (successSentRef.current) return
        notifyParent(EXPRESS_PAYMENT_EVENTS.CANCEL, {
            ...optionalParentMessage('cancel', shopperMessage)
        })
    }
})
