/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import currencyList from '@salesforce/retail-react-app/app/components/applePayExpress/utils/currencyList'

// converts the currency value for the Adyen Checkout API
export function getCurrencyValueForApi(amount, currencyCode) {
    if (typeof amount !== 'number' || isNaN(amount)) {
        throw new Error(`Invalid amount: ${amount}`)
    }

    const currency = currencyList.find((currency) => currency.Code === currencyCode)
    if (!currency) {
        throw new Error(`Unsupported or unknown currency code: ${currencyCode}`)
    }

    return Math.round(amount * Math.pow(10, currency.Decimals))
}
