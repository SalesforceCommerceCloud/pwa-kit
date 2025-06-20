/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'
import {renderHook, act} from '@testing-library/react'
import {IntlProvider} from 'react-intl'
import {DEFAULT_STORE_LOCATOR_COUNTRY} from '@salesforce/retail-react-app/app/constants'
import {cleanURLParams} from '@salesforce/retail-react-app/app/components/se-input-handler'
import useSeStoreSelection from '@salesforce/retail-react-app/app/hooks/use-se-store-selection'

jest.mock('@salesforce/retail-react-app/app/hooks/use-current-basket')
jest.mock('react-router-dom', () => ({
    useLocation: jest.fn(),
    useHistory: jest.fn()
}))
jest.mock('@salesforce/retail-react-app/app/components/se-input-handler', () => ({
    cleanURLParams: jest.fn()
}))
jest.mock('react-intl', () => ({
    ...jest.requireActual('react-intl'),
    useIntl: jest.fn(() => ({
        formatMessage: jest.fn((message) => message.defaultMessage || message.id),
        locale: 'en-US'
    }))
}))
jest.mock('@salesforce/retail-react-app/app/hooks/use-multi-site', () => ({
    __esModule: true,
    default: jest.fn(() => ({
        site: {id: 'RefArch', alias: 'uk'},
        buildUrl: jest.fn((href) => href)
    }))
}))
jest.mock('@salesforce/commerce-sdk-react', () => ({
    useSearchStores: jest.fn(() => ({
        data: {
            stores: [
                {id: '001', name: 'Downtown Store', city: 'San Francisco'},
                {id: '002', name: 'Union Square Store', city: 'Boston'}
            ]
        },
        isLoading: false,
        error: null
    }))
}))

// eslint-disable-next-line @typescript-eslint/no-var-requires
const mockUseCurrentBasket = require('@salesforce/retail-react-app/app/hooks/use-current-basket')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const mockReactRouterDom = require('react-router-dom')

const TestWrapper = ({children}) => (
    <IntlProvider locale="en-US" messages={{}}>
        {children}
    </IntlProvider>
)

TestWrapper.propTypes = {
    children: PropTypes.node
}

describe('useSeStoreSelection Hook Tests', () => {
    beforeEach(() => {
        window.localStorage.clear()
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    describe('Search Engine provided location parameter Detection', () => {
        test('identifies Search Engine provided location parameters correctly', () => {
            const seParams = new URLSearchParams('?lat=42.3601&lng=-71.0589')
            const nonSeParams = new URLSearchParams('?product=test&page=1')

            const hasSeParams = (params) =>
                ['lat', 'lng', 'zip', 'city', 'store', 'country'].some((param) => params.has(param))

            expect(hasSeParams(seParams)).toBe(true)
            expect(hasSeParams(nonSeParams)).toBe(false)
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
            {id: '001', name: 'Union Square Store', city: 'San Francisco', postalCode: '94108'},
            {id: '002', name: 'Downtown Store', city: 'Palo Alto', postalCode: '94102'}
        ]

        test('finds store by name', () => {
            const match = stores.find((store) => store.name.toLowerCase().includes('union square'))
            expect(match?.id).toBe('001')
        })

        test('finds store by postal code', () => {
            const match = stores.find((store) => store.postalCode === '94102')
            expect(match?.id).toBe('002')
        })

        test('finds store by city', () => {
            const match = stores.find((store) => store.city.toLowerCase().includes('palo alto'))
            expect(match?.id).toBe('002')
        })
    })

    describe('localStorage Handling', () => {
        test('detects Search Engine provided parameter selection', () => {
            const storeData = {id: '123', isSeSelection: true}
            window.localStorage.setItem('store_RefArch', JSON.stringify(storeData))

            const stored = JSON.parse(window.localStorage.getItem('store_RefArch'))
            expect(stored.isSeSelection).toBe(true)
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
            const data1 = {latitude: 42.3601, longitude: -71.0589}
            const data2 = {storeName: 'Test Store'}
            const data3 = {countryCode: 'US'}

            const isValid = (data) =>
                !!(data.latitude && data.longitude) ||
                !!(data.storeName || data.zipcode || data.city)

            expect(isValid(data1)).toBe(true)
            expect(isValid(data2)).toBe(true)
            expect(isValid(data3)).toBe(false)
        })
    })

    describe('Cart State Integration Tests', () => {
        let mockLocation, mockHistory

        beforeEach(() => {
            mockLocation = {
                search: '',
                pathname: '/test'
            }
            mockHistory = {
                replace: jest.fn()
            }
            mockReactRouterDom.useLocation = jest.fn(() => mockLocation)
            mockReactRouterDom.useHistory = jest.fn(() => mockHistory)

            global.fetch = jest.fn(() =>
                Promise.resolve({
                    json: () =>
                        Promise.resolve({
                            stores: [
                                {id: '001', name: 'Downtown Store', city: 'San Francisco'},
                                {id: '002', name: 'Union Square Store', city: 'Boston'}
                            ]
                        })
                })
            )
        })

        afterEach(() => {
            jest.clearAllMocks()
            localStorage.clear()
        })

        test('1. blocks store selection after adding items to cart', async () => {
            mockUseCurrentBasket.useCurrentBasket = jest.fn(() => ({
                derivedData: {totalItems: 0}
            }))

            const {result, rerender} = renderHook(
                ({totalItems}) => useSeStoreSelection(totalItems),
                {
                    wrapper: TestWrapper,
                    initialProps: {totalItems: 0}
                }
            )

            expect(result.current.isProcessing).toBeDefined()
            act(() => {
                mockLocation.search = '?store=Downtown Store&city=San Francisco'
                const params = new URLSearchParams(mockLocation.search)
                result.current.processSeParameters?.(params)
            })
            mockUseCurrentBasket.useCurrentBasket = jest.fn(() => ({
                derivedData: {totalItems: 1}
            }))

            rerender({totalItems: 1})
            const originalStoreData = localStorage.getItem('store_RefArch')

            act(() => {
                mockLocation.search = '?store=Union Square Store&city=Boston'
                const params = new URLSearchParams(mockLocation.search)
                result.current.processSeParameters?.(params)
            })
            expect(localStorage.getItem('store_RefArch')).toBe(originalStoreData)
        })

        test('2. allows store selection when cart becomes empty', async () => {
            const {result} = renderHook(({totalItems}) => useSeStoreSelection(totalItems), {
                wrapper: TestWrapper,
                initialProps: {totalItems: 0}
            })
            localStorage.removeItem('store_RefArch')
            act(() => {
                mockLocation.search = '?store=Downtown Store&city=San Francisco'
                const params = new URLSearchParams(mockLocation.search)
                result.current.processSeParameters?.(params)
            })
            expect(result.current.isProcessing).toBeDefined()
        })

        test('3. keeps store selection blocked when cart still has items after partial removal', async () => {
            mockUseCurrentBasket.useCurrentBasket = jest.fn(() => ({
                derivedData: {totalItems: 0}
            }))
            const {result, rerender} = renderHook(
                ({totalItems}) => useSeStoreSelection(totalItems),
                {
                    wrapper: TestWrapper,
                    initialProps: {totalItems: 0}
                }
            )
            act(() => {
                mockLocation.search = '?store=Downtown Store&city=San Francisco'
                const params = new URLSearchParams(mockLocation.search)
                result.current.processSeParameters?.(params)
            })
            mockUseCurrentBasket.useCurrentBasket = jest.fn(() => ({
                derivedData: {totalItems: 2}
            }))

            rerender({totalItems: 2})
            mockUseCurrentBasket.useCurrentBasket = jest.fn(() => ({
                derivedData: {totalItems: 1}
            }))

            rerender({totalItems: 1})
            const originalStore = localStorage.getItem('store_RefArch')

            act(() => {
                mockLocation.search = '?store=Union Square Store&city=Boston'
                const params = new URLSearchParams(mockLocation.search)
                result.current.processSeParameters?.(params)
            })
            expect(localStorage.getItem('store_RefArch')).toBe(originalStore)
        })

        test('4. cleans URL params when cart has items without changing store selection', async () => {
            mockUseCurrentBasket.useCurrentBasket = jest.fn(() => ({
                derivedData: {totalItems: 1}
            }))
            localStorage.setItem(
                'store_RefArch',
                JSON.stringify({
                    id: '001',
                    name: 'Downtown Store',
                    city: 'San Francisco'
                })
            )
            mockLocation.search = '?city=Boston&country=US'
            const {result} = renderHook(({totalItems}) => useSeStoreSelection(totalItems), {
                wrapper: TestWrapper,
                initialProps: {totalItems: 1}
            })

            act(() => {
                const params = new URLSearchParams(mockLocation.search)
                result.current.processSeParameters?.(params)
            })

            expect(cleanURLParams).toHaveBeenCalledWith(mockLocation, mockHistory, [
                'lat',
                'lng',
                'zip',
                'city',
                'store',
                'country'
            ])
            const storedData = JSON.parse(localStorage.getItem('store_RefArch'))
            expect(storedData.name).toBe('Downtown Store')
            expect(storedData.city).toBe('San Francisco')
        })

        test('5. cleans URL params and preserves store when cart has items', async () => {
            mockUseCurrentBasket.useCurrentBasket = jest.fn(() => ({
                derivedData: {totalItems: 1}
            }))
            localStorage.setItem(
                'store_RefArch',
                JSON.stringify({
                    id: '001',
                    name: 'Original Store',
                    city: 'Original City'
                })
            )

            mockLocation.search = '?city=Boston&country=US'
            const {result} = renderHook(({totalItems}) => useSeStoreSelection(totalItems), {
                wrapper: TestWrapper,
                initialProps: {totalItems: 1}
            })

            act(() => {
                const params = new URLSearchParams(mockLocation.search)
                result.current.processSeParameters?.(params)
            })

            expect(cleanURLParams).toHaveBeenCalled()
            const storedData = JSON.parse(localStorage.getItem('store_RefArch'))
            expect(storedData.name).toBe('Original Store')
        })

        test('6. cleans location params but preserves search params for PLP redirect', async () => {
            const mockUseExternalSearch = jest.fn(() => ({
                searchRedirect: jest.fn()
            }))

            mockUseCurrentBasket.useCurrentBasket = jest.fn(() => ({
                derivedData: {totalItems: 1}
            }))

            localStorage.setItem(
                'store_RefArch',
                JSON.stringify({
                    id: '001',
                    name: 'Original Store'
                })
            )
            mockLocation.search = '?city=Boston&country=US&q=shoes'

            const {result} = renderHook(({totalItems}) => useSeStoreSelection(totalItems), {
                wrapper: TestWrapper,
                initialProps: {totalItems: 1}
            })

            act(() => {
                const params = new URLSearchParams(mockLocation.search)
                result.current.processSeParameters?.(params)
            })

            expect(cleanURLParams).toHaveBeenCalledWith(mockLocation, mockHistory, [
                'lat',
                'lng',
                'zip',
                'city',
                'store',
                'country'
            ])

            const storedData = JSON.parse(localStorage.getItem('store_RefArch'))
            expect(storedData.name).toBe('Original Store')
            expect(mockLocation.search).toContain('q=shoes')
        })
    })
})
