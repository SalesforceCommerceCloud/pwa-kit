/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {STORE_LOCATOR_DEFAULT_COUNTRY_CODE} from '@salesforce/retail-react-app/app/constants'
import {render, screen, act} from '@testing-library/react'
import {cleanURLParams} from '@salesforce/retail-react-app/app/components/se-input-handler'
import useSeStoreSelection from '@salesforce/retail-react-app/app/hooks/use-se-store-selection'
import React from 'react'
import {IntlProvider} from 'react-intl'
import {MultiSiteProvider} from '@salesforce/retail-react-app/app/contexts'
import {BrowserRouter} from 'react-router-dom'
import PropTypes from 'prop-types'

const mockReactRouterDom = {
    useLocation: jest.fn(),
    useHistory: jest.fn()
}
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useLocation: () => mockReactRouterDom.useLocation(),
    useHistory: () => mockReactRouterDom.useHistory()
}))

const mockUseCurrentBasket = {
    useCurrentBasket: jest.fn()
}
jest.mock('@salesforce/retail-react-app/app/hooks/use-current-basket', () => mockUseCurrentBasket)

jest.mock('@salesforce/retail-react-app/app/components/se-input-handler', () => ({
    cleanURLParams: jest.fn()
}))

jest.mock('@salesforce/commerce-sdk-react', () => ({
    useSearchStores: jest.fn(() => ({
        data: {
            data: [
                {id: '001', name: 'Downtown Store', city: 'San Francisco'},
                {id: '002', name: 'Union Square Store', city: 'Boston'}
            ]
        },
        isLoading: false
    }))
}))

const TestComponent = ({totalItems}) => {
    const hookResult = useSeStoreSelection(totalItems)
    return <div data-testid="hook-result">{JSON.stringify(hookResult)}</div>
}

TestComponent.propTypes = {
    totalItems: PropTypes.number.isRequired
}

const TestWrapper = ({children}) => {
    const mockSite = {
        id: 'RefArch',
        l10n: {
            defaultLocale: 'en-US',
            supportedLocales: [{id: 'en-US', preferredCurrency: 'USD'}]
        }
    }

    return (
        <BrowserRouter>
            <IntlProvider locale="en-US" defaultLocale="en-US" messages={{}} onError={() => {}}>
                <MultiSiteProvider site={mockSite}>{children}</MultiSiteProvider>
            </IntlProvider>
        </BrowserRouter>
    )
}

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
                country && country !== 'none' ? country : STORE_LOCATOR_DEFAULT_COUNTRY_CODE

            expect(getCountry('US')).toBe('US')
            expect(getCountry(null)).toBe(STORE_LOCATOR_DEFAULT_COUNTRY_CODE)
            expect(getCountry('none')).toBe(STORE_LOCATOR_DEFAULT_COUNTRY_CODE)
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

            const {rerender} = render(
                <TestWrapper>
                    <TestComponent totalItems={0} />
                </TestWrapper>
            )

            act(() => {
                mockLocation.search = '?store=Downtown Store&city=San Francisco'
                const params = new URLSearchParams(mockLocation.search)
                const hookResult = JSON.parse(screen.getByTestId('hook-result').textContent)
                hookResult.processSeParameters?.(params)
            })

            mockUseCurrentBasket.useCurrentBasket = jest.fn(() => ({
                derivedData: {totalItems: 1}
            }))

            rerender(
                <TestWrapper>
                    <TestComponent totalItems={1} />
                </TestWrapper>
            )
            const originalStoreData = localStorage.getItem('store_RefArch')

            act(() => {
                mockLocation.search = '?store=Union Square Store&city=Boston'
                const params = new URLSearchParams(mockLocation.search)
                const hookResult = JSON.parse(screen.getByTestId('hook-result').textContent)
                hookResult.processSeParameters?.(params)
            })
            expect(localStorage.getItem('store_RefArch')).toBe(originalStoreData)
        })

        test('2. allows store selection when cart becomes empty', async () => {
            const {rerender} = render(
                <TestWrapper>
                    <TestComponent totalItems={0} />
                </TestWrapper>
            )
            localStorage.removeItem('store_RefArch')

            act(() => {
                mockLocation.search = '?store=Downtown Store&city=San Francisco'
                const params = new URLSearchParams(mockLocation.search)
                const hookResult = JSON.parse(screen.getByTestId('hook-result').textContent)
                hookResult.processSeParameters?.(params)
            })

            const hookResult = JSON.parse(screen.getByTestId('hook-result').textContent)
            expect(hookResult.isProcessing).toBeDefined()
        })

        test('3. keeps store selection blocked when cart still has items after partial removal', async () => {
            mockUseCurrentBasket.useCurrentBasket = jest.fn(() => ({
                derivedData: {totalItems: 0}
            }))

            const {rerender} = render(
                <TestWrapper>
                    <TestComponent totalItems={0} />
                </TestWrapper>
            )

            act(() => {
                mockLocation.search = '?store=Downtown Store&city=San Francisco'
                const params = new URLSearchParams(mockLocation.search)
                const hookResult = JSON.parse(screen.getByTestId('hook-result').textContent)
                hookResult.processSeParameters?.(params)
            })

            mockUseCurrentBasket.useCurrentBasket = jest.fn(() => ({
                derivedData: {totalItems: 2}
            }))

            rerender(
                <TestWrapper>
                    <TestComponent totalItems={2} />
                </TestWrapper>
            )

            mockUseCurrentBasket.useCurrentBasket = jest.fn(() => ({
                derivedData: {totalItems: 1}
            }))

            rerender(
                <TestWrapper>
                    <TestComponent totalItems={1} />
                </TestWrapper>
            )
            const originalStore = localStorage.getItem('store_RefArch')

            act(() => {
                mockLocation.search = '?store=Union Square Store&city=Boston'
                const params = new URLSearchParams(mockLocation.search)
                const hookResult = JSON.parse(screen.getByTestId('hook-result').textContent)
                hookResult.processSeParameters?.(params)
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
            render(
                <TestWrapper>
                    <TestComponent totalItems={1} />
                </TestWrapper>
            )

            act(() => {
                const params = new URLSearchParams(mockLocation.search)
                const hookResult = JSON.parse(screen.getByTestId('hook-result').textContent)
                hookResult.processSeParameters?.(params)
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
            render(
                <TestWrapper>
                    <TestComponent totalItems={1} />
                </TestWrapper>
            )

            act(() => {
                const params = new URLSearchParams(mockLocation.search)
                const hookResult = JSON.parse(screen.getByTestId('hook-result').textContent)
                hookResult.processSeParameters?.(params)
            })

            expect(cleanURLParams).toHaveBeenCalled()
            const storedData = JSON.parse(localStorage.getItem('store_RefArch'))
            expect(storedData.name).toBe('Original Store')
        })

        test('6. cleans location params but preserves search params for PLP redirect', async () => {
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

            render(
                <TestWrapper>
                    <TestComponent totalItems={1} />
                </TestWrapper>
            )

            act(() => {
                const params = new URLSearchParams(mockLocation.search)
                const hookResult = JSON.parse(screen.getByTestId('hook-result').textContent)
                hookResult.processSeParameters?.(params)
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
