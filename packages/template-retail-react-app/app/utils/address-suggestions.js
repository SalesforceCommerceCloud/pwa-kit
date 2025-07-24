/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * Address Suggestions Utility Functions
 * Functions for handling address autocomplete functionality
 */

import {mockAddresses} from '../mocks/mock-address-suggestions'

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
        placePrediction: suggestion.placePrediction // Keep original for detailed place fetching
    }))
}

/**
 * Mock function to get address suggestions based on input
 * @param {string} input - User input string
 * @param {string} countryCode - Country code to filter addresses (e.g., 'US', 'UK', 'AU')
 * @returns {Promise<Array>} Array of address suggestions
 */
export const getAddressSuggestions = async (input, countryCode) => {
    // Filter by country if specified
    if (countryCode) {
        return mockAddresses.filter((suggestion) => {
            const description = suggestion.description.toLowerCase()
            if (countryCode === 'US') {
                return description.includes('usa')
            } else if (countryCode === 'CA') {
                return description.includes('canada')
            }
            return true
        })
    }

    return mockAddresses
}

/**
 * Parse address suggestion data to extract individual address fields
 * @param {Object} suggestion - Address suggestion object from the API
 * @returns {Object} Parsed address fields
 */
export const parseAddressSuggestion = async (suggestion) => {
    const {structured_formatting, terms} = suggestion
    const {main_text, secondary_text} = structured_formatting

    // Initialize parsed fields
    const parsedFields = {
        address1: main_text
    }

    // Extract country code from the last term
    const countryTerm = terms[terms.length - 1]?.value || ''
    if (countryTerm === 'USA') {
        parsedFields.countryCode = 'US'
    } else if (countryTerm === 'Canada') {
        parsedFields.countryCode = 'CA'
    } else {
        parsedFields.countryCode = countryTerm
    }

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
 * @returns {Object} Structured address fields
 */
export const parseFormattedAddress = (formattedAddress) => {
    if (!formattedAddress) {
        return {address1: ''}
    }

    const parts = formattedAddress.split(', ')
    const addressFields = {}

    if (parts.length >= 4) {
        // Format: "123 Main St, New York, NY 10001, USA" OR "123 Main St, New York, CA, USA"
        addressFields.address1 = parts[0] // Street address
        addressFields.city = parts[1] // City

        // Parse state and postal code from the third part
        const statePostalPart = parts[2]
        // Updated regex to better handle postal codes with spaces
        const statePostalMatch = statePostalPart.match(/^([A-Z]{2})\s+([A-Z0-9\s]+)$/)

        if (statePostalMatch) {
            // Format: "NY 10001" - has postal code
            addressFields.stateCode = statePostalMatch[1]
            addressFields.postalCode = statePostalMatch[2].trim()
        } else {
            // Format: "CA" - just state code, no postal code
            const stateMatch = statePostalPart.match(/^([A-Z]{2})$/)
            if (stateMatch) {
                addressFields.stateCode = stateMatch[1]
                // No postal code available in this format
            } else {
                addressFields.stateCode = statePostalPart
            }
        }

        // Parse country from the last part
        const countryPart = parts[3]
        if (countryPart === 'USA') {
            addressFields.countryCode = 'US'
        } else if (countryPart === 'Canada') {
            addressFields.countryCode = 'CA'
        } else {
            addressFields.countryCode = countryPart
        }
    } else if (parts.length === 3) {
        // Format: "123 Main St, New York, NY" or "123 Main St, New York, USA"
        addressFields.address1 = parts[0]
        addressFields.city = parts[1]

        const lastPart = parts[2]
        if (lastPart === 'USA' || lastPart === 'Canada') {
            addressFields.countryCode = lastPart === 'USA' ? 'US' : 'CA'
        } else {
            // Try to parse state and postal code from the last part
            const statePostalMatch = lastPart.match(/^([A-Z]{2})\s+([A-Z0-9\s]+)$/)
            if (statePostalMatch) {
                addressFields.stateCode = statePostalMatch[1]
                addressFields.postalCode = statePostalMatch[2].trim()
            } else {
                // Assume it's just a state code
                addressFields.stateCode = lastPart
            }
        }
    } else if (parts.length === 2) {
        // Format: "123 Main St, New York"
        addressFields.address1 = parts[0]
        addressFields.city = parts[1]
    } else {
        // Single part - just the street address
        addressFields.address1 = formattedAddress
    }

    return addressFields
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
