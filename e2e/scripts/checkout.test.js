/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const {advanceToPayment} = require('./checkout')

const createCheckout = ({
    paymentVisible = false,
    paymentVisibleAfterInitial = paymentVisible,
    shippingVisible = true,
    clickError
} = {}) => {
    const unresolved = new Promise(() => {})
    const payment = {
        isVisible: jest
            .fn()
            .mockResolvedValueOnce(paymentVisible)
            .mockResolvedValue(paymentVisibleAfterInitial),
        waitFor: paymentVisibleAfterInitial
            ? jest.fn().mockResolvedValue()
            : jest.fn().mockReturnValueOnce(unresolved).mockResolvedValue()
    }
    const button = {
        waitFor: jest.fn().mockResolvedValue(),
        click: clickError ? jest.fn().mockRejectedValue(clickError) : jest.fn().mockResolvedValue()
    }
    const form = {
        getByRole: jest.fn().mockReturnValue(button),
        waitFor: shippingVisible
            ? jest.fn().mockResolvedValue()
            : jest.fn().mockReturnValue(unresolved)
    }
    const page = {
        getByRole: jest.fn().mockReturnValue(payment),
        getByTestId: jest.fn().mockReturnValue(form)
    }

    return {page, payment, form, button}
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

        expect(checkout.form.waitFor).toHaveBeenCalledWith({state: 'visible'})
        expect(checkout.form.getByRole).toHaveBeenCalledWith('button', {
            name: /Continue to Payment/i
        })
        expect(checkout.button.waitFor).toHaveBeenCalledWith({state: 'visible'})
        expect(checkout.button.click).toHaveBeenCalledTimes(1)
        expect(checkout.payment.waitFor).toHaveBeenCalledWith({state: 'visible'})
    })

    test('returns when payment appears while the shipping form remains hidden', async () => {
        const checkout = createCheckout({paymentVisibleAfterInitial: true, shippingVisible: false})

        await advanceToPayment(checkout.page)

        expect(checkout.form.waitFor).toHaveBeenCalledWith({state: 'visible'})
        expect(checkout.form.getByRole).not.toHaveBeenCalled()
        expect(checkout.payment.waitFor).toHaveBeenCalledTimes(1)
    })

    test('propagates an intercepted click instead of masking it', async () => {
        const clickError = new Error('pointer events intercepted')
        const checkout = createCheckout({clickError})

        await expect(advanceToPayment(checkout.page)).rejects.toThrow(clickError)
        expect(checkout.payment.waitFor).toHaveBeenCalledTimes(1)
    })
})
