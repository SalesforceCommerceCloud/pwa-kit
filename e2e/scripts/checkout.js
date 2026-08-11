/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const TRANSITION_TIMEOUT = 30000
const POLL_INTERVAL = 100

const waitForPaymentOrReadyButton = async (page, paymentHeading, continueToPayment) => {
    const deadline = Date.now() + TRANSITION_TIMEOUT

    while (Date.now() < deadline) {
        if (await paymentHeading.isVisible()) return 'payment'
        if ((await continueToPayment.isVisible()) && (await continueToPayment.isEnabled())) {
            return 'button'
        }
        await page.waitForTimeout(POLL_INTERVAL)
    }

    throw new Error('Timed out waiting for Payment or a ready Continue to Payment button')
}

const advanceToPayment = async (page) => {
    const paymentHeading = page.getByRole('heading', {name: /Payment/i})
    if (await paymentHeading.isVisible()) return

    const shippingForm = page.getByTestId('sf-checkout-shipping-options-form')
    const continueToPayment = shippingForm.getByRole('button', {
        name: /Continue to Payment/i
    })

    const transition = await waitForPaymentOrReadyButton(page, paymentHeading, continueToPayment)
    if (transition === 'payment') return

    // Checkout may auto-submit shipping after the button becomes ready.
    if (await paymentHeading.isVisible()) return

    // Locator.click re-resolves after React renders and waits for the button to
    // be stable, enabled, and able to receive pointer events.
    try {
        await continueToPayment.click()
    } catch (error) {
        // The button can disappear after winning the transition wait when the
        // checkout auto-submits. Preserve genuine click failures.
        if (await paymentHeading.isVisible()) return
        throw error
    }
    await paymentHeading.waitFor({state: 'visible'})
}

module.exports = {advanceToPayment}
