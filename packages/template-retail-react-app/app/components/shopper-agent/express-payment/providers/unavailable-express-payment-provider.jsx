/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useEffect} from 'react'

import {expressPaymentProviderPropTypes} from '@salesforce/retail-react-app/app/components/shopper-agent/express-payment/contract'

/**
 * Safe default when the application has not selected an express-payment provider.
 * This centralized fallback is also the natural place for future provider-selection
 * metrics, once their ownership and telemetry contract are defined.
 */
const UnavailableExpressPaymentProvider = ({lifecycle}) => {
    useEffect(() => {
        lifecycle.unavailable()
    }, [lifecycle])

    return null
}

UnavailableExpressPaymentProvider.propTypes = expressPaymentProviderPropTypes

export default UnavailableExpressPaymentProvider
