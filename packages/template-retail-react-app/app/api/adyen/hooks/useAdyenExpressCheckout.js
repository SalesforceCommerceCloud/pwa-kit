/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {AdyenExpressCheckoutContext} from '@salesforce/retail-react-app/app/api/adyen/contexts/adyen-express-checkout-context'

/**
 * A hook for managing checkout state and actions
 * @returns {Object} Checkout data and actions
 */
const useAdyenExpressCheckout = () => {
    return React.useContext(AdyenExpressCheckoutContext)
}

export default useAdyenExpressCheckout
