/**
 * Maps Commerce Cloud address to SFP address details format
 * @param {Object} address - Commerce Cloud address object
 * @param {Object} options - Additional options for mapping
 * @returns {Object} SFP-formatted address details
 */
const mapAddressToSFPFormat = (address, options = {}) => {
    if (!address) return { address: {} }
    
    const details = {
        address: {}
    }

    // Name and contact info
    if (address.fullName) {
        details.name = address.fullName
    }
    if (address.phone) {
        details.phone = address.phone
    }
    
    // Additional fields from options (for customer email, etc.)
    if (options.email) {
        details.email = options.email
    }
    if (options.name && !details.name) {
        details.name = options.name
    }

    // Address fields
    if (address.address1) {
        details.address.line1 = address.address1
    }
    if (address.address2) {
        details.address.line2 = address.address2
    }
    if (address.city) {
        details.address.city = address.city
    }
    if (address.stateCode) {
        details.address.state = address.stateCode
    }
    if (address.postalCode) {
        details.address.postal_code = address.postalCode
    }

    if (address.countryCode) {
        // Handle both direct string and object formats
        details.address.country = typeof address.countryCode === 'string' 
        ? address.countryCode 
        : address.countryCode.value || address.countryCode
    }

    return details
}

/**
 * Gets billing details from Commerce Cloud basket
 * @param {Object} basket - Commerce Cloud basket object
 * @returns {Object} SFP-formatted billing details
 */
export const getBillingDetails = (basket) => {
    return mapAddressToSFPFormat(basket?.billingAddress, {
        // ✅ Pass additional customer info for billing
        email: basket?.customerInfo?.email,
        name: basket?.billingAddress.fullName // Fallback if billingAddress.fullName is empty
    })
}

/**
 * Gets shipping details from Commerce Cloud basket
 * @param {Object} basket - Commerce Cloud basket object
 * @returns {Object} SFP-formatted shipping details
 */
export const getShippingDetails = (basket) => {
    const shippingAddress = basket?.shipments?.[0]?.shippingAddress
    return mapAddressToSFPFormat(shippingAddress)
}

/**
 * Gets both billing and shipping details from Commerce Cloud basket
 * @param {Object} basket - Commerce Cloud basket object
 * @returns {Object} Object containing both billing and shipping details
 */
export const getAddressDetails = (basket) => {
    return {
        billing: getBillingDetails(basket),
        shipping: getShippingDetails(basket)
    }
}

// Add this after line 19 and before the existing functions

/**
 * Splits a full name into first and last name
 * @param {string} fullName - The full name to split
 * @returns {Object} Object with firstName and lastName properties
 */
export const splitFullName = (fullName) => {
    if (!fullName || typeof fullName !== 'string') {
        return { firstName: 'Express', lastName: 'User' }
    }
    
    const nameParts = fullName.trim().split(/\s+/)
    
    if (nameParts.length === 0) {
        return { firstName: 'Express', lastName: 'User' }
    } else if (nameParts.length === 1) {
        return { firstName: nameParts[0], lastName: '' }
    } else {
        return {
            firstName: nameParts[0],
            lastName: nameParts.slice(1).join(' ')
        }
    }
}


/**
 * Maps SFP payment details (from wallet) to Commerce Cloud address format
 * @param {Object} paymentDetails - Payment details from SFP wallet (Apple Pay, Google Pay, etc.)
 * @returns {Object} Object with billing and shipping addresses in Commerce Cloud format
 */
export const mapWalletToCommerceAddresses = (paymentDetails) => {
    const result = {}
    
    // Map billing address
    if (paymentDetails?.billingDetails) {
        const billing = paymentDetails.billingDetails
        const { firstName, lastName } = splitFullName(billing.name)
        
        result.billingAddress = {
            firstName,
            lastName,
            address1: billing.address?.line1 || '',
            address2: billing.address?.line2 || '',
            city: billing.address?.city || '',
            stateCode: billing.address?.state || '',
            postalCode: billing.address?.postalCode || '',
            countryCode: billing.address?.country || 'US',
            phone: billing.phone || '',
            email: billing.email || ''
        }
    }
    
    // Map shipping address
    if (paymentDetails?.shippingDetails) {
        const shipping = paymentDetails.shippingDetails
        const { firstName, lastName } = splitFullName(shipping.name)
        
        result.shippingAddress = {
            firstName,
            lastName,
            address1: shipping.address?.line1 || '',
            address2: shipping.address?.line2 || '',
            city: shipping.address?.city || '',
            stateCode: shipping.address?.state || '',
            postalCode: shipping.address?.postalCode || '',
            countryCode: shipping.address?.country || 'US'
        }
    }
    
    return result
}