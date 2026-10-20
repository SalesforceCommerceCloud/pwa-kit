/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {
    EXPRESS_PAYMENT_EVENTS,
    MAX_EXPRESS_PAYMENT_MESSAGE_LENGTH,
    getValidatedParentOrigin,
    isValidExpressPaymentPayload,
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

    test.each([
        [EXPRESS_PAYMENT_EVENTS.AVAILABLE, {height: 44, paymentMethods: ['wallet-a']}],
        [EXPRESS_PAYMENT_EVENTS.UNAVAILABLE, {}],
        [EXPRESS_PAYMENT_EVENTS.SUCCESS, {orderId: 'ORDER-1', PAYMENT_METHOD: 'wallet-a'}],
        [EXPRESS_PAYMENT_EVENTS.FAILURE, {error: 'Try again'}],
        [EXPRESS_PAYMENT_EVENTS.CANCEL, {cancel: 'Canceled'}]
    ])('accepts the %s payload shape', (type, payload) => {
        expect(isValidExpressPaymentPayload(type, payload)).toBe(true)
    })

    test.each([
        [EXPRESS_PAYMENT_EVENTS.AVAILABLE, {height: 0, paymentMethods: []}],
        [EXPRESS_PAYMENT_EVENTS.AVAILABLE, {height: 44, paymentMethods: [42]}],
        [EXPRESS_PAYMENT_EVENTS.UNAVAILABLE, {reason: 'not allowed'}],
        [EXPRESS_PAYMENT_EVENTS.SUCCESS, {orderId: ''}],
        [EXPRESS_PAYMENT_EVENTS.SUCCESS, {orderId: 'ORDER-1', token: 'secret'}],
        [EXPRESS_PAYMENT_EVENTS.FAILURE, {error: 'x'.repeat(201)}],
        [EXPRESS_PAYMENT_EVENTS.CANCEL, {cancel: 'x'.repeat(201)}]
    ])('rejects an invalid %s payload', (type, payload) => {
        expect(isValidExpressPaymentPayload(type, payload)).toBe(false)
    })

    test('rejects unknown events and oversized provider fields', () => {
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
                payload: {error: 'x'.repeat(5000)}
            })
        ).toBe(false)
        expect(postMessage).not.toHaveBeenCalled()

        Object.defineProperty(window, 'parent', {configurable: true, value: originalParent})
    })

    test.each([
        [MAX_EXPRESS_PAYMENT_MESSAGE_LENGTH, true],
        [MAX_EXPRESS_PAYMENT_MESSAGE_LENGTH + 1, false]
    ])('enforces the serialized-message boundary at %i characters', (length, expected) => {
        const originalParent = window.parent
        const postMessage = jest.fn()
        Object.defineProperty(window, 'parent', {
            configurable: true,
            value: {postMessage}
        })

        const stringify = jest.spyOn(JSON, 'stringify').mockReturnValue('x'.repeat(length))

        expect(
            postExpressPaymentEvent({
                parentOrigin: 'https://store.example.com',
                type: EXPRESS_PAYMENT_EVENTS.FAILURE,
                payload: {error: 'Payment failed'}
            })
        ).toBe(expected)
        expect(postMessage).toHaveBeenCalledTimes(expected ? 1 : 0)

        stringify.mockRestore()
        Object.defineProperty(window, 'parent', {configurable: true, value: originalParent})
    })

    test('fails safely when a valid lifecycle payload cannot be serialized', () => {
        const originalParent = window.parent
        const postMessage = jest.fn()
        Object.defineProperty(window, 'parent', {
            configurable: true,
            value: {postMessage}
        })
        const stringify = jest.spyOn(JSON, 'stringify').mockImplementation(() => {
            throw new TypeError('Cannot serialize')
        })

        expect(
            postExpressPaymentEvent({
                parentOrigin: 'https://store.example.com',
                type: EXPRESS_PAYMENT_EVENTS.FAILURE,
                payload: {error: 'Payment failed'}
            })
        ).toBe(false)
        expect(postMessage).not.toHaveBeenCalled()

        stringify.mockRestore()
        Object.defineProperty(window, 'parent', {configurable: true, value: originalParent})
    })
})
