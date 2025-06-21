/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import CurrencyList from '@salesforce/retail-react-app/app/components/apple-pay-express/utils/currency-list'

const INVALID_CURRENCY_ERROR = 'Invalid currency code'

// converts the currency value for the Adyen Checkout API
export function getCurrencyValueForApi(amount, currencyCode) {
    const currency = CurrencyList.find((currency) => currency.Code === currencyCode)
    if (!currency) {
        throw new Error(`${INVALID_CURRENCY_ERROR}: ${currencyCode}`)
    }
    return Math.round(amount * Math.pow(10, currency.Decimals))
}
