/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {
    EXPRESS_PAYMENT_EVENTS,
    MAX_EXPRESS_PAYMENT_METHOD_LENGTH,
    MAX_EXPRESS_PAYMENT_METHODS,
    MAX_EXPRESS_PAYMENT_ORDER_ID_LENGTH,
    MAX_EXPRESS_PAYMENT_SHOPPER_MESSAGE_LENGTH
} from '@salesforce/retail-react-app/app/components/shopper-agent/express-payment/messages'

const normalizeOptionalString = (value, maxLength) => {
    if (typeof value !== 'string') return null
    const normalized = value.trim()
    return normalized && normalized.length <= maxLength ? normalized : null
}

const optionalPaymentMethod = (paymentMethod) => {
    const normalized = normalizeOptionalString(paymentMethod, MAX_EXPRESS_PAYMENT_METHOD_LENGTH)
    return normalized ? {PAYMENT_METHOD: normalized} : {}
}

const optionalParentMessage = (field, shopperMessage) => {
    if (typeof shopperMessage !== 'string') return {}
    const normalized = shopperMessage.trim().slice(0, MAX_EXPRESS_PAYMENT_SHOPPER_MESSAGE_LENGTH)
    return normalized ? {[field]: normalized} : {}
}

const normalizePaymentMethods = (paymentMethods) => {
    if (!Array.isArray(paymentMethods)) return []

    return [
        ...new Set(
            paymentMethods
                .map((value) => normalizeOptionalString(value, MAX_EXPRESS_PAYMENT_METHOD_LENGTH))
                .filter(Boolean)
        )
    ].slice(0, MAX_EXPRESS_PAYMENT_METHODS)
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
    available: (details = {}) => {
        if (successSentRef.current) return
        availableDetailsRef.current = {
            paymentMethods: normalizePaymentMethods(details.paymentMethods)
        }
        notifyParentOfAvailability()
    },
    unavailable: () => {
        if (successSentRef.current) return
        availableDetailsRef.current = null
        notifyParent(EXPRESS_PAYMENT_EVENTS.UNAVAILABLE)
    },
    success: ({orderId, paymentMethod} = {}) => {
        const normalizedOrderId = normalizeOptionalString(
            orderId,
            MAX_EXPRESS_PAYMENT_ORDER_ID_LENGTH
        )
        if (successSentRef.current || !normalizedOrderId) return

        const sent = notifyParent(EXPRESS_PAYMENT_EVENTS.SUCCESS, {
            orderId: normalizedOrderId,
            ...optionalPaymentMethod(paymentMethod)
        })
        if (sent) successSentRef.current = true
    },
    failure: ({shopperMessage, paymentMethod} = {}) => {
        if (successSentRef.current) return
        notifyParent(EXPRESS_PAYMENT_EVENTS.FAILURE, {
            ...optionalParentMessage('error', shopperMessage),
            ...optionalPaymentMethod(paymentMethod)
        })
    },
    cancel: ({shopperMessage, paymentMethod} = {}) => {
        if (successSentRef.current) return
        notifyParent(EXPRESS_PAYMENT_EVENTS.CANCEL, {
            ...optionalParentMessage('cancel', shopperMessage),
            ...optionalPaymentMethod(paymentMethod)
        })
    }
})
