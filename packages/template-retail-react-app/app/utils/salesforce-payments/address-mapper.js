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
        email: basket?.customerEmail,
        name: basket?.customerName  // Fallback if billingAddress.fullName is empty
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