/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const {advanceToPayment} = require('./checkout')

const createCheckout = ({paymentVisible = false, clickError} = {}) => {
    const transition = {
        first: jest.fn().mockReturnThis(),
        waitFor: jest.fn().mockResolvedValue()
    }
    const payment = {
        isVisible: jest
            .fn()
            .mockResolvedValueOnce(paymentVisible)
            .mockResolvedValue(paymentVisible),
        or: jest.fn().mockReturnValue(transition),
        waitFor: jest.fn().mockResolvedValue()
    }
    const button = {
        waitFor: jest.fn().mockResolvedValue(),
        click: clickError ? jest.fn().mockRejectedValue(clickError) : jest.fn().mockResolvedValue()
    }
    const form = {
        getByRole: jest.fn().mockReturnValue(button)
    }
    const page = {
        getByRole: jest.fn().mockReturnValue(payment),
        getByTestId: jest.fn().mockReturnValue(form)
    }

    return {page, payment, form, button, transition}
}

describe('advanceToPayment', () => {
    test('returns when checkout already advanced to payment', async () => {
        const checkout = createCheckout({paymentVisible: true})

        await advanceToPayment(checkout.page)

        expect(checkout.page.getByTestId).not.toHaveBeenCalled()
    })

    test('clicks the active shipping form and waits for payment', async () => {
        const checkout = createCheckout()

        await advanceToPayment(checkout.page)

        expect(checkout.transition.waitFor).toHaveBeenCalledWith({state: 'visible'})
        expect(checkout.form.getByRole).toHaveBeenCalledWith('button', {
            name: /Continue to Payment/i
        })
        expect(checkout.button.waitFor).toHaveBeenCalledWith({state: 'visible'})
        expect(checkout.button.click).toHaveBeenCalledTimes(1)
        expect(checkout.payment.waitFor).toHaveBeenCalledWith({state: 'visible'})
    })

    test('propagates an intercepted click instead of masking it', async () => {
        const clickError = new Error('pointer events intercepted')
        const checkout = createCheckout({clickError})

        await expect(advanceToPayment(checkout.page)).rejects.toThrow(clickError)
        expect(checkout.payment.waitFor).not.toHaveBeenCalled()
    })
})
