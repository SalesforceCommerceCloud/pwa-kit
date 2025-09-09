
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
        'paypal_express': 'paypalexpress',
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
    
        // ✅ Map backend types to frontend types
        const mappedMethods = finalMethods.map(method => ({
            ...method,
            paymentMethodType: mapPaymentMethodType(method.paymentMethodType)
        }))
        return {
            id: generatePaymentSetId(),
            name: `Payment Methods for ${paymentFlow}`,
            countryCode: getCountryCode(basket),
            paymentMethods: mappedMethods,  
            paymentMethodSetAccounts: paymentConfig.paymentMethodSetAccounts  // ✅ Use SCAPI data directly!
        }
    }


    /*if (paymentFlow === 'express') {
        baseConfig.paymentMethods = createExpressPaymentMethods(paymentConfig, enabledMethods)
    } else {
        baseConfig.paymentMethods = createCheckoutPaymentMethods(paymentConfig, enabledMethods)
    }

    return baseConfig*/
}

/**
 * Creates payment methods for regular checkout flow
 */
const createCheckoutPaymentMethods = (paymentConfig, enabledMethods = null) => {
    const stripeConfig = paymentConfig.stripe_configuration
    //TODO:  here we are assuming that all the element types use the same account id?  Do that?
    
    const availableTypes = enabledMethods || paymentConfig.element_types || ['card']
    
    return availableTypes.map(elementType => ({
        paymentMethodType: elementType,
        accountId: stripeConfig.account_id,
        paymentModes: paymentConfig.checkout_behavior.multi_step_checkout 
            ? ['Multistep'] 
            : ['Singlestep'],
    }))
}

/**
 * Creates payment methods for express checkout flow (Apple Pay, Google Pay, etc.)
 */
const createExpressPaymentMethods = (paymentConfig, enabledMethods = null) => {
    const stripeConfig = paymentConfig.stripe_configuration
    
    // Express payment methods typically excluded from regular checkout
    const expressTypes = enabledMethods || ['applepay', 'googlepay', 'paypalexpress']
    
    // Filter out methods that are explicitly excluded
    const availableExpressMethods = expressTypes.filter(type => 
        !paymentConfig.exclude?.includes(type)
    )
    
    return availableExpressMethods.map(paymentType => ({
        paymentMethodType: paymentType,
        accountId: stripeConfig.account_id,
        paymentModes: ['Singlestep'], // Express payments are typically single-step
    }))
}

/**
 * Creates payment method set accounts from config
 */
const createAccounts = (paymentConfig) => {
    const stripeConfig = paymentConfig.stripe_configuration
    
    if (!stripeConfig) {
        throw new Error('No Stripe configuration found')
    }

    return [{
        accountId: stripeConfig.account_id,
        gatewayId: generateGatewayId(stripeConfig.account_id),
        vendor: 'Stripe',
        config: {
            key: stripeConfig.publishable_key,
        },
    }]
}

/**
 * Gets country code from basket data
 */
const getCountryCode = (basket) => {
    return basket?.billingAddress?.countryCode || 
           basket?.shipments?.[0]?.shippingAddress?.countryCode || 
           'US'
}

// Helper functions
const generatePaymentSetId = () => {
    return `pms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

const generateGatewayId = (accountId) => {
    return `gw_${accountId.replace('acct_', '')}`
}

/**
 * Creates payment request info from basket data
 */
export const createPaymentRequestInfo = (basket, locale = 'en-US') => {
    return {
        amount: basket?.orderTotal || basket?.productTotal || 0,
        currency: basket?.currency || 'USD',
        country: basket?.billingAddress?.countryCode || 
                basket?.shipments?.[0]?.shippingAddress?.countryCode || 
                'US',
        locale: locale
    }
}

/**
 * Creates SFP configuration with theme, actions, and options
 */
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
            createIntentFunction: createIntentFunction || function () {
                // TODO: Implement payment intent creation
                throw new Error('createIntentFunction not implemented')
            },
            updateIntentFunction: updateIntentFunction || function () {
                // TODO: Implement payment intent update  
                throw new Error('updateIntentFunction not implemented')
            }
        },
        options: {
            useManualCapture: !paymentConfig.card_capture_automatic
        }
    }
}

/**
 * Creates all parameters needed for sfpInstance.checkout()
 */
export const createCheckoutParameters = (sfpInstance, metadata, paymentConfig, basket, options = {}) => {
    const {
        locale = 'en-US',
        paymentFlow = 'checkout',
        elementId = 'salesforce-payments-element',
        createIntentFunction,
        updateIntentFunction,
        customTheme = {},
        enabledMethods = null
    } = options

    // Get the DOM element
    const paymentSheetElement = document.getElementById(elementId)
    if (!paymentSheetElement) {
        throw new Error(`Payment element with ID '${elementId}' not found`)
    }

    return {
        metadata,
        paymentMethodSetForCheckout: createPaymentMethodSet(paymentConfig, basket, {
            paymentFlow,
            locale,
            enabledMethods
        }),
        config: createSFPConfig(paymentConfig, {
            createIntentFunction,
            updateIntentFunction,
            customTheme
        }),
        paymentRequestInfo: createPaymentRequestInfo(basket, locale),
        paymentSheetElement
    }
}