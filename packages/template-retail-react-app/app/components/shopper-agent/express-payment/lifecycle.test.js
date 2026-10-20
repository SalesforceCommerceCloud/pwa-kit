/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {createExpressPaymentLifecycle} from '@salesforce/retail-react-app/app/components/shopper-agent/express-payment/lifecycle'

describe('createExpressPaymentLifecycle', () => {
    let availableDetailsRef
    let successSentRef
    let notifyParent
    let notifyParentOfAvailability
    let lifecycle

    beforeEach(() => {
        availableDetailsRef = {current: null}
        successSentRef = {current: false}
        notifyParent = jest.fn(() => true)
        notifyParentOfAvailability = jest.fn()
        lifecycle = createExpressPaymentLifecycle({
            availableDetailsRef,
            successSentRef,
            notifyParent,
            notifyParentOfAvailability
        })
    })

    test('normalizes and de-duplicates payment methods when reporting availability', () => {
        lifecycle.available({
            paymentMethods: ['wallet-a', 'merchant.custom', 'wallet-a', '  wallet-b  ', 42]
        })

        expect(availableDetailsRef.current).toEqual({
            paymentMethods: ['wallet-a', 'merchant.custom', 'wallet-b']
        })
        expect(notifyParentOfAvailability).toHaveBeenCalledTimes(1)
    })

    test('limits availability to twenty payment methods', () => {
        const paymentMethods = Array.from({length: 25}, (_, index) => `method-${index}`)

        lifecycle.available({paymentMethods})

        expect(availableDetailsRef.current.paymentMethods).toEqual(paymentMethods.slice(0, 20))
    })

    test('translates neutral fields and ignores provider-specific success data', () => {
        lifecycle.success({
            orderId: ' ORDER-1 ',
            paymentMethod: 'merchant.custom',
            providerOrderId: 'PROVIDER-1',
            approvalData: {token: 'must-not-cross-frame-boundary'}
        })

        expect(notifyParent).toHaveBeenCalledWith('express.payment.success', {
            orderId: 'ORDER-1',
            PAYMENT_METHOD: 'merchant.custom'
        })
        expect(successSentRef.current).toBe(true)
    })

    test('translates retryable failure and cancellation messages', () => {
        lifecycle.failure({shopperMessage: 'Declined', paymentMethod: 'wallet-a'})
        lifecycle.cancel({shopperMessage: 'Canceled', paymentMethod: 'wallet-b'})

        expect(notifyParent).toHaveBeenNthCalledWith(1, 'express.payment.failure', {
            error: 'Declined',
            PAYMENT_METHOD: 'wallet-a'
        })
        expect(notifyParent).toHaveBeenNthCalledWith(2, 'express.payment.cancel', {
            cancel: 'Canceled',
            PAYMENT_METHOD: 'wallet-b'
        })
        expect(successSentRef.current).toBe(false)
    })

    test('bounds provider-controlled strings before creating parent payloads', () => {
        lifecycle.failure({
            shopperMessage: `  ${'x'.repeat(250)}  `,
            paymentMethod: 'y'.repeat(101)
        })

        expect(notifyParent).toHaveBeenCalledWith('express.payment.failure', {
            error: 'x'.repeat(200)
        })
    })

    test('rejects missing or oversized order identifiers', () => {
        lifecycle.success()
        lifecycle.success({orderId: 'x'.repeat(129)})

        expect(notifyParent).not.toHaveBeenCalled()
        expect(successSentRef.current).toBe(false)
    })

    test('becomes terminal only after the success message is delivered', () => {
        notifyParent.mockReturnValue(false)
        lifecycle.success({orderId: 'ORDER-1'})
        expect(successSentRef.current).toBe(false)

        notifyParent.mockReturnValue(true)
        lifecycle.success({orderId: 'ORDER-1'})
        expect(successSentRef.current).toBe(true)
    })

    test('suppresses provider lifecycle events after a successful payment', () => {
        lifecycle.success({orderId: 'ORDER-1'})
        jest.clearAllMocks()

        lifecycle.available({paymentMethods: ['wallet-a']})
        lifecycle.unavailable()
        lifecycle.failure({shopperMessage: 'late failure'})
        lifecycle.cancel()
        lifecycle.success({orderId: 'ORDER-2'})

        expect(notifyParent).not.toHaveBeenCalled()
        expect(notifyParentOfAvailability).not.toHaveBeenCalled()
    })
})
