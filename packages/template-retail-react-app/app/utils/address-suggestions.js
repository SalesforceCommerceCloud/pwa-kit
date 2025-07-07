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

import {mockAddresses} from '@salesforce/retail-react-app/app/mocks/mock-address-suggestions'

// Constants
const API_DELAY_MS = 300

/**
 * Simulates API delay similar to real Google Places API
 * @param {number} delay - Delay in milliseconds
 */
const simulateDelay = (delay = API_DELAY_MS) => {
    return new Promise((resolve) => setTimeout(resolve, delay))
}

/**
 * Mock function to get address suggestions based on input
 * @param {string} input - User input string
 * @param {string} countryCode - Country code to filter addresses (e.g., 'US', 'UK', 'AU')
 * @returns {Promise<Array>} Array of address suggestions
 */
export const getAddressSuggestions = async (input, countryCode) => {
    // Simulate API delay
    await simulateDelay()

    // Convert input to lowercase for case-insensitive matching
    const searchTerm = input.toLowerCase().trim()

    // Filter addresses that match the input and country
    const filteredAddresses = mockAddresses.filter((address) => {
        const description = address.description.toLowerCase()
        const mainText = address.structured_formatting.main_text.toLowerCase()
        const secondaryText = address.structured_formatting.secondary_text.toLowerCase()

        // Extract country from the last term (country is always the last term)
        const countryTerm = address.terms[address.terms.length - 1]?.value || ''
        const isInSelectedCountry =
            countryTerm === countryCode ||
            (countryCode === 'US' && countryTerm === 'USA') ||
            (countryCode === 'GB' && countryTerm === 'UK') ||
            (countryCode === 'CA' && countryTerm === 'Canada')

        // Match against description, main text, or secondary text, and country
        const matchesSearch =
            description.includes(searchTerm) ||
            mainText.includes(searchTerm) ||
            secondaryText.includes(searchTerm)
        const matches = matchesSearch && isInSelectedCountry

        return matches
    })

    return filteredAddresses
}

/**
 * Parse address suggestion data to extract individual address fields
 * @param {Object} suggestion - Address suggestion object from the API
 * @returns {Object} Parsed address fields
 */
export const parseAddressSuggestion = (suggestion) => {
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
    } else if (countryTerm === 'UK') {
        parsedFields.countryCode = 'GB'
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
