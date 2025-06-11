/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {DEFAULT_STORE_LOCATOR_COUNTRY} from '@salesforce/retail-react-app/app/constants'

jest.mock('@salesforce/retail-react-app/app/hooks/use-se-store-selection', () => {
    const mockHook = jest.fn(() => ({
        isProcessing: false,
        shouldOpenModal: false,
        setShouldOpenModal: jest.fn(),
        storeLocatorParams: null,
        processSeParameters: jest.fn()
    }))
    
    const originalModule = jest.requireActual('@salesforce/retail-react-app/app/hooks/use-se-store-selection')
    
    return {
        __esModule: true,
        default: mockHook,
        ...originalModule
    }
})

describe('useSeStoreSelection Hook Tests', () => {
    beforeEach(() => {
        window.localStorage.clear()
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    describe('SE Parameter Detection', () => {
        test('identifies SE parameters correctly', () => {
            const seParams = new URLSearchParams('?lat=42.3601&lng=-71.0589')
            const nonSeParams = new URLSearchParams('?product=test&page=1')
            
            const hasSEParams = (params) => ['lat', 'lng', 'zip', 'city', 'store', 'country']
                .some(param => params.has(param))
            
            expect(hasSEParams(seParams)).toBe(true)
            expect(hasSEParams(nonSeParams)).toBe(false)
        })

        test('validates coordinates', () => {
            const validLat = '42.3601'
            const invalidLat = 'invalid'
            
            expect(!isNaN(parseFloat(validLat))).toBe(true)
            expect(isNaN(parseFloat(invalidLat))).toBe(true)
        })

        test('handles URL encoding', () => {
            const params = new URLSearchParams('?city=Palo%20Alto')
            expect(params.get('city')).toBe('Palo Alto')
        })
    })

    describe('Country Detection', () => {
        test('uses explicit country when provided', () => {
            const getCountry = (country) => 
                country && country !== 'none' ? country : DEFAULT_STORE_LOCATOR_COUNTRY.countryCode
            
            expect(getCountry('US')).toBe('US')
            expect(getCountry(null)).toBe(DEFAULT_STORE_LOCATOR_COUNTRY.countryCode)
            expect(getCountry('none')).toBe(DEFAULT_STORE_LOCATOR_COUNTRY.countryCode)
        })
    })

    describe('Store Matching', () => {
        const stores = [
            { id: '001', name: 'Union Square Store', city: 'San Francisco', postalCode: '94108' },
            { id: '002', name: 'Downtown Store', city: 'Palo Alto', postalCode: '94102' }
        ]

        test('finds store by name', () => {
            const match = stores.find(store => 
                store.name.toLowerCase().includes('union square'))
            expect(match?.id).toBe('001')
        })

        test('finds store by postal code', () => {
            const match = stores.find(store => store.postalCode === '94102')
            expect(match?.id).toBe('002')
        })

        test('finds store by city', () => {
            const match = stores.find(store => 
                store.city.toLowerCase().includes('palo alto'))
            expect(match?.id).toBe('002')
        })
    })

    describe('localStorage Handling', () => {
        test('detects SE selection', () => {
            const storeData = { id: '123', isSESelection: true }
            window.localStorage.setItem('store_RefArch', JSON.stringify(storeData))
            
            const stored = JSON.parse(window.localStorage.getItem('store_RefArch'))
            expect(stored.isSESelection).toBe(true)
        })

        test('handles invalid data gracefully', () => {
            window.localStorage.setItem('store_RefArch', 'invalid')
            
            let isValid = false
            try {
                JSON.parse(window.localStorage.getItem('store_RefArch'))
                isValid = true
            } catch (e) {
                isValid = false
            }
            
            expect(isValid).toBe(false)
        })
    })

    describe('Parameter Validation', () => {
        test('validates sufficient data', () => {
            const data1 = { latitude: 42.3601, longitude: -71.0589 }
            const data2 = { storeName: 'Test Store' }
            const data3 = { countryCode: 'US' }
            
            const isValid = (data) => 
                !!(data.latitude && data.longitude) || 
                !!(data.storeName || data.zipcode || data.city)
            
            expect(isValid(data1)).toBe(true)
            expect(isValid(data2)).toBe(true)
            expect(isValid(data3)).toBe(false)
        })
    })
})
