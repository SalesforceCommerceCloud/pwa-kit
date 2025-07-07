/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {mockAddresses} from './mock-address-suggestions'

describe('Mock Address Suggestions', () => {
    it('should export mockAddresses array', () => {
        expect(Array.isArray(mockAddresses)).toBe(true)
        expect(mockAddresses.length).toBeGreaterThan(0)
    })

    it('should have correct structure for each address', () => {
        mockAddresses.forEach((address) => {
            expect(address).toHaveProperty('description')
            expect(address).toHaveProperty('place_id')
            expect(address).toHaveProperty('structured_formatting')
            expect(address).toHaveProperty('terms')
            expect(address).toHaveProperty('types')
            expect(address.structured_formatting).toHaveProperty('main_text')
            expect(address.structured_formatting).toHaveProperty('secondary_text')
        })
    })

    it('should have unique place_ids for each address', () => {
        const placeIds = mockAddresses.map((address) => address.place_id)
        const uniquePlaceIds = new Set(placeIds)
        expect(uniquePlaceIds.size).toBe(mockAddresses.length)
    })

    it('should have valid country codes', () => {
        const validCountryCodes = ['US', 'CA', 'AU', 'GB']
        mockAddresses.forEach((address) => {
            // For UK, check if any term is 'UK', for others use the last term
            const hasUK = address.terms.some(term => term.value === 'UK')
            let countryCode
            if (hasUK) {
                countryCode = 'GB'
            } else {
                const countryTerm = address.terms[address.terms.length - 1]?.value || ''
                countryCode = countryTerm === 'USA' ? 'US' : 
                              countryTerm === 'Australia' ? 'AU' : 
                              countryTerm === 'Canada' ? 'CA' : countryTerm
            }
            expect(validCountryCodes).toContain(countryCode)
        })
    })

    it('should have US addresses', () => {
        const usAddresses = mockAddresses.filter((address) => {
            const countryTerm = address.terms[address.terms.length - 1]?.value || ''
            return countryTerm === 'USA'
        })
        expect(usAddresses.length).toBeGreaterThan(0)
    })

    it('should have Canadian addresses', () => {
        const caAddresses = mockAddresses.filter((address) => {
            const countryTerm = address.terms[address.terms.length - 1]?.value || ''
            return countryTerm === 'Canada'
        })
        expect(caAddresses.length).toBeGreaterThan(0)
    })

    it('should have Australian addresses', () => {
        const auAddresses = mockAddresses.filter((address) => {
            const countryTerm = address.terms[address.terms.length - 1]?.value || ''
            return countryTerm === 'Australia'
        })
        expect(auAddresses.length).toBeGreaterThan(0)
    })

    it('should have UK addresses', () => {
        const gbAddresses = mockAddresses.filter((address) => {
            return address.terms.some(term => term.value === 'UK')
        })
        expect(gbAddresses.length).toBeGreaterThan(0)
    })

    it('should have valid address format', () => {
        mockAddresses.forEach((address) => {
            // Accept both standard and UK formats
            const standardFormat = /^.+,\s*.+,\s*.+,\s*.+$/
            const ukFormat = /^.+,\s*.+,\s*UK .+$/
            expect(
                standardFormat.test(address.description) || ukFormat.test(address.description)
            ).toBe(true)
        })
    })

    it('should have main_text that is part of the full description', () => {
        mockAddresses.forEach((address) => {
            expect(address.description).toContain(address.structured_formatting.main_text)
        })
    })

    it('should have secondary_text that is part of the full description', () => {
        mockAddresses.forEach((address) => {
            expect(address.description).toContain(address.structured_formatting.secondary_text)
        })
    })
}) 