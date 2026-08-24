/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'

import SFPaymentsExpressButtons from '@salesforce/retail-react-app/app/components/sf-payments-express-buttons'
import {
    EXPRESS_BUY_NOW,
    EXPRESS_PAY_NOW
} from '@salesforce/retail-react-app/app/hooks/use-sf-payments'

// Agent-context wrapper around SFPaymentsExpressButtons.
// Parallels the sf-payments-express wrapper (checkout-context variant); this one owns the
// behavior deltas needed when express buttons render inside the shopper-agent widget:
// - Suppresses the built-in navigate('/checkout/confirmation/...') via onOrderApproved.
// - Delegates basket sourcing to the caller (temp basket, shared basket, whatever).
// - Reports completion back through onComplete so the widget host (Cimulate) can react.
//
// This component MUST NOT import anything tied to a specific mount mechanism (portal, iframe,
// route slot). Mount details live in the caller — see the story constraint in the plan.
const SFPaymentsExpressAgent = ({
    prepareBasket,
    paymentCurrency,
    paymentCountryCode,
    initialAmount,
    usage = EXPRESS_PAY_NOW,
    expressButtonLayout = 'vertical',
    maximumButtonCount = undefined,
    onComplete,
    onCancel,
    onError,
    onPaymentMethodsRendered
}) => {
    return (
        <div
            data-testid="sf-payments-express-agent"
            data-button-layout={expressButtonLayout}
            data-maximum-button-count={maximumButtonCount}
        >
            <SFPaymentsExpressButtons
                usage={usage}
                paymentCurrency={paymentCurrency}
                paymentCountryCode={paymentCountryCode}
                initialAmount={initialAmount}
                prepareBasket={prepareBasket}
                expressButtonLayout={expressButtonLayout}
                maximumButtonCount={maximumButtonCount}
                onPaymentMethodsRendered={onPaymentMethodsRendered}
                onOrderApproved={onComplete}
                onExpressPaymentCancel={onCancel}
                onExpressPaymentError={onError}
            />
        </div>
    )
}

SFPaymentsExpressAgent.propTypes = {
    prepareBasket: PropTypes.func.isRequired,
    paymentCurrency: PropTypes.string.isRequired,
    paymentCountryCode: PropTypes.string,
    initialAmount: PropTypes.number.isRequired,
    usage: PropTypes.oneOf([EXPRESS_BUY_NOW, EXPRESS_PAY_NOW]),
    expressButtonLayout: PropTypes.oneOf(['horizontal', 'vertical']),
    maximumButtonCount: PropTypes.number,
    onComplete: PropTypes.func,
    onCancel: PropTypes.func,
    onError: PropTypes.func,
    onPaymentMethodsRendered: PropTypes.func
}

export default SFPaymentsExpressAgent
