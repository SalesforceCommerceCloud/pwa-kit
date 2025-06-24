/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {renderHook, act} from '@testing-library/react'
import {useStoreLocator} from '@salesforce/retail-react-app/app/hooks/use-store-locator'
import {StoreLocatorProvider} from '@salesforce/retail-react-app/app/contexts/store-locator-provider'
import {useSearchStores} from '@salesforce/commerce-sdk-react'

// Mock the commerce-sdk-react hook
jest.mock('@salesforce/commerce-sdk-react', () => ({
    useSearchStores: jest.fn()
}))
jest.mock('@salesforce/retail-react-app/app/hooks/use-multi-site', () => () => ({
    site: {id: 'test-site'},
    buildUrl: (url) => url,
    locale: 'en-US'
}))

const config = {
    radius: 100,
    radiusUnit: 'mi',
    defaultCountryCode: 'US',
    defaultPostalCode: '10178'
}

const wrapper = ({children}) => {
    return <StoreLocatorProvider config={config}>{children}</StoreLocatorProvider>
}

describe('useStoreLocator', () => {
    beforeEach(() => {
        useSearchStores.mockReset()
        // Default mock implementation
        useSearchStores.mockReturnValue({
            data: undefined,
            isLoading: false
        })
    })

    it('throws error when used outside provider', () => {
        let error
        try {
            renderHook(() => useStoreLocator())
        } catch (err) {
            error = err
        }

        expect(error).toEqual(Error('useStoreLocator must be used within a StoreLocatorProvider'))
    })

    it('initializes with default values', () => {
        const {result} = renderHook(() => useStoreLocator(), {wrapper})

        expect(result.current).toMatchObject({
            mode: 'input',
            formValues: {
                countryCode: config.defaultCountryCode,
                postalCode: config.defaultPostalCode
            },
            deviceCoordinates: {latitude: null, longitude: null},
            isLoading: false,
            data: undefined
        })
    })

    it('updates form values and switches to input mode', () => {
        const {result} = renderHook(() => useStoreLocator(), {wrapper})

        act(() => {
            result.current.setFormValues({
                countryCode: 'US',
                postalCode: '94105'
            })
        })

        expect(result.current.mode).toBe('input')
        expect(result.current.formValues).toEqual({
            countryCode: 'US',
            postalCode: '94105'
        })
    })

    it('updates device coordinates and switches to device mode', () => {
        const {result} = renderHook(() => useStoreLocator(), {wrapper})

        act(() => {
            result.current.setDeviceCoordinates({
                latitude: 37.7749,
                longitude: -122.4194
            })
        })

        expect(result.current.mode).toBe('device')
        expect(result.current.deviceCoordinates).toEqual({
            latitude: 37.7749,
            longitude: -122.4194
        })
        // Should reset form values when switching to device mode
        expect(result.current.formValues).toEqual({
            countryCode: '',
            postalCode: ''
        })
    })

    it('calls useSearchStores with correct parameters in input mode', () => {
        const {result} = renderHook(() => useStoreLocator(), {wrapper})

        act(() => {
            result.current.setFormValues({
                countryCode: 'US',
                postalCode: '94105'
            })
        })

        expect(useSearchStores).toHaveBeenCalledWith(
            {
                parameters: {
                    countryCode: 'US',
                    postalCode: '94105',
                    maxDistance: 100,
                    limit: 200,
                    distanceUnit: 'mi'
                }
            },
            {
                enabled: true
            }
        )
    })

    it('calls useSearchStores with correct parameters in device mode', () => {
        const {result} = renderHook(() => useStoreLocator(), {wrapper})

        act(() => {
            result.current.setDeviceCoordinates({
                latitude: 37.7749,
                longitude: -122.4194
            })
        })

        expect(useSearchStores).toHaveBeenCalledWith(
            {
                parameters: {
                    latitude: 37.7749,
                    longitude: -122.4194,
                    maxDistance: 100,
                    limit: 200,
                    distanceUnit: 'mi'
                }
            },
            {
                enabled: true
            }
        )
    })

    it('handles loading state', () => {
        useSearchStores.mockReturnValue({
            data: undefined,
            isLoading: true
        })

        const {result} = renderHook(() => useStoreLocator(), {wrapper})

        expect(result.current.isLoading).toBe(true)
    })

    it('handles store data', () => {
        const mockStoreData = [
            {
                id: '1',
                name: 'Test Store',
                address: {
                    address1: '123 Test St',
                    city: 'Test City',
                    stateCode: 'CA',
                    postalCode: '94105'
                }
            }
        ]

        useSearchStores.mockReturnValue({
            data: mockStoreData,
            isLoading: false
        })

        const {result} = renderHook(() => useStoreLocator(), {wrapper})

        expect(result.current.data).toEqual(mockStoreData)
    })
})

describe('useStoreLocator - getSearchParams For Store Selection', () => {
    const wrapper = ({children}) => (
        <StoreLocatorProvider
            config={{
                radius: 100,
                radiusUnit: 'mi',
                defaultCountryCode: 'US',
                defaultPostalCode: '10178'
            }}
        >
            {children}
        </StoreLocatorProvider>
    )

    beforeEach(() => {
        window.localStorage.clear()
        useSearchStores.mockClear()
        useSearchStores.mockReturnValue({data: undefined, isLoading: false})
    })

    test('returns initial params when provided', () => {
        const initialParams = {
            countryCode: 'US',
            postalCode: '94301',
            latitude: 37.4419,
            longitude: -122.143
        }
        const customWrapper = ({children}) => (
            <StoreLocatorProvider
                config={{
                    radius: 100,
                    radiusUnit: 'mi',
                    defaultCountryCode: 'US',
                    defaultPostalCode: '10178'
                }}
            >
                {children}
            </StoreLocatorProvider>
        )
        const {result} = renderHook(() => useStoreLocator(), {wrapper: customWrapper})
        act(() => {
            result.current.setFormValues({
                countryCode: initialParams.countryCode,
                postalCode: initialParams.postalCode
            })
        })
        expect(useSearchStores).toHaveBeenCalledWith(
            expect.objectContaining({
                parameters: expect.objectContaining({
                    countryCode: 'US',
                    postalCode: '94301',
                    maxDistance: 100,
                    limit: 200,
                    distanceUnit: 'mi'
                })
            }),
            expect.any(Object)
        )
    })

    test('returns Search Engine provided location parameter selection from localStorage when available', () => {
        const seStoreData = {
            isSeSelection: true,
            seSearchParams: {
                countryCode: 'US',
                postalCode: '90210',
                latitude: 34.0522,
                longitude: -118.2437
            }
        }
        window.localStorage.setItem('store_test-site', JSON.stringify(seStoreData))
        renderHook(() => useStoreLocator(), {wrapper})
        expect(useSearchStores).toHaveBeenCalledWith(
            expect.objectContaining({
                parameters: expect.objectContaining({
                    countryCode: 'US',
                    postalCode: '90210',
                    latitude: 34.0522,
                    longitude: -118.2437,
                    limit: 200
                })
            }),
            expect.any(Object)
        )
    })

    test('returns manual search params from localStorage when no Search Engine provided location parameter selection', () => {
        const manualStoreData = {
            isSeSelection: false,
            manualSearchParams: {
                countryCode: 'DE',
                postalCode: '10178'
            }
        }
        window.localStorage.setItem('store_test-site', JSON.stringify(manualStoreData))
        renderHook(() => useStoreLocator(), {wrapper})
        expect(useSearchStores).toHaveBeenCalledWith(
            expect.objectContaining({
                parameters: expect.objectContaining({
                    countryCode: 'US',
                    postalCode: '10178',
                    maxDistance: 100,
                    limit: 200,
                    distanceUnit: 'mi'
                })
            }),
            expect.any(Object)
        )
    })

    test('returns default values when localStorage is empty', () => {
        renderHook(() => useStoreLocator(), {wrapper})
        expect(useSearchStores).toHaveBeenCalledWith(
            expect.objectContaining({
                parameters: expect.objectContaining({
                    countryCode: 'US',
                    postalCode: '10178',
                    maxDistance: 100,
                    limit: 200,
                    distanceUnit: 'mi'
                })
            }),
            expect.any(Object)
        )
    })

    test('returns default values when localStorage data is invalid', () => {
        window.localStorage.setItem('store_test-site', 'invalid-json')
        renderHook(() => useStoreLocator(), {wrapper})
        expect(useSearchStores).toHaveBeenCalledWith(
            expect.objectContaining({
                parameters: expect.objectContaining({
                    countryCode: 'US',
                    postalCode: '10178',
                    maxDistance: 100,
                    limit: 200,
                    distanceUnit: 'mi'
                })
            }),
            expect.any(Object)
        )
    })
})
