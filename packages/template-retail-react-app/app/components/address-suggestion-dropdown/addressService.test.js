/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {
    getAddressSuggestions,
    parseAddressSuggestion
} from '../../mocks/mockAddressService'

describe('mockAddressService', () => {
    describe('parseAddressSuggestion', () => {
        it('should parse US address correctly', () => {
            const suggestion = {
                mainText: '123 Main Street',
                secondaryText: 'New York, NY 10001, USA',
                country: 'US'
            }

            const result = parseAddressSuggestion(suggestion)

            expect(result).toEqual({
                address1: '123 Main Street',
                countryCode: 'US',
                city: 'New York',
                stateCode: 'NY',
                postalCode: '10001'
            })
        })

        it('should parse Canadian address correctly', () => {
            const suggestion = {
                mainText: '123 Yonge Street',
                secondaryText: 'Toronto, ON M5C 1W4, Canada',
                country: 'CA'
            }

            const result = parseAddressSuggestion(suggestion)

            expect(result).toEqual({
                address1: '123 Yonge Street',
                countryCode: 'CA',
                city: 'Toronto',
                stateCode: 'ON',
                postalCode: 'M5C 1W4'
            })
        })

        it('should parse UK address correctly', () => {
            const suggestion = {
                mainText: '221B Baker Street',
                secondaryText: 'London, UK NW1 6XE',
                country: 'GB'
            }

            const result = parseAddressSuggestion(suggestion)

            expect(result).toEqual({
                address1: '221B Baker Street',
                countryCode: 'GB',
                city: 'London',
                stateCode: 'UK',
                postalCode: 'NW1 6XE'
            })
        })

        it('should handle address without secondary text', () => {
            const suggestion = {
                mainText: '123 Main Street',
                secondaryText: null,
                country: 'US'
            }

            const result = parseAddressSuggestion(suggestion)

            expect(result).toEqual({
                address1: '123 Main Street',
                countryCode: 'US'
            })
        })

        it('should handle address with incomplete secondary text', () => {
            const suggestion = {
                mainText: '123 Main Street',
                secondaryText: 'New York',
                country: 'US'
            }

            const result = parseAddressSuggestion(suggestion)

            expect(result).toEqual({
                address1: '123 Main Street',
                countryCode: 'US',
                city: 'New York'
            })
        })

        it('should handle US address with ZIP+4 format', () => {
            const suggestion = {
                mainText: '1600 Pennsylvania Avenue NW',
                secondaryText: 'Washington, DC 20500-0001, USA',
                country: 'US'
            }

            const result = parseAddressSuggestion(suggestion)

            expect(result).toEqual({
                address1: '1600 Pennsylvania Avenue NW',
                countryCode: 'US',
                city: 'Washington',
                stateCode: 'DC',
                postalCode: '20500-0001'
            })
        })
    })

    describe('getAddressSuggestions', () => {
        it('should return filtered addresses for US', async () => {
            const results = await getAddressSuggestions('main', 'US')

            expect(results).toBeInstanceOf(Array)
            expect(results.length).toBeGreaterThan(0)
            expect(results.every((addr) => addr.country === 'US')).toBe(true)
            expect(
                results.every(
                    (addr) =>
                        addr.address.toLowerCase().includes('main') ||
                        addr.mainText.toLowerCase().includes('main')
                )
            ).toBe(true)
        })

        it('should return filtered addresses for Canada', async () => {
            const results = await getAddressSuggestions('yonge', 'CA')

            expect(results).toBeInstanceOf(Array)
            expect(results.length).toBeGreaterThan(0)
            expect(results.every((addr) => addr.country === 'CA')).toBe(true)
            expect(
                results.every(
                    (addr) =>
                        addr.address.toLowerCase().includes('yonge') ||
                        addr.mainText.toLowerCase().includes('yonge')
                )
            ).toBe(true)
        })

        it('should return empty array for non-matching input', async () => {
            const results = await getAddressSuggestions('nonexistent', 'US')

            expect(results).toEqual([])
        })

        it('should return empty array for input shorter than 3 characters', async () => {
            const results = await getAddressSuggestions('ab', 'US')

            expect(results).toEqual([])
        })

        it('should filter by country correctly', async () => {
            const usResults = await getAddressSuggestions('street', 'US')
            const caResults = await getAddressSuggestions('street', 'CA')

            expect(usResults.every((addr) => addr.country === 'US')).toBe(true)
            expect(caResults.every((addr) => addr.country === 'CA')).toBe(true)
        })
    })
})
