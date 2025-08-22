/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import AdyenCheckout from '@adyen/adyen-web'

/**
 * Shared utilities for express payment components
 */

/**
 * Creates Adyen checkout instance with common configuration
 */
export const createAdyenCheckout = async (adyenEnvironment, locale, applicationInfo) => {
    try {
        const checkout = await AdyenCheckout({
            environment: adyenEnvironment?.ADYEN_ENVIRONMENT,
            clientKey: adyenEnvironment?.ADYEN_CLIENT_KEY,
            locale: locale.id,
            analytics: {
                analyticsData: {
                    applicationInfo
                }
            }
        })
        return checkout
    } catch (ex) {
        console.error('Failed to initialize AdyenCheckout:', ex)
        throw ex
    }
}

/**
 * Common validation logic for express payment components
 */
export const validateExpressPaymentSetup = ({
    isPdpMode,
    adyenPaymentMethods,
    hasRequiredBasketData
}) => {
    if (isPdpMode) {
        // In PDP mode, we just need the basic data from parent
        if (!adyenPaymentMethods?.environment || !adyenPaymentMethods) {
            return false
        }
    } else {
        // Validate required basket properties
        if (!hasRequiredBasketData) {
            return false
        }
    }

    if (!adyenPaymentMethods?.environment) {
        return false
    }

    return true
}

/**
 * Common error handling for missing order total
 */
export const isMissingOrderTotalError = (error) => {
    return (
        error instanceof TypeError &&
        (/undefined is not an object \(evaluating '[a-z]\.orderTotal'\)/.test(error.message) || // Safari error
            /Cannot read properties of undefined \(reading 'orderTotal'\)/.test(error.message)) // Chrome error
    )
}

/**
 * Common error handling for missing shipping methods
 */
export const isMissingShippingMethodsError = (error) => {
    return (
        error instanceof TypeError &&
        (/undefined is not an object \(evaluating '[a-z]\.defaultShippingMethodId'\)/.test(
            error.message
        ) ||
            /Cannot read properties of undefined \(reading 'defaultShippingMethodId'\)/.test(
                error.message
            ))
    )
}

/**
 * Common dependency array for express payment components
 */
export const getExpressPaymentDependencies = ({
    adyenPaymentMethods,
    basket,
    sku,
    quantity,
    isPdpMode,
    tempBasket,
    currentSku
}) => [
    // Parent props that could change
    adyenPaymentMethods,
    basket,
    sku,
    quantity,
    isPdpMode,

    // Local state that could change
    tempBasket,
    currentSku
]

/**
 * Sends express payment messages to parent window
 * Used by both Apple Pay and Google Pay components
 */
export const sendExpressMessage = (type, payload = {}) => {
    window.parent.postMessage(
        {
            type,
            payload
        },
        '*'
    )
}

/**
 * Generic function to get payment method configuration
 * Replaces duplicate functions in Apple Pay and Google Pay components
 */
export const getPaymentMethodConfig = (paymentMethodsResponse, paymentMethodType) => {
    const paymentMethod = paymentMethodsResponse?.paymentMethods?.find(
        (pm) => pm.type === paymentMethodType
    )
    return paymentMethod?.configuration || null
}
