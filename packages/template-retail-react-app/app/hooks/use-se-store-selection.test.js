/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {renderHook, act} from '@testing-library/react'
import useSeStoreSelection from '@salesforce/retail-react-app/app/hooks/use-se-store-selection'
import React from 'react'
import {IntlProvider} from 'react-intl'
import {BrowserRouter} from 'react-router-dom'
import PropTypes from 'prop-types'
import {StoreLocatorContext} from '@salesforce/retail-react-app/app/contexts/store-locator-provider'
import {STORE_LOCATOR_DEFAULT_COUNTRY_CODE} from '../constants'
import {useSearchStores} from '@salesforce/commerce-sdk-react'
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'

jest.mock('@salesforce/commerce-sdk-react', () => ({
    useSearchStores: jest.fn()
}))

jest.mock('@salesforce/retail-react-app/app/hooks/use-current-basket', () => ({
    useCurrentBasket: jest.fn(() => ({
        derivedData: {
            totalItems: 0
        }
    }))
}))

const mockStoreLocatorContext = {
    state: {
        selectedStoreId: null,
        isSeSelection: false,
        mode: 'input',
        formValues: {}
    },
    setState: jest.fn((callback) => {
        const newState =
            typeof callback === 'function' ? callback(mockStoreLocatorContext.state) : callback
        mockStoreLocatorContext.state = {...mockStoreLocatorContext.state, ...newState}
        return mockStoreLocatorContext.state
    })
}

const TestWrapper = ({children}) => (
    <IntlProvider locale="en-US" defaultLocale="en-US">
        <BrowserRouter>
            <StoreLocatorContext.Provider value={mockStoreLocatorContext}>
                {children}
            </StoreLocatorContext.Provider>
        </BrowserRouter>
    </IntlProvider>
)

TestWrapper.propTypes = {
    children: PropTypes.node.isRequired
}

describe('useSeStoreSelection', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockStoreLocatorContext.setState.mockClear()
        mockStoreLocatorContext.state = {
            selectedStoreId: null,
            isSeSelection: false,
            mode: 'input',
            formValues: {}
        }
        useCurrentBasket.mockImplementation(() => ({
            derivedData: {
                totalItems: 0
            }
        }))
        useSearchStores.mockImplementation(() => ({
            data: [],
            isLoading: false,
            error: null
        }))
    })

    test('initializes with default values', () => {
        const {result} = renderHook(() => useSeStoreSelection(), {
            wrapper: TestWrapper
        })

        expect(result.current).toEqual({
            isProcessing: false,
            shouldOpenModal: false,
            setShouldOpenModal: expect.any(Function),
            storeLocatorParams: null,
            processSeParameters: expect.any(Function)
        })
    })

    test('handles coordinate-based search', async () => {
        useSearchStores.mockImplementation(() => ({
            data: {
                data: [
                    {
                        id: 'store1',
                        name: 'Test Store',
                        latitude: 37.7749,
                        longitude: -122.4194,
                        postalCode: '94105',
                        countryCode: 'US'
                    }
                ]
            },
            isLoading: false,
            error: null
        }))

        const {result} = renderHook(() => useSeStoreSelection(), {
            wrapper: TestWrapper
        })

        await act(async () => {
            const urlParams = new URLSearchParams('?lat=37.7749&lng=-122.4194')
            await result.current.processSeParameters(urlParams)
        })

        expect(mockStoreLocatorContext.state).toEqual({
            selectedStoreId: 'store1',
            isSeSelection: true,
            mode: 'input',
            formValues: {
                countryCode: 'US',
                postalCode: '94105'
            }
        })
    })

    test('handles postal code search', async () => {
        useSearchStores.mockImplementation(() => ({
            data: {
                data: [
                    {
                        id: 'store2',
                        name: 'Test Store 2',
                        postalCode: '94105',
                        countryCode: STORE_LOCATOR_DEFAULT_COUNTRY_CODE
                    }
                ]
            },
            isLoading: false,
            error: null
        }))

        const {result} = renderHook(() => useSeStoreSelection(), {
            wrapper: TestWrapper
        })

        await act(async () => {
            const urlParams = new URLSearchParams('?zip=94105')
            await result.current.processSeParameters(urlParams)
        })

        expect(mockStoreLocatorContext.state).toEqual({
            selectedStoreId: 'store2',
            isSeSelection: true,
            mode: 'input',
            formValues: {
                countryCode: STORE_LOCATOR_DEFAULT_COUNTRY_CODE,
                postalCode: '94105'
            }
        })
    })

    test('handles city search', async () => {
        useSearchStores.mockImplementation(() => ({
            data: {
                data: [
                    {
                        id: 'store3',
                        name: 'Test Store 3',
                        city: 'San Francisco',
                        postalCode: '94105',
                        countryCode: STORE_LOCATOR_DEFAULT_COUNTRY_CODE
                    }
                ]
            },
            isLoading: false,
            error: null
        }))

        const {result} = renderHook(() => useSeStoreSelection(), {
            wrapper: TestWrapper
        })

        await act(async () => {
            const urlParams = new URLSearchParams('?city=San Francisco')
            await result.current.processSeParameters(urlParams)
        })

        expect(mockStoreLocatorContext.state).toEqual({
            selectedStoreId: 'store3',
            isSeSelection: true,
            mode: 'input',
            formValues: {
                countryCode: STORE_LOCATOR_DEFAULT_COUNTRY_CODE,
                postalCode: '94105'
            }
        })
    })

    test('handles empty store data', async () => {
        useSearchStores.mockImplementation(() => ({
            data: {
                data: []
            },
            isLoading: false,
            error: null
        }))

        const {result} = renderHook(() => useSeStoreSelection(), {
            wrapper: TestWrapper
        })

        await act(async () => {
            const urlParams = new URLSearchParams('?zip=94105')
            await result.current.processSeParameters(urlParams)
        })

        expect(mockStoreLocatorContext.state).toEqual({
            selectedStoreId: null,
            isSeSelection: false,
            mode: 'input',
            formValues: {}
        })
    })

    test('handles loading state', async () => {
        useSearchStores.mockImplementation(() => ({
            data: null,
            isLoading: true,
            error: null
        }))

        const {result} = renderHook(() => useSeStoreSelection(), {
            wrapper: TestWrapper
        })

        await act(async () => {
            const urlParams = new URLSearchParams('?zip=94105')
            await result.current.processSeParameters(urlParams)
        })

        expect(result.current.isProcessing).toBe(true)
    })

    test('handles error case', async () => {
        jest.spyOn(console, 'error').mockImplementation(() => {})
        useSearchStores.mockImplementation(() => ({
            data: null,
            isLoading: false,
            error: new Error('API Error')
        }))

        const {result} = renderHook(() => useSeStoreSelection(), {
            wrapper: TestWrapper
        })

        await act(async () => {
            const urlParams = new URLSearchParams('?zip=94105')
            await result.current.processSeParameters(urlParams)
        })

        expect(mockStoreLocatorContext.state).toEqual({
            selectedStoreId: null,
            isSeSelection: false,
            mode: 'input',
            formValues: {}
        })
        console.error.mockRestore()
    })

    test('handles basket integration', async () => {
        useCurrentBasket.mockImplementation(() => ({
            derivedData: {
                totalItems: 2
            }
        }))

        useSearchStores.mockImplementation(() => ({
            data: {
                data: [
                    {
                        id: 'store1',
                        name: 'Test Store',
                        postalCode: '94105',
                        countryCode: STORE_LOCATOR_DEFAULT_COUNTRY_CODE
                    }
                ]
            },
            isLoading: false,
            error: null
        }))

        const {result} = renderHook(() => useSeStoreSelection(), {
            wrapper: TestWrapper
        })

        await act(async () => {
            const urlParams = new URLSearchParams('?zip=94105')
            await result.current.processSeParameters(urlParams)
            result.current.setShouldOpenModal(true)
        })

        expect(result.current.shouldOpenModal).toBe(true)
    })
})
