/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

export const EXPRESS_PAYMENT_EVENTS = Object.freeze({
    AVAILABLE: 'express.payment.available',
    UNAVAILABLE: 'express.payment.unavailable',
    SUCCESS: 'express.payment.success',
    FAILURE: 'express.payment.failure',
    CANCEL: 'express.payment.cancel'
})

const EVENT_TYPES = new Set(Object.values(EXPRESS_PAYMENT_EVENTS))
const MAX_MESSAGE_LENGTH = 4096

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
        !EVENT_TYPES.has(type)
    ) {
        return false
    }

    const message = {type, payload}
    try {
        if (JSON.stringify(message).length > MAX_MESSAGE_LENGTH) return false
        window.parent.postMessage(message, parentOrigin)
    } catch (error) {
        return false
    }

    return true
}
