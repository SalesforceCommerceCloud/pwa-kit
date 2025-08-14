/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const COUNTRY_CODE_MAP = {
    USA: 'US',
    Canada: 'CA'
}

/**
 * Resolve country code from country name
 * @param {string} countryName - Full country name from address
 * @returns {string} Standardized country code
 */
const resolveCountryCode = (countryName) => {
    return COUNTRY_CODE_MAP[countryName] || countryName
}

/**
 * Convert Google Maps API suggestions to our expected format
 * @param {Array} suggestions - Array of suggestions from Google Maps API
 * @returns {Array} Converted suggestions in our expected format
 */
export const convertGoogleMapsSuggestions = (suggestions) => {
    return suggestions.map((suggestion) => ({
        description: suggestion.placePrediction.text.text,
        place_id: suggestion.placePrediction.placeId,
        structured_formatting: {
            main_text:
                suggestion.placePrediction.text.text.split(',')[0] ||
                suggestion.placePrediction.text.text,
            secondary_text: suggestion.placePrediction.text.text
                .split(',')
                .slice(1)
                .join(',')
                .trim()
        },
        terms: suggestion.placePrediction.text.text
            .split(',')
            .map((term) => ({value: term.trim()})),
        placePrediction: suggestion.placePrediction
    }))
}

/**
 * Parse address suggestion data to extract individual address fields
 * @param {Object} suggestion - Address suggestion object from the API
 * @returns {Object} Parsed address fields
 */
export const parseAddressSuggestion = async (suggestion) => {
    const {structured_formatting, terms} = suggestion
    const {main_text, secondary_text} = structured_formatting

    const parsedFields = {
        address1: main_text
    }

    const countryTerm = terms[terms.length - 1]?.value || ''
    parsedFields.countryCode = resolveCountryCode(countryTerm)

    if (!secondary_text) {
        return parsedFields
    }

    /*
     * Parse secondary text to extract city, state, and postal code
     * Format examples:
     * "New York, NY 10001, USA"
     * "Toronto, ON M5C 1W4, Canada"
     * "London, UK NW1 6XE"
     * "New York" (single part)
     */

    const parts = secondary_text.split(',')

    if (parts.length >= 2) {
        // Extract city (first part)
        parsedFields.city = parts[0].trim()

        // Extract state and postal code (second part)
        const statePostalPart = parts[1].trim()

        const statePostalMatch = statePostalPart.match(/^([A-Z]{2})\s+([A-Z0-9\s]+)$/)

        if (statePostalMatch) {
            parsedFields.stateCode = statePostalMatch[1]
            parsedFields.postalCode = statePostalMatch[2].trim()
        } else {
            // If no state/postal pattern, just use the part as state
            parsedFields.stateCode = statePostalPart
        }
    } else if (parts.length === 1) {
        // Single part - could be just city or just state
        const singlePart = parts[0].trim()
        const stateMatch = singlePart.match(/^[A-Z]{2}$/)

        if (stateMatch) {
            parsedFields.stateCode = singlePart
        } else {
            parsedFields.city = singlePart
        }
    }

    return parsedFields
}

/**
 * Extract address fields from Google Maps place and return structured object
 * @param {Object} place - Google Maps place object
 * @returns {Promise<Object>} Structured address fields
 */
export const extractAddressFieldsFromPlace = async (place) => {
    await place.fetchFields({
        fields: ['formattedAddress']
    })

    const formattedAddress = place.formattedAddress || ''

    // Parse the formatted address to extract individual fields
    return parseFormattedAddress(formattedAddress)
}

/**
 * Parse formatted address string to extract individual address fields
 * @param {string} formattedAddress - Full formatted address string
 * @returns {Object} Structured address fields following adr microformat
 */
export const parseFormattedAddress = (formattedAddress) => {
    if (!formattedAddress) {
        return {address1: ''}
    }

    // Split by comma
    const parts = formattedAddress.split(',').map((part) => part.trim())

    // Initialize with microformat structure following adr specification
    const addressFields = {
        'street-address': parts[0] || '', // street-address (adr microformat)
        locality: '', // locality (adr microformat)
        region: '', // region (adr microformat)
        'postal-code': '', // postal-code (adr microformat)
        'country-name': '' // country-name (adr microformat)
    }

    // Map parts to microformat fields based on adr specification
    if (parts.length >= 4) {
        // Format: "123 Main St, New York, NY 10001, USA" OR "123 Main St, New York, CA, USA"
        addressFields['locality'] = parts[1] // City
        const statePostalPart = parts[2]
        const statePostalSplit = statePostalPart.split(' ')

        if (statePostalSplit.length >= 2) {
            // Has both state and postal code
            addressFields['region'] = statePostalSplit[0] // State (first part)
            addressFields['postal-code'] = statePostalSplit.slice(1).join(' ') // Postal code
        } else {
            // Just state code
            addressFields['region'] = statePostalPart
        }
        addressFields['country-name'] = parts[3]
    } else if (parts.length === 3) {
        // Format: "123 Main St, New York, NY" or "123 Main St, New York, USA"
        addressFields['locality'] = parts[1]
        const lastPart = parts[2]

        if (COUNTRY_CODE_MAP[lastPart]) {
            addressFields['country-name'] = lastPart
        } else {
            // Parse state and postal code
            const statePostalSplit = lastPart.split(' ')
            if (statePostalSplit.length >= 2) {
                addressFields['region'] = statePostalSplit[0]
                addressFields['postal-code'] = statePostalSplit.slice(1).join(' ')
            } else {
                addressFields['region'] = lastPart
            }
        }
    } else if (parts.length === 2) {
        // Format: "123 Main St, New York"
        addressFields['locality'] = parts[1]
    }

    // Convert microformat fields to expected format
    return {
        address1: addressFields['street-address'],
        city: addressFields['locality'],
        stateCode: addressFields['region'],
        postalCode: addressFields['postal-code'],
        countryCode: resolveCountryCode(addressFields['country-name'])
    }
}

/**
 * Set address field values in form
 * @param {Function} setValue - Form setValue function
 * @param {string} prefix - Field prefix
 * @param {Object} addressFields - Address fields object
 */
export const setAddressFieldValues = (setValue, prefix, addressFields) => {
    setValue(`${prefix}address1`, addressFields.address1)
    if (addressFields.city) {
        setValue(`${prefix}city`, addressFields.city)
    }
    if (addressFields.stateCode) {
        setValue(`${prefix}stateCode`, addressFields.stateCode)
    }
    if (addressFields.postalCode) {
        setValue(`${prefix}postalCode`, addressFields.postalCode)
    }
    if (addressFields.countryCode) {
        setValue(`${prefix}countryCode`, addressFields.countryCode)
    }
}

/**
 * Process address suggestion and extract structured address fields
 * This unified method handles both placePrediction.toPlace() and fallback scenarios
 * @param {Object} suggestion - Address suggestion object from the API
 * @returns {Promise<Object>} Structured address fields
 */
export const processAddressSuggestion = async (suggestion) => {
    let addressFields

    // If we have the placePrediction, get detailed place information using toPlace()
    if (suggestion.placePrediction) {
        const place = suggestion.placePrediction.toPlace()
        addressFields = await extractAddressFieldsFromPlace(place)
    } else {
        // Fallback to parsing from structured_formatting when placePrediction is not available
        addressFields = await parseAddressSuggestion(suggestion)
    }

    return addressFields
}
