/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const advanceToPayment = async (page) => {
    const paymentHeading = page.getByRole('heading', {name: /Payment/i})
    if (await paymentHeading.isVisible()) return

    const shippingForm = page.getByTestId('sf-checkout-shipping-options-form')
    const continueToPayment = shippingForm.getByRole('button', {
        name: /Continue to Payment/i
    })

    // Use one locator waiter so the inactive checkout path cannot outlive this
    // transition. Checkout may auto-submit shipping while the button appears.
    await paymentHeading.or(continueToPayment).first().waitFor({state: 'visible'})
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
