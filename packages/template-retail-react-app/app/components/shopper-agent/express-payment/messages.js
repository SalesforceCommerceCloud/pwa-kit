/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import logger from '@salesforce/retail-react-app/app/utils/logger-instance'

// Keep this wire-event set aligned with Commerce Client; new events require coordinated host support.
export const EXPRESS_PAYMENT_EVENTS = Object.freeze({
    AVAILABLE: 'express.payment.available',
    UNAVAILABLE: 'express.payment.unavailable',
    SUCCESS: 'express.payment.success',
    FAILURE: 'express.payment.failure',
    CANCEL: 'express.payment.cancel'
})

const EVENT_TYPES = new Set(Object.values(EXPRESS_PAYMENT_EVENTS))
export const MAX_EXPRESS_PAYMENT_MESSAGE_LENGTH = 4096
export const MAX_EXPRESS_PAYMENT_ORDER_ID_LENGTH = 128
export const MAX_EXPRESS_PAYMENT_SHOPPER_MESSAGE_LENGTH = 200

const isPlainObject = (value) =>
    Boolean(value) && typeof value === 'object' && !Array.isArray(value)

const hasOnlyKeys = (value, allowedKeys) =>
    Object.keys(value).every((key) => allowedKeys.includes(key))

const isOptionalBoundedString = (value, maxLength) =>
    value === undefined ||
    (typeof value === 'string' && value.length > 0 && value.length <= maxLength)

/**
 * Validates the released Shopper Agent message envelope. Provider-facing fields
 * are translated by lifecycle.js before reaching this boundary.
 */
export const isValidExpressPaymentPayload = (type, payload) => {
    if (!isPlainObject(payload)) return false

    switch (type) {
        case EXPRESS_PAYMENT_EVENTS.AVAILABLE:
            return (
                hasOnlyKeys(payload, ['height']) &&
                Number.isSafeInteger(payload.height) &&
                payload.height > 0
            )
        case EXPRESS_PAYMENT_EVENTS.UNAVAILABLE:
            return Object.keys(payload).length === 0
        case EXPRESS_PAYMENT_EVENTS.SUCCESS:
            return (
                hasOnlyKeys(payload, ['orderId']) &&
                typeof payload.orderId === 'string' &&
                payload.orderId.length > 0 &&
                payload.orderId.length <= MAX_EXPRESS_PAYMENT_ORDER_ID_LENGTH
            )
        case EXPRESS_PAYMENT_EVENTS.FAILURE:
            return (
                hasOnlyKeys(payload, ['error']) &&
                isOptionalBoundedString(payload.error, MAX_EXPRESS_PAYMENT_SHOPPER_MESSAGE_LENGTH)
            )
        case EXPRESS_PAYMENT_EVENTS.CANCEL:
            return (
                hasOnlyKeys(payload, ['cancel']) &&
                isOptionalBoundedString(payload.cancel, MAX_EXPRESS_PAYMENT_SHOPPER_MESSAGE_LENGTH)
            )
        default:
            return false
    }
}

/**
 * Reduces a URL to an exact HTTP(S) origin suitable for postMessage targetOrigin.
 * When expectedOrigin is supplied, only that exact storefront origin is accepted.
 */
export const getValidatedParentOrigin = (value, expectedOrigin) => {
    if (!value || typeof value !== 'string') return null

    try {
        const parsed = new URL(value)
        if (!['https:', 'http:'].includes(parsed.protocol)) return null
        if (parsed.username || parsed.password || parsed.origin === 'null') return null
        if (expectedOrigin && parsed.origin !== expectedOrigin) return null
        return parsed.origin
    } catch (error) {
        return null
    }
}

/**
 * Sends only the provider-neutral express-payment lifecycle contract.
 */
export const postExpressPaymentEvent = ({parentOrigin, type, payload = {}}) => {
    if (
        typeof window === 'undefined' ||
        window.parent === window ||
        !parentOrigin ||
        !EVENT_TYPES.has(type) ||
        !isValidExpressPaymentPayload(type, payload)
    ) {
        return false
    }

    const message = {type, payload}
    try {
        if (JSON.stringify(message).length > MAX_EXPRESS_PAYMENT_MESSAGE_LENGTH) {
            logger.warn('Express-payment message exceeds the maximum allowed length.', {
                namespace: 'shopper-agent.express-payment.messages'
            })
            return false
        }
        window.parent.postMessage(message, parentOrigin)
    } catch (error) {
        return false
    }

    return true
}
