/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

jest.mock('@axe-core/playwright', () => jest.fn())
jest.mock('@playwright/test', () => ({expect: jest.fn()}))

const {advanceToPayment, answerConsentTrackingForm} = require('./pageHelpers')

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
        getByTestId: jest.fn().mockReturnValue(form),
        waitForTimeout: jest.fn().mockResolvedValue()
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

        expect(checkout.payment.isVisible).toHaveBeenCalledTimes(3)
        expect(checkout.button.isVisible).toHaveBeenCalledTimes(1)
        expect(checkout.button.isEnabled).not.toHaveBeenCalled()
        expect(checkout.page.waitForTimeout).toHaveBeenCalledWith(100)
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

describe('answerConsentTrackingForm', () => {
    test('waits for auth initialization and the selected DNT state before returning', async () => {
        let releaseAuthInitialization
        const authInitialized = new Promise((resolve) => {
            releaseAuthInitialization = resolve
        })
        const waitForFunction = jest
            .fn()
            .mockImplementationOnce(() => authInitialized)
            .mockResolvedValueOnce(undefined)
        const click = jest.fn().mockResolvedValue(undefined)
        const consentForm = {
            waitFor: jest.fn().mockResolvedValue(undefined)
        }
        const button = {
            and: jest.fn().mockReturnThis(),
            first: jest.fn().mockReturnThis(),
            click
        }
        const page = {
            waitForFunction,
            locator: jest.fn((selector) => {
                if (selector === 'text=Tracking Consent') {
                    return consentForm
                }
                return button
            })
        }

        const answer = answerConsentTrackingForm(page)
        await Promise.resolve()

        expect(click).not.toHaveBeenCalled()

        releaseAuthInitialization()
        await answer

        expect(click).toHaveBeenCalledTimes(1)
        expect(waitForFunction).toHaveBeenCalledTimes(2)
        expect(waitForFunction.mock.calls[1][1]).toBe('0')
    })

    test('does not retry the dismissal click when DNT synchronization times out', async () => {
        const synchronizationError = new Error('DNT synchronization timed out')
        const waitForFunction = jest
            .fn()
            .mockResolvedValueOnce(undefined)
            .mockRejectedValueOnce(synchronizationError)
            .mockResolvedValueOnce(undefined)
        const click = jest.fn().mockResolvedValue(undefined)
        const consentForm = {
            waitFor: jest.fn().mockResolvedValue(undefined)
        }
        const button = {
            and: jest.fn().mockReturnThis(),
            first: jest.fn().mockReturnThis(),
            click
        }
        const page = {
            waitForFunction,
            locator: jest.fn((selector) => {
                if (selector === 'text=Tracking Consent') {
                    return consentForm
                }
                return button
            })
        }

        await expect(answerConsentTrackingForm(page)).rejects.toBe(synchronizationError)

        expect(click).toHaveBeenCalledTimes(1)
        expect(waitForFunction).toHaveBeenCalledTimes(2)
    })
})
