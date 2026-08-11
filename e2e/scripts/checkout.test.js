/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const {advanceToPayment} = require('./checkout')

const createCheckout = ({paymentVisibility = [false, false], clickError, formWaitError} = {}) => {
    const visibility = [...paymentVisibility]
    const lastVisibility = paymentVisibility.at(-1)
    const transition = {
        first: jest.fn().mockReturnThis(),
        waitFor: jest.fn().mockResolvedValue()
    }
    const payment = {
        isVisible: jest
            .fn()
            .mockImplementation(() => Promise.resolve(visibility.shift() ?? lastVisibility)),
        or: jest.fn().mockReturnValue(transition),
        waitFor: jest.fn().mockResolvedValue()
    }
    const button = {
        waitFor: jest.fn().mockResolvedValue(),
        click: clickError ? jest.fn().mockRejectedValue(clickError) : jest.fn().mockResolvedValue()
    }
    const form = {
        getByRole: jest.fn().mockReturnValue(button),
        waitFor: jest.fn().mockImplementation(
            () =>
                new Promise((resolve, reject) => {
                    queueMicrotask(() => (formWaitError ? reject(formWaitError) : resolve()))
                })
        )
    }
    const page = {
        getByRole: jest.fn().mockReturnValue(payment),
        getByTestId: jest.fn().mockReturnValue(form)
    }

    return {page, payment, form, button, transition}
}

describe('advanceToPayment', () => {
    test('returns when checkout already advanced to payment', async () => {
        const checkout = createCheckout({paymentVisibility: [true]})

        await advanceToPayment(checkout.page)

        expect(checkout.page.getByTestId).not.toHaveBeenCalled()
    })

    test('clicks the active shipping form and waits for payment', async () => {
        const checkout = createCheckout()

        await advanceToPayment(checkout.page)

        expect(checkout.form.getByRole).toHaveBeenCalledWith('button', {
            name: /Continue to Payment/i
        })
        expect(checkout.payment.or).toHaveBeenCalledWith(checkout.button)
        expect(checkout.transition.first).toHaveBeenCalledTimes(1)
        expect(checkout.transition.waitFor).toHaveBeenCalledWith({state: 'visible'})
        expect(checkout.button.click).toHaveBeenCalledTimes(1)
        expect(checkout.payment.waitFor).toHaveBeenCalledWith({state: 'visible'})
    })

    test('returns when payment wins without starting a losing shipping-form waiter', async () => {
        const checkout = createCheckout({
            paymentVisibility: [false, true],
            formWaitError: new Error('late shipping waiter rejection')
        })

        await advanceToPayment(checkout.page)
        await Promise.resolve()

        expect(checkout.form.waitFor).not.toHaveBeenCalled()
        expect(checkout.button.click).not.toHaveBeenCalled()
        expect(checkout.payment.waitFor).not.toHaveBeenCalled()
    })

    test('returns when payment auto-advances after the button becomes ready', async () => {
        const checkout = createCheckout({
            paymentVisibility: [false, false, true],
            clickError: new Error('element is no longer attached')
        })

        await expect(advanceToPayment(checkout.page)).resolves.toBeUndefined()

        expect(checkout.button.click).toHaveBeenCalledTimes(1)
        expect(checkout.payment.isVisible).toHaveBeenCalledTimes(3)
        expect(checkout.payment.waitFor).not.toHaveBeenCalled()
    })

    test('propagates an intercepted click instead of masking it', async () => {
        const clickError = new Error('pointer events intercepted')
        const checkout = createCheckout({
            paymentVisibility: [false, false, false],
            clickError
        })

        await expect(advanceToPayment(checkout.page)).rejects.toThrow(clickError)
        expect(checkout.payment.isVisible).toHaveBeenCalledTimes(3)
        expect(checkout.payment.waitFor).not.toHaveBeenCalled()
    })
})
