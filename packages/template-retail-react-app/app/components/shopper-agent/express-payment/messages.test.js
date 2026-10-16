/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {
    EXPRESS_PAYMENT_EVENTS,
    getValidatedParentOrigin,
    postExpressPaymentEvent
} from '@salesforce/retail-react-app/app/components/shopper-agent/express-payment/messages'

describe('express-payment messages', () => {
    test('normalizes an HTTP(S) parent URL to its exact origin', () => {
        expect(getValidatedParentOrigin('https://store.example.com/cart?x=1')).toBe(
            'https://store.example.com'
        )
        expect(getValidatedParentOrigin('http://localhost:3001/path')).toBe('http://localhost:3001')
    })

    test.each(['', 'not-a-url', '/relative', 'javascript:alert(1)', 'data:text/plain,x'])(
        'rejects invalid parent origin %p',
        (value) => {
            expect(getValidatedParentOrigin(value)).toBeNull()
        }
    )

    test('rejects a parent outside the expected storefront origin', () => {
        expect(
            getValidatedParentOrigin('https://attacker.example.com', 'https://store.example.com')
        ).toBeNull()
    })

    test('posts a known event to the exact parent origin', () => {
        const originalParent = window.parent
        const postMessage = jest.fn()
        Object.defineProperty(window, 'parent', {
            configurable: true,
            value: {postMessage}
        })

        expect(
            postExpressPaymentEvent({
                parentOrigin: 'https://store.example.com',
                type: EXPRESS_PAYMENT_EVENTS.AVAILABLE,
                payload: {height: 44, paymentMethods: ['CONTRACT_TEST']}
            })
        ).toBe(true)
        expect(postMessage).toHaveBeenCalledWith(
            {
                type: 'express.payment.available',
                payload: {height: 44, paymentMethods: ['CONTRACT_TEST']}
            },
            'https://store.example.com'
        )

        Object.defineProperty(window, 'parent', {configurable: true, value: originalParent})
    })

    test('rejects unknown events and oversized messages', () => {
        const originalParent = window.parent
        const postMessage = jest.fn()
        Object.defineProperty(window, 'parent', {
            configurable: true,
            value: {postMessage}
        })

        expect(
            postExpressPaymentEvent({
                parentOrigin: 'https://store.example.com',
                type: 'not-an-express-event'
            })
        ).toBe(false)
        expect(
            postExpressPaymentEvent({
                parentOrigin: 'https://store.example.com',
                type: EXPRESS_PAYMENT_EVENTS.FAILURE,
                payload: {shopperMessage: 'x'.repeat(5000)}
            })
        ).toBe(false)
        expect(postMessage).not.toHaveBeenCalled()

        Object.defineProperty(window, 'parent', {configurable: true, value: originalParent})
    })

    test('fails safely when a lifecycle payload cannot be serialized', () => {
        const originalParent = window.parent
        const postMessage = jest.fn()
        Object.defineProperty(window, 'parent', {
            configurable: true,
            value: {postMessage}
        })
        const payload = {}
        payload.circular = payload

        expect(
            postExpressPaymentEvent({
                parentOrigin: 'https://store.example.com',
                type: EXPRESS_PAYMENT_EVENTS.FAILURE,
                payload
            })
        ).toBe(false)
        expect(postMessage).not.toHaveBeenCalled()

        Object.defineProperty(window, 'parent', {configurable: true, value: originalParent})
    })
})
