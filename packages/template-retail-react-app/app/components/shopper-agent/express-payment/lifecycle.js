/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {EXPRESS_PAYMENT_EVENTS} from './messages'

const optionalPaymentMethod = (paymentMethod) =>
    typeof paymentMethod === 'string' ? {PAYMENT_METHOD: paymentMethod} : {}

const optionalParentMessage = (field, shopperMessage) =>
    typeof shopperMessage === 'string' ? {[field]: shopperMessage.slice(0, 200)} : {}

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
            paymentMethods: Array.isArray(details.paymentMethods)
                ? details.paymentMethods.filter((value) => typeof value === 'string')
                : []
        }
        notifyParentOfAvailability()
    },
    unavailable: () => {
        if (successSentRef.current) return
        availableDetailsRef.current = null
        notifyParent(EXPRESS_PAYMENT_EVENTS.UNAVAILABLE)
    },
    success: ({orderId, paymentMethod} = {}) => {
        const normalizedOrderId = typeof orderId === 'string' ? orderId.trim() : ''
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
