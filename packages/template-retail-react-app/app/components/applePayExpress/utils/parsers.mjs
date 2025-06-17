/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import currencyList from './currencyList.mjs'
const INVALID_CURRENCY_ERROR = 'invalid currency!'
// converts the currency value for the Adyen Checkout API
export function getCurrencyValueForApi(amount, currencyCode) {
    const currency = currencyList.find((currency) => currency.Code === currencyCode)
    if (!currency) throw new Error(INVALID_CURRENCY_ERROR)
    return Math.round(amount * Math.pow(10, currency.Decimals))
}
