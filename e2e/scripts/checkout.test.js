/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const {advanceToPayment} = require('./checkout')

const createSequence = (values) => {
    const remaining = [...values]
    const lastValue = values.at(-1)

    return jest.fn().mockImplementation(() => Promise.resolve(remaining.shift() ?? lastValue))
}

const createCheckout = ({
    paymentVisibility = [false, false, false],
    buttonVisibility = [true],
    buttonEnabled = [true],
    clickError,
    losingWaiterError = new Error('late losing waiter rejection')
} = {}) => {
    const payment = {
        isVisible: createSequence(paymentVisibility),
        waitFor: jest.fn().mockResolvedValue()
    }
    const button = {
        isVisible: createSequence(buttonVisibility),
        isEnabled: createSequence(buttonEnabled),
        waitFor: jest.fn().mockRejectedValue(losingWaiterError),
        click: clickError ? jest.fn().mockRejectedValue(clickError) : jest.fn().mockResolvedValue()
    }
    const form = {
        getByRole: jest.fn().mockReturnValue(button),
        waitFor: jest.fn().mockRejectedValue(losingWaiterError)
    }
    const page = {
        getByRole: jest.fn().mockReturnValue(payment),
        getByTestId: jest.fn().mockReturnValue(form)
    }

    return {page, payment, form, button}
}

describe('advanceToPayment', () => {
    test('returns when checkout already advanced to payment', async () => {
        const checkout = createCheckout({paymentVisibility: [true]})

        await advanceToPayment(checkout.page)

        expect(checkout.page.getByTestId).not.toHaveBeenCalled()
    })

    test('clicks the ready button in the active shipping form and waits for payment', async () => {
        const checkout = createCheckout()

        await advanceToPayment(checkout.page)

        expect(checkout.form.getByRole).toHaveBeenCalledWith('button', {
            name: /Continue to Payment/i
        })
        expect(checkout.button.isVisible).toHaveBeenCalledTimes(1)
        expect(checkout.button.isEnabled).toHaveBeenCalledTimes(1)
        expect(checkout.button.click).toHaveBeenCalledTimes(1)
        expect(checkout.payment.waitFor).toHaveBeenCalledWith({state: 'visible'})
    })

    test('keeps polling a hidden attached button until payment becomes visible', async () => {
        const checkout = createCheckout({
            paymentVisibility: [false, false, true, true],
            buttonVisibility: [false]
        })

        await advanceToPayment(checkout.page)

        expect(checkout.payment.isVisible).toHaveBeenCalledTimes(4)
        expect(checkout.button.isVisible).toHaveBeenCalledTimes(1)
        expect(checkout.button.isEnabled).not.toHaveBeenCalled()
        expect(checkout.button.click).not.toHaveBeenCalled()
        expect(checkout.payment.waitFor).not.toHaveBeenCalled()
    })

    test('returns when payment auto-advances after the button becomes ready but before click', async () => {
        const checkout = createCheckout({paymentVisibility: [false, false, true]})

        await advanceToPayment(checkout.page)

        expect(checkout.button.isVisible).toHaveBeenCalledTimes(1)
        expect(checkout.button.isEnabled).toHaveBeenCalledTimes(1)
        expect(checkout.button.click).not.toHaveBeenCalled()
        expect(checkout.payment.waitFor).not.toHaveBeenCalled()
    })

    test('propagates a genuine click failure while payment remains hidden', async () => {
        const clickError = new Error('pointer events intercepted')
        const checkout = createCheckout({
            paymentVisibility: [false, false, false, false],
            clickError
        })

        await expect(advanceToPayment(checkout.page)).rejects.toBe(clickError)

        expect(checkout.payment.isVisible).toHaveBeenCalledTimes(4)
        expect(checkout.payment.waitFor).not.toHaveBeenCalled()
    })

    test('does not start an independent locator waiter that can reject after payment wins', async () => {
        const checkout = createCheckout({
            paymentVisibility: [false, false, true, true],
            buttonVisibility: [false]
        })

        await advanceToPayment(checkout.page)
        await Promise.resolve()

        expect(checkout.form.waitFor).not.toHaveBeenCalled()
        expect(checkout.button.waitFor).not.toHaveBeenCalled()
    })
})
