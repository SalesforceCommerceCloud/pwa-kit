/**
 * TEMP CODE
 * Maps backend payment method types to frontend SFP element types
 * THIS Mapping is wrong but unblocks from testing until API is fixed!
 */
const mapPaymentMethodType = (backendType) => {
    const typeMapping = {
        // Express payment methods
        'apple_pay': 'applepay',
        'payment_request': 'googlepay', // payment_request from backend = Google Pay in frontend
        'paypal_express': 'paypal',
        'venmo_express': 'venmoexpress',
        
        // Regular payment methods
        'card': 'card',
        'paypal': 'paypal',
        'venmo': 'venmo',
        'ideal': 'ideal',
        'sepa_debit': 'sepa_debit',
        'bancontact': 'bancontact',
        'klarna': 'klarna',
        'eps': 'eps',
        'afterpay_clearpay': 'afterpay_clearpay'
    }
    
    return typeMapping[backendType] || backendType
}

/**
 * Creates payment method set for different payment flows
 */
export const createPaymentMethodSet = (paymentConfig, basket, options = {}) => {
   
    if (paymentConfig.paymentMethods && paymentConfig.paymentMethodSetAccounts) {
        const { paymentFlow = 'checkout', enabledMethods = null } = options
    
        // ✅ Filter payment methods by flow
        const filteredMethods = paymentConfig.paymentMethods.filter(method => {
            if (paymentFlow === 'express') {
                return method.paymentModes.includes('Express')
            } else {
                return method.paymentModes.includes('Multistep') || method.paymentModes.includes('Singlestep')
            }
        })
        
        // ✅ Apply enabledMethods filter if provided
        const finalMethods = enabledMethods 
            ? filteredMethods.filter(method => enabledMethods.includes(method.paymentMethodType))
            : filteredMethods
    
        // ✅ Map backend types to frontend types (temporary stop gap)
        const mappedMethods = finalMethods.map(method => ({
            ...method,
            paymentMethodType: mapPaymentMethodType(method.paymentMethodType)
        }))

        return {
            paymentMethods: mappedMethods,  
            paymentMethodSetAccounts: paymentConfig.paymentMethodSetAccounts  // ✅ Use SCAPI data directly!
        }
    }
}
/**
 * Creates payment request info from basket data
 */
export const createPaymentRequestInfo = (basket, locale = 'en-US', detectedCountry) => {
    return {
        amount: basket?.orderTotal || basket?.productTotal || 0,
        currency: basket?.currency || 'USD',
        country: basket?.billingAddress?.countryCode || 
            basket?.shipments?.[0]?.shippingAddress?.countryCode || 
            detectedCountry || 
            'US',  // Final fallback
        locale: locale
    }
}

/**
 * Creates SFP configuration for sheet with theme, actions, and options
 */
// TODO: this is not to be used
export const createSFPConfig = (paymentConfig, options = {}) => {
    const {
        createIntentFunction,
        updateIntentFunction,
        customTheme = {}
    } = options

    return {
        theme: {
            designTokens: {
                'color-background': 'var(--skin-background-color-1, transparent)',
                'input-background-color': '#ffffff',
                'input-border': '1px solid #ced4da',
                'input-focus-border': '1px solid rgb(96.5, 210.421875, 255)',
                ...customTheme // Allow theme overrides
            }
        },
        actions: {
            createIntentFunction,
            updateIntentFunction 
        },
        options: {
            useManualCapture: !paymentConfig.card_capture_automatic
        }
    }
}