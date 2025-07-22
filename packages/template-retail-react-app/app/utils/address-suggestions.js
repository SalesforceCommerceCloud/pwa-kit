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

/**
 * Mock function to get address suggestions based on input
 * @param {string} input - User input string
 * @param {string} countryCode - Country code to filter addresses (e.g., 'US', 'UK', 'AU')
 * @returns {Promise<Array>} Array of address suggestions
 */
export const getAddressSuggestions = async (input, countryCode) => {
    // Mock data for testing
    const mockSuggestions = [
        {
            description: '123 Main St, New York, NY 10001, USA',
            place_id: 'mock_1',
            structured_formatting: {
                main_text: '123 Main St',
                secondary_text: 'New York, NY 10001, USA'
            },
            terms: [
                {value: '123 Main St'},
                {value: 'New York'},
                {value: 'NY'},
                {value: '10001'},
                {value: 'USA'}
            ]
        },
        {
            description: '456 Oak Ave, Toronto, ON M5C 1W4, Canada',
            place_id: 'mock_2',
            structured_formatting: {
                main_text: '456 Oak Ave',
                secondary_text: 'Toronto, ON M5C 1W4, Canada'
            },
            terms: [
                {value: '456 Oak Ave'},
                {value: 'Toronto'},
                {value: 'ON'},
                {value: 'M5C 1W4'},
                {value: 'Canada'}
            ]
        }
    ]

    // Filter by country if specified
    if (countryCode) {
        return mockSuggestions.filter((suggestion) => {
            const description = suggestion.description.toLowerCase()
            if (countryCode === 'US') {
                return description.includes('usa')
            } else if (countryCode === 'CA') {
                return description.includes('canada')
            }
            return true
        })
    }

    return mockSuggestions
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
