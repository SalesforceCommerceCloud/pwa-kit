/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {render, act} from '@testing-library/react'
import {MemoryRouter} from 'react-router-dom'
import {
    StoreLocatorProvider,
    StoreLocatorContext
} from '@salesforce/retail-react-app/app/contexts/store-locator-provider'
import {MultiSiteProvider} from '@salesforce/retail-react-app/app/contexts'

// Mock useMultiSite hook
jest.mock('@salesforce/retail-react-app/app/hooks/use-multi-site', () => ({
    __esModule: true,
    default: () => ({
        site: {
            id: 'RefArch',
            alias: 'us'
        },
        locale: {
            id: 'en-US',
            preferredCurrency: 'USD'
        },
        buildUrl: (path) => path
    })
}))

describe('StoreLocatorProvider', () => {
    const mockConfig = {
        defaultCountryCode: 'US',
        defaultPostalCode: '10178'
    }

    const mockSite = {
        id: 'RefArch',
        alias: 'us'
    }

    beforeEach(() => {
        // Clear localStorage before each test
        window.localStorage.clear()
    })

    const TestWrapper = ({children}) => (
        <MultiSiteProvider site={mockSite}>
            <MemoryRouter>
                <StoreLocatorProvider config={mockConfig}>{children}</StoreLocatorProvider>
            </MemoryRouter>
        </MultiSiteProvider>
    )

    TestWrapper.propTypes = {
        children: PropTypes.node
    }

    it('provides the expected context value', () => {
        let contextValue
        const TestComponent = () => {
            contextValue = React.useContext(StoreLocatorContext)
            return null
        }

        render(
            <TestWrapper>
                <TestComponent />
            </TestWrapper>
        )

        expect(contextValue).toBeTruthy()
        expect(contextValue?.state).toEqual({
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
            config: mockConfig
        })
        expect(typeof contextValue?.setState).toBe('function')
        expect(typeof contextValue?.isOpen).toBe('boolean')
        expect(typeof contextValue?.onOpen).toBe('function')
        expect(typeof contextValue?.onClose).toBe('function')
    })

    it('initializes with stored selectedStoreId from localStorage', () => {
        // Set a value in localStorage before rendering
        window.localStorage.setItem('selectedStore_RefArch', 'store123')

        let contextValue
        const TestComponent = () => {
            contextValue = React.useContext(StoreLocatorContext)
            return null
        }

        render(
            <TestWrapper>
                <TestComponent />
            </TestWrapper>
        )

        expect(contextValue?.state.selectedStoreId).toBe('store123')
    })

    it('updates state correctly when setState is called', () => {
        let contextValue
        const TestComponent = () => {
            contextValue = React.useContext(StoreLocatorContext)
            return null
        }

        render(
            <TestWrapper>
                <TestComponent />
            </TestWrapper>
        )

        act(() => {
            contextValue?.setState((prev) => ({
                ...prev,
                mode: 'device',
                formValues: {
                    countryCode: 'US',
                    postalCode: '94105'
                }
            }))
        })

        expect(contextValue?.state.mode).toBe('device')
        expect(contextValue?.state.formValues).toEqual({
            countryCode: 'US',
            postalCode: '94105'
        })
    })

    it('updates localStorage when selectedStoreId changes', () => {
        let contextValue
        const TestComponent = () => {
            contextValue = React.useContext(StoreLocatorContext)
            return null
        }

        render(
            <TestWrapper>
                <TestComponent />
            </TestWrapper>
        )

        act(() => {
            contextValue?.setState((prev) => ({
                ...prev,
                selectedStoreId: 'store456'
            }))
        })

        expect(window.localStorage.getItem('selectedStore_RefArch')).toBe('store456')
    })

    it('renders children correctly', () => {
        const TestChild = () => <div data-testid="test-child">Test Child</div>

        const {getByText} = render(
            <TestWrapper>
                <TestChild />
            </TestWrapper>
        )

        expect(getByText('Test Child')).toBeTruthy()
    })

    it('handles modal state correctly', () => {
        let contextValue
        const TestComponent = () => {
            contextValue = React.useContext(StoreLocatorContext)
            return null
        }

        render(
            <TestWrapper>
                <TestComponent />
            </TestWrapper>
        )

        // Initially modal should be closed
        expect(contextValue?.isOpen).toBe(false)

        // Open modal
        act(() => {
            contextValue?.onOpen()
        })
        expect(contextValue?.isOpen).toBe(true)

        // Close modal
        act(() => {
            contextValue?.onClose()
        })
        expect(contextValue?.isOpen).toBe(false)
    })
})
