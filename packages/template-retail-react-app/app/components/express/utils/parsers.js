/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import CurrencyList from '@salesforce/retail-react-app/app/components/express/utils/currency-list'
import {
    cardNetworkNamesGPay,
    cardNetworkNamesAPay
} from '@salesforce/retail-react-app/app/components/express/utils/constants'
const INVALID_CURRENCY_ERROR = 'Invalid currency code'

// converts the currency value for the Adyen Checkout API
export function getCurrencyValueForApi(amount, currencyCode) {
    const currency = CurrencyList.find((currency) => currency.Code === currencyCode)
    if (!currency) {
        throw new Error(`${INVALID_CURRENCY_ERROR}: ${currencyCode}`)
    }
    return Math.round(amount * Math.pow(10, currency.Decimals))
}

// converts shipping methods to the shippingOptionParameters that Google Pay expects
export function getGPShippingOptionParameters(shippingMethods) {
    if (
        !shippingMethods ||
        !shippingMethods.applicableShippingMethods ||
        shippingMethods.applicableShippingMethods.length === 0
    ) {
        return undefined
    }

    let shippingOptions = shippingMethods?.applicableShippingMethods?.map((sm) => ({
        id: sm.id,
        label: sm.price !== undefined ? `$${sm.price.toFixed(2)}: ${sm.name}` : sm.name, // TODO: support for other currencies?
        description: sm.description
    }))

    return {
        defaultSelectedOptionId: shippingMethods.defaultShippingMethodId,
        shippingOptions: shippingOptions
    }
}

// Converts the card networks on an Adyen merchant account to the expected Google Pay network names
export function getGooglePayCardNetworks(paymentMethods) {
    if (!paymentMethods) {
        return []
    }

    const creditCardMethod = paymentMethods.find(
        (method) => method.name === 'Credit Card' && method.brands
    )

    if (!creditCardMethod || !creditCardMethod.brands) {
        return []
    }
    return creditCardMethod.brands
        .filter((brand) => cardNetworkNamesGPay[brand])
        .map((brand) => cardNetworkNamesGPay[brand])
}

// Converts the cart networks on Adyen Apple Pay to the expected Apple Pay network names
export function getApplePayCardNetworks(paymentMethods) {
    if (!paymentMethods) {
        return []
    }

    const applePayMethod = paymentMethods.find(
        (method) => method.name === 'Apple Pay' && method.brands
    )

    if (!applePayMethod || !applePayMethod.brands) {
        return []
    }
    return applePayMethod.brands
        .filter((brand) => cardNetworkNamesAPay[brand])
        .map((brand) => cardNetworkNamesAPay[brand])
}
