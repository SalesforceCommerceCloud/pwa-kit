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

    // Checkout may auto-submit shipping and advance while this helper starts.
    await paymentHeading.or(shippingForm).first().waitFor({state: 'visible'})
    if (await paymentHeading.isVisible()) return

    const continueToPayment = shippingForm.getByRole('button', {
        name: /Continue to Payment/i
    })
    await continueToPayment.waitFor({state: 'visible'})

    // Locator.click re-resolves after React renders and waits for the button to
    // be stable, enabled, and able to receive pointer events.
    await continueToPayment.click()
    await paymentHeading.waitFor({state: 'visible'})
}

module.exports = {advanceToPayment}
