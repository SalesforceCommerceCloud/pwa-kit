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

    test('keeps arbitrary string payment method names when reporting availability', () => {
        lifecycle.available({paymentMethods: ['wallet-a', 'merchant.custom', 42]})

        expect(availableDetailsRef.current).toEqual({
            paymentMethods: ['wallet-a', 'merchant.custom']
        })
        expect(notifyParentOfAvailability).toHaveBeenCalledTimes(1)
    })

    test('translates neutral success fields to the Shopper Agent payload', () => {
        lifecycle.success({orderId: ' ORDER-1 ', paymentMethod: 'merchant.custom'})

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
