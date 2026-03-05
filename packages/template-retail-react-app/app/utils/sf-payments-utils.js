/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {
    PAYMENT_METHOD_TYPES,
    PAYMENT_GATEWAYS,
    SETUP_FUTURE_USAGE
} from '@salesforce/retail-react-app/app/constants'

/**
 * Returns the first Salesforce Payments instrument found in a basket or order.
 * @param {Object} basketOrOrder - A basket or order object containing paymentInstruments
 * @returns {Object|undefined} First Salesforce Payments payment instrument found, or undefined if none exist
 */
export const getSFPaymentsInstrument = (basketOrOrder) => {
    return basketOrOrder?.paymentInstruments?.find(
        (pi) => pi.paymentMethodId === 'Salesforce Payments'
    )
}

/**
 * Returns the client secret from a payment instrument (e.g. Stripe PaymentIntent client_secret).
 * Used by express payment flows to pass through to the payment SDK.
 * @param {Object} paymentInstrument - Payment instrument with paymentReference.gatewayProperties
 * @returns {string|undefined} Client secret for the payment gateway, or undefined if not present
 */
export const getClientSecret = (paymentInstrument) => {
    return paymentInstrument?.paymentReference?.gatewayProperties?.stripe?.clientSecret
}

/**
 * Transform billing and shipping address details from payment provider format to basket format.
 * Determines the appropriate source for billing address (PayPal/Venmo may not provide complete billing details).
 * Handles name splitting and address field mapping.
 * @param {Object} billingDetails - Billing details from payment provider
 * @param {Object} shippingDetails - Shipping details from payment provider
 * @returns {Object} Object containing { billingAddress, shippingAddress }
 */
export const transformAddressDetails = (billingDetails, shippingDetails) => {
    // Helper function to transform a single address
    const transformSingleAddress = (addressDetails) => {
        const address = {
            firstName: null,
            lastName: null,
            address1: addressDetails.address.line1,
            address2: addressDetails.address.line2 || null,
            city: addressDetails.address.city,
            stateCode: addressDetails.address.state,
            postalCode: addressDetails.address.postalCode,
            countryCode: addressDetails.address.country,
            phone: addressDetails.phone || null
        }

        if (addressDetails.name) {
            const names = addressDetails.name.split(' ')
            address.firstName = names.slice(0, -1).join(' ')
            address.lastName = names.slice(-1).join(' ')
        }

        return address
    }

    // For PayPal/Venmo, billing address might not be available or incomplete
    // Use shipping address as billing address if billing details are missing or incomplete
    const billingAddr = billingDetails?.address
    const hasBillingDetails = billingDetails?.name && billingAddr?.city
    const billingSource = hasBillingDetails ? billingDetails : shippingDetails

    return {
        billingAddress: transformSingleAddress(billingSource),
        shippingAddress: transformSingleAddress(shippingDetails)
    }
}

/**
 * Transform shipping methods from API format to express payment format.
 * @param {Array} shippingMethods - Array of shipping methods from API
 * @param {Object} basket - Basket object containing currency
 * @param {string} selectedId - ID of the currently selected shipping method
 * @param {boolean} sortSelected - Whether to sort selected method to the top
 * @returns {Array} Transformed shipping methods
 */
export const transformShippingMethods = (
    shippingMethods,
    basket,
    selectedId = null,
    sortSelected = true
) => {
    const methods = shippingMethods.map((method) => ({
        id: method.id,
        name: method.name,
        classOfService: method.description,
        amount: method.price?.toString()
    }))

    if (sortSelected && selectedId) {
        methods.sort((m1, m2) => {
            if (m1.id === selectedId) return -1
            if (m2.id === selectedId) return 1
            return 0
        })
    }

    return methods
}

/**
 * Get the currently selected shipping method ID from basket or fallback to default.
 * @param {Object} basket - Basket object
 * @param {Object} shippingMethods - Shipping methods object with defaultShippingMethodId
 * @returns {string} Selected shipping method ID
 */
export const getSelectedShippingMethodId = (basket, shippingMethods) => {
    return basket.shipments?.[0]?.shippingMethod?.id || shippingMethods.defaultShippingMethodId
}

/**
 * Validates current shipping method is still applicable.
 * Returns true if valid, false if the method needs to be updated.
 * @param {Object} currentBasket - Basket object
 * @param {Object} updatedShippingMethods - Updated shipping methods response
 * @returns {boolean} Whether the current shipping method is still valid
 */
export const isShippingMethodValid = (currentBasket, updatedShippingMethods) => {
    const currentShippingMethodId = currentBasket.shipments[0].shippingMethod?.id
    return updatedShippingMethods.applicableShippingMethods.some(
        (method) => method.id === currentShippingMethodId
    )
}

/**
 * Checks if the payment method type uses PayPal to render and complete payments
 * @param {string} paymentMethodType - Type of payment method (e.g., 'card', 'paypal', 'venmo')
 * @returns {boolean} Whether the payment method type uses PayPal
 */
export const isPayPalPaymentMethodType = (paymentMethodType) => {
    return (
        paymentMethodType === PAYMENT_METHOD_TYPES.PAYPAL ||
        paymentMethodType === PAYMENT_METHOD_TYPES.VENMO
    )
}

/**
 * Finds the payment account/gateway for a given payment method type from payment method set accounts.
 * @param {Array} paymentMethods - Array of payment methods
 * @param {Array} paymentMethodSetAccounts - Array of payment method set accounts
 * @param {string} paymentMethodType - Type of payment method
 * @returns {Object|null} Payment account object with vendor property, or null if not found
 */
export const findPaymentAccount = (paymentMethods, paymentMethodSetAccounts, paymentMethodType) => {
    if (!paymentMethodSetAccounts || !Array.isArray(paymentMethodSetAccounts)) {
        return null
    }

    // Find payment method by type to get its accountId
    const paymentMethod = paymentMethods?.find((pm) => pm.paymentMethodType === paymentMethodType)
    if (!paymentMethod || !paymentMethod.accountId) {
        return null
    }

    // Find account by accountId
    return (
        paymentMethodSetAccounts.find((account) => {
            return account.accountId === paymentMethod.accountId
        }) || null
    )
}

/**
 * Determines the gateway name from payment method type and payment method set accounts.
 * @param {string} paymentMethodType - Type of payment method
 * @param {Array} paymentMethods - Array of payment methods
 * @param {Array} paymentMethodSetAccounts - Array of payment method set accounts
 * @returns {string|null} Gateway name
 */
export const getGatewayFromPaymentMethod = (
    paymentMethodType,
    paymentMethods,
    paymentMethodSetAccounts
) => {
    const account = findPaymentAccount(paymentMethods, paymentMethodSetAccounts, paymentMethodType)
    if (!account) {
        return null
    }

    const vendor = account.vendor?.toLowerCase()
    if (vendor === PAYMENT_GATEWAYS.STRIPE) {
        return PAYMENT_GATEWAYS.STRIPE
    } else if (vendor === PAYMENT_GATEWAYS.ADYEN) {
        return PAYMENT_GATEWAYS.ADYEN
    } else if (vendor === PAYMENT_GATEWAYS.PAYPAL) {
        return PAYMENT_GATEWAYS.PAYPAL
    }

    return null
}

/**
 * Creates a payment instrument body for Salesforce Payments (for basket or order).
 * @param {Object} params - Parameters for creating payment instrument body
 * @param {number} params.amount - Payment amount
 * @param {string} params.paymentMethodType - Type of payment method (e.g., 'card', 'paypal', 'venmo')
 * @param {string} params.zoneId - Zone ID for payment processing
 * @param {string} [params.shippingPreference] - Optional shipping preference for PayPal payment processing
 * @param {string} [params.paymentData] - Optional Adyen client payment data object
 * @param {boolean} [params.storePaymentMethod=false] - Optional flag to save payment method for future use
 * @param {boolean} [params.futureUsageOffSession=false] - Optional flag indicating if off-session future usage is enabled (from payment config)
 * @param {Array} [params.paymentMethods] - Optional array of payment methods to determine gateway
 * @param {Array} [params.paymentMethodSetAccounts] - Optional array of payment method set accounts to determine gateway
 * @param {boolean} [params.isPostRequest=false] - Optional flag to indicate if this is a POST request (basket)
 * @returns {Object} Payment instrument body
 */
export const createPaymentInstrumentBody = ({
    amount,
    paymentMethodType,
    zoneId,
    shippingPreference,
    paymentData = null,
    storePaymentMethod = false,
    futureUsageOffSession = false,
    paymentMethods = null,
    paymentMethodSetAccounts = null,
    isPostRequest = false
} = {}) => {
    const paymentReferenceRequest = {
        paymentMethodType: paymentMethodType,
        zoneId: zoneId ?? 'default'
    }

    const gateway = getGatewayFromPaymentMethod(
        paymentMethodType,
        paymentMethods,
        paymentMethodSetAccounts
    )

    if (
        gateway === PAYMENT_GATEWAYS.PAYPAL &&
        shippingPreference !== undefined &&
        shippingPreference !== null
    ) {
        paymentReferenceRequest.gateway = PAYMENT_GATEWAYS.PAYPAL
        paymentReferenceRequest.gatewayProperties = {
            paypal: {
                shippingPreference
            }
        }
    }

    if (!isPostRequest && gateway === PAYMENT_GATEWAYS.STRIPE && storePaymentMethod) {
        const setupFutureUsage = futureUsageOffSession
            ? SETUP_FUTURE_USAGE.OFF_SESSION
            : SETUP_FUTURE_USAGE.ON_SESSION
        paymentReferenceRequest.gateway = PAYMENT_GATEWAYS.STRIPE
        paymentReferenceRequest.gatewayProperties = {
            stripe: {setupFutureUsage}
        }
    }

    if (!isPostRequest && gateway === PAYMENT_GATEWAYS.ADYEN) {
        // Create Adyen payment reference request
        paymentReferenceRequest.gateway = PAYMENT_GATEWAYS.ADYEN
        paymentReferenceRequest.gatewayProperties = {
            adyen: {
                ...(paymentData && {
                    paymentMethod: paymentData.paymentMethod,
                    returnUrl: paymentData.returnUrl,
                    origin: paymentData.origin,
                    lineItems: paymentData.lineItems,
                    billingDetails: paymentData.billingDetails
                }),
                ...(storePaymentMethod && {storePaymentMethod: true})
            }
        }
    }

    return {
        paymentMethodId: 'Salesforce Payments',
        amount: amount,
        paymentReferenceRequest: paymentReferenceRequest
    }
}

/**
 * Transforms payment method references from API format to SF Payments SDK format.
 * @param {Object} customer - Customer object with paymentMethodReferences property
 * @param {Object} paymentConfig - Payment configuration object with paymentMethodSetAccounts property
 * @returns {Array} Transformed payment method references for SF Payments SDK
 */
export const transformPaymentMethodReferences = (customer, paymentConfig) => {
    const paymentMethodReferences = customer?.paymentMethodReferences
    const paymentMethodSetAccounts = paymentConfig?.paymentMethodSetAccounts || []

    if (!Array.isArray(paymentMethodReferences) || !Array.isArray(paymentMethodSetAccounts)) {
        return []
    }

    return paymentMethodReferences
        .map((pmr) => {
            const generateDisplayName = () => {
                if (pmr.type === 'card' && pmr.last4) {
                    return `Card •••• ${pmr.last4}`
                }
                if (pmr.type === 'sepa_debit' && pmr.last4) {
                    return `Account ending in ${pmr.last4}`
                }
                return 'Saved Payment Method'
            }

            // Determine gatewayId for SDK matching
            if (!pmr.accountId) {
                return null
            }

            const matchingAccount = paymentMethodSetAccounts.find(
                (account) => account.accountId === pmr.accountId
            )
            if (!matchingAccount) {
                return null
            }

            const gatewayId = matchingAccount.accountId

            if (!gatewayId || typeof gatewayId !== 'string') {
                return null
            }

            return {
                accountId: pmr.accountId || null,
                name: generateDisplayName(),
                status: 'Active',
                isDefault: false,
                type: pmr.type || null,
                accountHolderName: null,
                id: pmr.id || null,
                gatewayTokenId: pmr.id || null,
                usageType: 'OffSession',
                gatewayId: gatewayId,
                gatewayCustomerId: null,
                last4: pmr.last4 || null,
                network: pmr.brand || null,
                issuer: null,
                expiryMonth: null,
                expiryYear: null,
                bankName: null,
                savedByMerchant: false
            }
        })
        .filter((spm) => spm !== null)
}

/**
 * Maps payment method type for express buttons based on gateway.
 * Stripe express requires 'card' for googlepay/applepay, while Adyen uses the original type.
 *
 * @param {string} type - The payment method type (e.g., 'googlepay', 'applepay', 'paypal')
 * @param {string} gateway - The payment gateway (e.g., 'stripe', 'adyen')
 * @returns {string} The mapped payment method type
 */
export const getExpressPaymentMethodType = (type, paymentMethods, paymentMethodSetAccounts) => {
    const gateway = getGatewayFromPaymentMethod(type, paymentMethods, paymentMethodSetAccounts)
    // Only Stripe express needs 'card' mapping for applepay/googlepay
    if (gateway === PAYMENT_GATEWAYS.STRIPE) {
        switch (type) {
            case 'applepay':
            case 'googlepay':
                return 'card'
            default:
                return type
        }
    }
    // Adyen and others use the type as-is
    return type
}

/**
 * Returns a theme object containing CSS information for use with SF Payments components.
 * @param {*} options - theme override options
 * @returns SF Payments theme
 */
export const buildTheme = (options) => {
    return {
        designTokens: {
            'font-family':
                '-apple-system, "system-ui", "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
            'font-weight-regular': '400',
            'font-weight-bold': '700',
            'font-size-2': '8px',
            'font-size-3': '12px',
            'font-size-4': '16px',
            'font-size-5': '17px',
            'font-size-6': '18px',
            'line-height-text': '1.5',
            'color-text-default': '#181818',
            'color-text-error': '#ea001e',
            'color-text-placeholder': '#939393',
            'color-text-weak': '#5c5c5c',
            'color-background': 'rgba(0, 0, 0, 0)',
            'color-brand': '#1b96ff',
            'color-text-brand-primary': '#ffffff',
            'color-text-inverse': '#ffffff',
            'color-border-input': '#939393',
            'border-radius-medium': '4px',
            'border-radius-small': '2px',
            'spacing-large': '24px',
            'spacing-medium': '16px',
            'spacing-small': '12px',
            'spacing-x-large': '32px',
            'spacing-x-small': '8px',
            'spacing-xx-small': '4px',
            'spacing-xxx-small': '2px'
        },
        rules: {
            button: {
                'border-radius': '4px'
            },
            input: {
                'border-radius': '4px',
                margin: '0 0 4px 0',
                padding: '6px 12px',
                focus: {
                    border: '1px solid #1b96ff',
                    'box-shadow': '0 0 0 1px #1b96ff',
                    outline: '2px solid transparent',
                    transition:
                        'background-color,border-color,color,fill,stroke,opacity,box-shadow,transform'
                },
                invalid: {
                    border: '1px solid #ea001e',
                    'box-shadow': '0 0 0 1px #ea001e',
                    outline: '2px solid transparent',
                    transition:
                        'background-color,border-color,color,fill,stroke,opacity,box-shadow,transform'
                }
            },
            formLabel: {
                'font-size': '14px',
                'font-weight': '600',
                margin: '12px 0 0 0',
                padding: '0 12px 4px 0',
                transition:
                    'background-color,border-color,color,fill,stroke,opacity,box-shadow,transform'
            },
            error: {
                color: '#ea001e',
                'font-size': '14px'
            }
        },
        expressButtons: {
            buttonLayout: options?.expressButtonLayout || 'vertical',
            buttonShape: 'pill',
            buttonHeight: 44,
            buttonColors: {
                applepay: 'black',
                googlepay: 'black',
                paypal: 'gold',
                venmo: 'blue'
            },
            buttonLabels: options?.expressButtonLabels || {
                applepay: 'plain',
                googlepay: 'plain',
                paypal: 'paypal',
                venmo: 'paypal' // Yes, default Venmo label is "paypal"
            }
        }
    }
}
