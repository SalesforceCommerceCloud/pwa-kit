/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {render, screen} from '@testing-library/react'
import {withStoreLocator} from './with-store-locator'
import {useStoreLocator} from './use-store-locator'
import PropTypes from 'prop-types'

jest.mock('./use-store-locator', () => ({
    useStoreLocator: jest.fn()
}))

// Mock the StoreLocatorModal component
jest.mock('./modal', () => ({
    // eslint-disable-next-line react/prop-types
    StoreLocatorModal: ({isOpen, onClose}) =>
        isOpen ? (
            <div data-testid="store-locator-modal">
                Modal Content
                <button onClick={onClose}>Close</button>
            </div>
        ) : null
}))

describe('withStoreLocator', () => {
    const mockConfig = {
        defaultCountryCode: 'US',
        defaultPostalCode: '94105',
        defaultPageSize: 10,
        radius: 100,
        radiusUnit: 'mi',
        supportedCountries: []
    }

    beforeEach(() => {
        useStoreLocator.mockReturnValue({
            searchStoresParams: {},
            setSearchStoresParams: jest.fn(),
            config: mockConfig,
            isModalOpen: false,
            closeModal: jest.fn(),
            openModal: jest.fn(),
            mode: 'input',
            formValues: {
                countryCode: 'US',
                postalCode: '94105'
            },
            deviceCoordinates: {
                latitude: null,
                longitude: null
            },
            data: undefined,
            isLoading: false,
            setFormValues: jest.fn(),
            setDeviceCoordinates: jest.fn()
        })
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    it('wraps component with StoreLocatorProvider', () => {
        const TestComponent = () => <div>Test Component</div>
        const WrappedComponent = withStoreLocator(TestComponent, mockConfig)

        render(<WrappedComponent />)
        expect(screen.getByText('Test Component')).toBeTruthy()
    })

    it('passes props to wrapped component', () => {
        const TestComponentWithProps = ({testProp}) => <div>{testProp}</div>
        TestComponentWithProps.propTypes = {
            testProp: PropTypes.string
        }

        const WrappedComponent = withStoreLocator(TestComponentWithProps, mockConfig)
        render(<WrappedComponent testProp="test value" />)

        expect(screen.getByText('test value')).toBeTruthy()
    })

    it('preserves component display name', () => {
        const TestComponent = () => <div>Test Component</div>
        TestComponent.displayName = 'CustomTestComponent'

        const WrappedComponent = withStoreLocator(TestComponent, mockConfig)
        expect(WrappedComponent.displayName).toBe('WithStoreLocator(CustomTestComponent)')
    })

    it('handles components without display name', () => {
        const TestComponent = () => <div>Test Component</div>
        const WrappedComponent = withStoreLocator(TestComponent, mockConfig)

        expect(WrappedComponent.displayName).toBe('WithStoreLocator(TestComponent)')
    })

    it('renders modal when isModalOpen is true', () => {
        const TestComponent = () => <div>Test Component</div>
        const WrappedComponent = withStoreLocator(TestComponent, mockConfig)

        useStoreLocator.mockReturnValue({
            searchStoresParams: {},
            setSearchStoresParams: jest.fn(),
            config: mockConfig,
            isModalOpen: true,
            closeModal: jest.fn(),
            openModal: jest.fn(),
            mode: 'input',
            formValues: {
                countryCode: 'US',
                postalCode: '94105'
            },
            deviceCoordinates: {
                latitude: null,
                longitude: null
            },
            data: undefined,
            isLoading: false,
            setFormValues: jest.fn(),
            setDeviceCoordinates: jest.fn()
        })

        render(<WrappedComponent />)
        expect(screen.getByTestId('store-locator-modal')).toBeTruthy()
    })

    it('does not render modal when isModalOpen is false', () => {
        const TestComponent = () => <div>Test Component</div>
        const WrappedComponent = withStoreLocator(TestComponent, mockConfig)

        useStoreLocator.mockReturnValue({
            searchStoresParams: {},
            setSearchStoresParams: jest.fn(),
            config: mockConfig,
            isModalOpen: false,
            closeModal: jest.fn(),
            openModal: jest.fn(),
            mode: 'input',
            formValues: {
                countryCode: 'US',
                postalCode: '94105'
            },
            deviceCoordinates: {
                latitude: null,
                longitude: null
            },
            data: undefined,
            isLoading: false,
            setFormValues: jest.fn(),
            setDeviceCoordinates: jest.fn()
        })

        render(<WrappedComponent />)
        expect(screen.queryByTestId('store-locator-modal')).toBeNull()
    })

    it('calls closeModal when modal is closed', () => {
        const TestComponent = () => <div>Test Component</div>
        const WrappedComponent = withStoreLocator(TestComponent, mockConfig)
        const mockCloseModal = jest.fn()

        useStoreLocator.mockReturnValue({
            searchStoresParams: {},
            setSearchStoresParams: jest.fn(),
            config: mockConfig,
            isModalOpen: true,
            closeModal: mockCloseModal,
            openModal: jest.fn(),
            mode: 'input',
            formValues: {
                countryCode: 'US',
                postalCode: '94105'
            },
            deviceCoordinates: {
                latitude: null,
                longitude: null
            },
            data: undefined,
            isLoading: false,
            setFormValues: jest.fn(),
            setDeviceCoordinates: jest.fn()
        })

        render(<WrappedComponent />)
        const closeButton = screen.getByText('Close')
        closeButton.click()

        expect(mockCloseModal).toHaveBeenCalled()
    })
})
