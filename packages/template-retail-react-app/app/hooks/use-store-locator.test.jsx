/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {renderHook, act} from '@testing-library/react'
import {
    useStoreLocator,
    useStoreLocatorModal
} from '@salesforce/retail-react-app/app/hooks/use-store-locator'
import {StoreLocatorProvider} from '@salesforce/retail-react-app/app/contexts/store-locator-provider'
import {useSearchStores} from '@salesforce/commerce-sdk-react'
import {useLocation} from 'react-router-dom'

jest.mock('@salesforce/retail-react-app/app/hooks/use-multi-site', () => ({
    __esModule: true,
    default: () => ({
        site: {
            id: 'test-site',
            alias: 'test-site-alias'
        },
        locale: {
            id: 'en-US',
            preferredCurrency: 'USD'
        },
        buildUrl: (path) => path
    })
}))

jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useLocation: jest.fn(() => ({
        pathname: '/test-path'
    }))
}))

jest.mock('@salesforce/commerce-sdk-react', () => ({
    useSearchStores: jest.fn()
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
        useSearchStores.mockReturnValue({
            data: undefined,
            isLoading: false
        })
        window.localStorage.clear()
    })

    it('throws error when used outside provider', () => {
        const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
        expect(() => renderHook(() => useStoreLocator())).toThrow(
            'useStoreLocator must be used within a StoreLocatorProvider'
        )
        consoleError.mockRestore()
    })

    it('initializes with default state', () => {
        const {result} = renderHook(() => useStoreLocator(), {wrapper})
        expect(result.current).toMatchObject({
            mode: 'input',
            formValues: {
                countryCode: '',
                postalCode: ''
            },
            deviceCoordinates: {
                latitude: null,
                longitude: null
            },
            selectedStoreId: null,
            config
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

    it('receives store data when form values are set in input mode', () => {
        const mockStores = [
            {id: 'store1', name: 'Store 1'},
            {id: 'store2', name: 'Store 2'}
        ]
        useSearchStores.mockReturnValue({
            data: mockStores,
            isLoading: false
        })

        const {result} = renderHook(() => useStoreLocator(), {wrapper})
        act(() => {
            result.current.setFormValues({
                countryCode: 'US',
                postalCode: '94105'
            })
        })

        expect(result.current.data).toEqual(mockStores)
        expect(result.current.selectedStoreId).toBeNull()
    })

    it('allows manual store selection', () => {
        const {result} = renderHook(() => useStoreLocator(), {wrapper})
        act(() => {
            result.current.setSelectedStoreId('store123')
        })
        expect(result.current.selectedStoreId).toBe('store123')
    })

    it('handles loading state', () => {
        useSearchStores.mockReturnValue({
            data: undefined,
            isLoading: true
        })
        const {result} = renderHook(() => useStoreLocator(), {wrapper})
        expect(result.current.isLoading).toBe(true)
    })

    it('provides modal actions', () => {
        const {result} = renderHook(() => useStoreLocator(), {wrapper})
        expect(typeof result.current.onOpen).toBe('function')
        expect(typeof result.current.onClose).toBe('function')
        expect(result.current.isOpen).toBe(false)
    })

    it('can open and close modal', () => {
        const {result} = renderHook(() => useStoreLocator(), {wrapper})

        act(() => {
            result.current.onOpen()
        })
        expect(result.current.isOpen).toBe(true)

        act(() => {
            result.current.onClose()
        })
        expect(result.current.isOpen).toBe(false)
    })

    describe('useStoreLocator - localStorage behavior', () => {
        it('initializes with stored selectedStoreId from localStorage', () => {
            window.localStorage.setItem('selectedStore_test-site', 'store123')
            const {result} = renderHook(() => useStoreLocator(), {wrapper})
            expect(result.current.selectedStoreId).toBe('store123')
        })

        it('updates localStorage when selectedStoreId changes', () => {
            const {result} = renderHook(() => useStoreLocator(), {wrapper})
            act(() => {
                result.current.setSelectedStoreId('store456')
            })
            expect(window.localStorage.getItem('selectedStore_test-site')).toBe('store456')
        })

        it('initializes with empty values when localStorage is empty', () => {
            const {result} = renderHook(() => useStoreLocator(), {wrapper})
            expect(result.current.selectedStoreId).toBeNull()
            expect(result.current.formValues).toEqual({
                countryCode: '',
                postalCode: ''
            })
            expect(useSearchStores).toHaveBeenCalledWith(
                {
                    parameters: {
                        countryCode: '',
                        postalCode: '',
                        maxDistance: 100,
                        limit: 200,
                        distanceUnit: 'mi'
                    }
                },
                {
                    enabled: false
                }
            )
        })

        it('initializes with empty values when localStorage data is invalid', () => {
            window.localStorage.setItem('selectedStore_test-site', 'invalid-json')
            const {result} = renderHook(() => useStoreLocator(), {wrapper})
            expect(result.current.selectedStoreId).toBe('invalid-json')
            expect(result.current.formValues).toEqual({
                countryCode: '',
                postalCode: ''
            })
            expect(useSearchStores).toHaveBeenCalledWith(
                {
                    parameters: {
                        countryCode: '',
                        postalCode: '',
                        maxDistance: 100,
                        limit: 200,
                        distanceUnit: 'mi'
                    }
                },
                {
                    enabled: false
                }
            )
        })
    })
})

describe('useStoreLocatorModal', () => {
    beforeEach(() => {
        window.localStorage.clear()
    })

    it('throws error when used outside provider', () => {
        const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
        expect(() => renderHook(() => useStoreLocatorModal())).toThrow(
            'useStoreLocatorModal must be used within a StoreLocatorProvider'
        )
        consoleError.mockRestore()
    })

    it('initializes with modal closed', () => {
        const {result} = renderHook(() => useStoreLocatorModal(), {wrapper})
        expect(result.current.isOpen).toBe(false)
        expect(typeof result.current.onOpen).toBe('function')
        expect(typeof result.current.onClose).toBe('function')
    })

    it('can open and close modal', () => {
        const {result} = renderHook(() => useStoreLocatorModal(), {wrapper})

        act(() => {
            result.current.onOpen()
        })
        expect(result.current.isOpen).toBe(true)

        act(() => {
            result.current.onClose()
        })
        expect(result.current.isOpen).toBe(false)
    })

    it('modal state is shared with useStoreLocator hook', () => {
        // Render both hooks in a single component to share the same context
        const TestComponent = () => {
            const modalHook = useStoreLocatorModal()
            const storeHook = useStoreLocator()
            return {modalHook, storeHook}
        }

        const {result} = renderHook(() => TestComponent(), {wrapper})

        act(() => {
            result.current.modalHook.onOpen()
        })
        expect(result.current.modalHook.isOpen).toBe(true)
        expect(result.current.storeHook.isOpen).toBe(true)

        act(() => {
            result.current.storeHook.onClose()
        })
        expect(result.current.modalHook.isOpen).toBe(false)
        expect(result.current.storeHook.isOpen).toBe(false)
    })

    it('auto-closes modal when pathname changes', () => {
        const mockUseLocation = useLocation
        const {result} = renderHook(() => useStoreLocatorModal(), {wrapper})

        // Open the modal
        act(() => {
            result.current.onOpen()
        })
        expect(result.current.isOpen).toBe(true)

        // Simulate navigation by changing pathname
        mockUseLocation.mockReturnValue({pathname: '/new-path'})

        // Re-render the hook to trigger the useEffect
        const {result: newResult} = renderHook(() => useStoreLocatorModal(), {wrapper})
        expect(newResult.current.isOpen).toBe(false)
    })
})
