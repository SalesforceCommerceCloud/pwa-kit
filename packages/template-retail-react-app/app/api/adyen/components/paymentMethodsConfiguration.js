/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {baseConfig} from '@salesforce/retail-react-app/app/api/adyen/components/helpers/baseConfig'
import {applePayConfig} from '@salesforce/retail-react-app/app/api/adyen/components/applepay/config'

export const paymentMethodsConfiguration = ({
    paymentMethods = [],
    additionalPaymentMethodsConfiguration,
    ...props
}) => {
    const defaultConfig = baseConfig(props)
    if (!paymentMethods || !paymentMethods.length) {
        return defaultConfig
    }

    const paymentMethodsConfig = {
        applepay: applePayConfig(props)
    }

    return Object.fromEntries(
        paymentMethods.map((paymentMethod) => {
            const type = paymentMethod.type === 'scheme' ? 'card' : paymentMethod.type
            const basePaymentMethodConfig = Object.hasOwn(paymentMethodsConfig, type)
                ? paymentMethodsConfig[type]
                : defaultConfig
            return additionalPaymentMethodsConfiguration?.[type]
                ? [
                      type,
                      {...basePaymentMethodConfig, ...additionalPaymentMethodsConfiguration[type]}
                  ]
                : [type, basePaymentMethodConfig]
        })
    )
}
