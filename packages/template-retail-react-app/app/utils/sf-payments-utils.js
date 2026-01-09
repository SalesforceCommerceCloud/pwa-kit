/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * Helper function to read the client secret from the payment instrument
 * @param {Object} paymentInstrument - Payment instrument object
 * @returns {string|null} Client secret
 */
export const getClientSecret = (paymentInstrument) => {
    return paymentInstrument?.paymentReference?.gatewayProperties?.stripe?.clientSecret
}

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
    return paymentMethodType === 'paypal' || paymentMethodType === 'venmo'
}

/**
 * Finds the payment account/gateway for a given payment method type from payment method set accounts.
 * Similar to SFRA's findAccount function.
 * @param {Array} paymentMethodSetAccounts - Array of payment method set accounts
 * @param {string} paymentMethodType - Type of payment method (e.g., 'card', 'paypal', 'venmo')
 * @returns {Object|null} Payment account object with vendor property, or null if not found
 */
export const findPaymentAccount = (paymentMethodSetAccounts, paymentMethodType) => {
    if (!paymentMethodSetAccounts || !Array.isArray(paymentMethodSetAccounts)) {
        return null
    }

    // Find account that supports this payment method type
    return (
        paymentMethodSetAccounts.find((account) => {
            return account.paymentMethods?.some((pm) => pm.id === paymentMethodType)
        }) || null
    )
}

/**
 * Determines the gateway name from payment method type and payment method set accounts.
 * @param {string} paymentMethodType - Type of payment method (e.g., 'card', 'paypal', 'venmo')
 * @param {Array} paymentMethodSetAccounts - Array of payment method set accounts
 * @returns {string|null} Gateway name ('stripe', 'adyen', or null)
 */
export const getGatewayFromPaymentMethod = (paymentMethodType, paymentMethodSetAccounts) => {
    if (isPayPalPaymentMethodType(paymentMethodType)) {
        return null
    }

    const account = findPaymentAccount(paymentMethodSetAccounts, paymentMethodType)
    if (!account) {
        return paymentMethodType === 'card' ? 'stripe' : null
    }

    const vendor = account.vendor?.toLowerCase()
    if (vendor === 'stripe') {
        return 'stripe'
    } else if (vendor === 'adyen') {
        return 'adyen'
    }

    return paymentMethodType === 'card' ? 'stripe' : null
}

/**
 * Determines the setup_future_usage value for Stripe payment intents based on configuration and user preference.
 * Follows SFRA pattern: if futureUsageOffSession is enabled, always use 'off_session';
 * otherwise, use 'on_session' if user wants to save payment method.
 * @param {boolean} storePaymentMethod - Whether the user wants to save the payment method
 * @param {boolean} futureUsageOffSession - Whether off-session future usage is enabled in configuration
 * @returns {string|null} 'on_session', 'off_session', or null
 */
export const getSetupFutureUsage = (storePaymentMethod, futureUsageOffSession) => {
    if (futureUsageOffSession) {
        return 'off_session'
    } else if (storePaymentMethod) {
        return 'on_session'
    }
    return null
}

/**
 * Creates a payment instrument body for Salesforce Payments (for basket or order).
 * Follows SFRA pattern and OCAPI PATCH format with gatewayProperties.
 * @param {number} amount - Payment amount
 * @param {string} paymentMethodType - Type of payment method (e.g., 'card', 'paypal', 'venmo')
 * @param {string} zoneId - Zone ID for payment processing
 * @param {string} shippingPreference - optional shipping preference for PayPal payment processing
 * @param {boolean} storePaymentMethod - optional flag to save payment method for future use
 * @param {boolean} futureUsageOffSession - optional flag indicating if off-session future usage is enabled (from payment config)
 * @param {Array} paymentMethodSetAccounts - optional array of payment method set accounts to determine gateway
 * @returns {Object} Payment instrument body
 */
export const createPaymentInstrumentBody = (
    amount,
    paymentMethodType,
    zoneId,
    shippingPreference,
    storePaymentMethod = false,
    futureUsageOffSession = false,
    paymentMethodSetAccounts = null
) => {
    const paymentReferenceRequest = {
        paymentMethodType: paymentMethodType,
        zoneId: zoneId ?? 'default'
    }

    if (shippingPreference !== undefined && shippingPreference !== null) {
        paymentReferenceRequest.shippingPreference = shippingPreference
    }

    const gateway = getGatewayFromPaymentMethod(paymentMethodType, paymentMethodSetAccounts)

    if (gateway === 'stripe' && (storePaymentMethod || futureUsageOffSession)) {
        const setupFutureUsage = getSetupFutureUsage(storePaymentMethod, futureUsageOffSession)
        if (setupFutureUsage) {
            paymentReferenceRequest.gateway = 'stripe'
            paymentReferenceRequest.gatewayProperties = {
                stripe: {
                    setup_future_usage: setupFutureUsage
                }
            }
        }
    }

    if (gateway === 'adyen' && storePaymentMethod) {
        paymentReferenceRequest.gateway = 'adyen'
    }

    return {
        paymentMethodId: 'Salesforce Payments',
        amount: amount,
        paymentReferenceRequest: paymentReferenceRequest
    }
}

/**
 * Generates a display name for a saved payment method (matches SFRA format)
 * @param {string} type - Payment method type
 * @param {string} brand - Card brand (for cards only)
 * @param {string} last4 - Last 4 digits (for cards only)
 * @param {string} name - Generic name fallback
 * @returns {string} Display name
 */
const generateDisplayName = (type, brand, last4, name) => {
    if (type === 'card' && brand && last4) {
        return `${brand} **** ${last4}`
    }
    return name || 'Saved Payment Method'
}

/**
 * Formats Stripe saved payment method (matches SFRA's getStripeSavedPaymentMethods)
 * @param {Object} paymentReference - Payment reference object
 * @param {Object} stripeProps - Stripe gateway properties
 * @param {Object} account - Payment method set account
 * @param {string} paymentMethodType - Payment method type
 * @returns {Object} Formatted saved payment method
 */
const formatStripeSavedPaymentMethod = (
    paymentReference,
    stripeProps,
    account,
    paymentMethodType
) => {
    const last4 = stripeProps.last4 || ''
    const brand = stripeProps.brand || ''
    const paymentMethodId = stripeProps.paymentMethodId || paymentReference.paymentReferenceId
    const displayName = generateDisplayName(paymentMethodType, brand, last4, null)

    return {
        accountId: account.accountId,
        name: displayName,
        status: 'Active',
        isDefault: false,
        type: paymentMethodType,
        accountHolderName: null,
        id: paymentReference.paymentReferenceId,
        gatewayTokenId: paymentMethodId,
        usageType: 'OffSession',
        gatewayId: account.accountId,
        gatewayCustomerId: stripeProps.customerId || null,
        last4: last4 || null,
        network: brand?.toLowerCase() || null,
        issuer: null,
        expiryMonth: stripeProps.expMonth?.toString() || null,
        expiryYear: stripeProps.expYear?.toString() || null,
        bankName: null,
        savedByMerchant: false
    }
}

/**
 * Formats payment method references from customer data into SDK's SavedPaymentMethod format
 * Currently supports Stripe payment methods. Structure allows easy extension for Adyen.
 * @param {Array} paymentMethodReferences - Array of payment method references from customer data
 * @param {Array} paymentMethodSetAccounts - Array of payment method set accounts to match gateway info
 * @returns {Array} Formatted saved payment methods for SDK
 */
export const formatSavedPaymentMethods = (
    paymentMethodReferences = [],
    paymentMethodSetAccounts = []
) => {
    if (!paymentMethodReferences || paymentMethodReferences.length === 0) {
        return []
    }

    const savedPaymentMethods = []

    paymentMethodReferences.forEach((ref) => {
        const paymentReference = ref.paymentReference
        if (!paymentReference?.paymentReferenceId) {
            return
        }

        const gatewayProperties = paymentReference?.gatewayProperties || {}
        const paymentMethodType = paymentReference.paymentMethodType || 'card'

        const stripeProps = gatewayProperties?.stripe || {}
        if (stripeProps && Object.keys(stripeProps).length > 0) {
            const account = paymentMethodSetAccounts.find((acc) => acc.vendor === 'Stripe')
            if (account) {
                savedPaymentMethods.push(
                    formatStripeSavedPaymentMethod(
                        paymentReference,
                        stripeProps,
                        account,
                        paymentMethodType
                    )
                )
            }
        }

        // TODO: Adyen support for SPM
    })

    return savedPaymentMethods
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
