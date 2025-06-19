/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * Mock Address Service
 * Temporarily simulates Google Places API for address autocomplete  
 */

// Sample address data structured like Google Places API
const MOCK_ADDRESSES = [
    {
        id: 'addr_1',
        address: '123 Main Street, New York, NY 10001, USA',
        mainText: '123 Main Street',
        secondaryText: 'New York, NY 10001, USA',
        country: 'US'
    },
    {
        id: 'addr_2',
        address: '456 Oak Avenue, Los Angeles, CA 90210, USA',
        mainText: '456 Oak Avenue',
        secondaryText: 'Los Angeles, CA 90210, USA',
        country: 'US'
    },
    {
        id: 'addr_3',
        address: '789 Pine Road, Chicago, IL 60601, USA',
        mainText: '789 Pine Road',
        secondaryText: 'Chicago, IL 60601, USA',
        country: 'US'
    },
    {
        id: 'addr_4',
        address: '321 Elm Street, Miami, FL 33101, USA',
        mainText: '321 Elm Street',
        secondaryText: 'Miami, FL 33101, USA',
        country: 'US'
    },
    {
        id: 'addr_5',
        address: '654 Cedar Lane, Seattle, WA 98101, USA',
        mainText: '654 Cedar Lane',
        secondaryText: 'Seattle, WA 98101, USA',
        country: 'US'
    },
    {
        id: 'addr_6',
        address: '987 Maple Drive, Austin, TX 78701, USA',
        mainText: '987 Maple Drive',
        secondaryText: 'Austin, TX 78701, USA',
        country: 'US'
    },
    {
        id: 'addr_7',
        address: '147 Broadway, New York, NY 10038, USA',
        mainText: '147 Broadway',
        secondaryText: 'New York, NY 10038, USA',
        country: 'US'
    },
    {
        id: 'addr_8',
        address: '258 Market Street, San Francisco, CA 94102, USA',
        mainText: '258 Market Street',
        secondaryText: 'San Francisco, CA 94102, USA',
        country: 'US'
    },
    {
        id: 'addr_9',
        address: '369 State Street, Boston, MA 02101, USA',
        mainText: '369 State Street',
        secondaryText: 'Boston, MA 02101, USA',
        country: 'US'
    },
    {
        id: 'addr_10',
        address: '159 Washington Avenue, Philadelphia, PA 19101, USA',
        mainText: '159 Washington Avenue',
        secondaryText: 'Philadelphia, PA 19101, USA',
        country: 'US'
    },
    {
        id: 'addr_11',
        address: '42 Wallaby Way, Sydney, NSW 2000, Australia',
        mainText: '42 Wallaby Way',
        secondaryText: 'Sydney, NSW 2000, Australia',
        country: 'AU'
    },
    {
        id: 'addr_12',
        address: '221B Baker Street, London, UK NW1 6XE',
        mainText: '221B Baker Street',
        secondaryText: 'London, UK NW1 6XE',
        country: 'GB'
    },
    {
        id: 'addr_13',
        address: '1600 Pennsylvania Avenue NW, Washington, DC 20500, USA',
        mainText: '1600 Pennsylvania Avenue NW',
        secondaryText: 'Washington, DC 20500, USA',
        country: 'US'
    },
    {
        id: 'addr_14',
        address: '1 Infinite Loop, Cupertino, CA 95014, USA',
        mainText: '1 Infinite Loop',
        secondaryText: 'Cupertino, CA 95014, USA',
        country: 'US'
    },
    {
        id: 'addr_15',
        address: '350 Fifth Avenue, New York, NY 10118, USA',
        mainText: '350 Fifth Avenue',
        secondaryText: 'New York, NY 10118, USA',
        country: 'US'
    },
    {
        id: 'addr_16',
        address: '1234 Tech Boulevard, San Jose, CA 95113, USA',
        mainText: '1234 Tech Boulevard',
        secondaryText: 'San Jose, CA 95113, USA',
        country: 'US'
    },
    {
        id: 'addr_17',
        address: '567 Innovation Drive, Mountain View, CA 94043, USA',
        mainText: '567 Innovation Drive',
        secondaryText: 'Mountain View, CA 94043, USA',
        country: 'US'
    },
    {
        id: 'addr_18',
        address: '890 Startup Circle, Palo Alto, CA 94301, USA',
        mainText: '890 Startup Circle',
        secondaryText: 'Palo Alto, CA 94301, USA',
        country: 'US'
    },
    {
        id: 'addr_19',
        address: '234 Venture Way, Menlo Park, CA 94025, USA',
        mainText: '234 Venture Way',
        secondaryText: 'Menlo Park, CA 94025, USA',
        country: 'US'
    },
    {
        id: 'addr_20',
        address: '789 Silicon Valley Road, Santa Clara, CA 95054, USA',
        mainText: '789 Silicon Valley Road',
        secondaryText: 'Santa Clara, CA 95054, USA',
        country: 'US'
    },
    {
        id: 'addr_21',
        address: '123 Yonge Street, Toronto, ON M5C 1W4, Canada',
        mainText: '123 Yonge Street',
        secondaryText: 'Toronto, ON M5C 1W4, Canada',
        country: 'CA'
    },
    {
        id: 'addr_22',
        address: '456 Robson Street, Vancouver, BC V6B 2A3, Canada',
        mainText: '456 Robson Street',
        secondaryText: 'Vancouver, BC V6B 2A3, Canada',
        country: 'CA'
    },
    {
        id: 'addr_23',
        address: '789 Sainte-Catherine Street, Montreal, QC H3B 1B1, Canada',
        mainText: '789 Sainte-Catherine Street',
        secondaryText: 'Montreal, QC H3B 1B1, Canada',
        country: 'CA'
    }
]

/**
 * Simulates API delay similar to real Google Places API
 * @param {number} delay - Delay in milliseconds
 */
const simulateDelay = (delay = 200) => {
    return new Promise(resolve => setTimeout(resolve, delay))
}

/**
 * Mock function to get address suggestions based on input
 * @param {string} input - User input string
 * @param {string} countryCode - Country code to filter addresses (e.g., 'US', 'UK', 'AU')
 * @returns {Promise<Array>} Array of address suggestions
 */
export const getAddressSuggestions = async (input, countryCode) => {
    // Simulate API delay
    await simulateDelay(300)
    
    // Convert input to lowercase for case-insensitive matching
    const searchTerm = input.toLowerCase().trim()
    
    // Filter addresses that match the input and country
    const filteredAddresses = MOCK_ADDRESSES.filter(address => {
        const fullAddress = address.address.toLowerCase()
        const mainText = address.mainText.toLowerCase()
        const secondaryText = address.secondaryText.toLowerCase()
        
        // Check if address is in the selected country
        const isInSelectedCountry = address.country === countryCode
        
        // Match against full address or main text, and country
        const matchesSearch = fullAddress.includes(searchTerm) || mainText.includes(searchTerm)
        const matches = matchesSearch && isInSelectedCountry
        
        return matches
    })
    
    return filteredAddresses
} 