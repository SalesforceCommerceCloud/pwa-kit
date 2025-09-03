/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {render, screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {IntlProvider} from 'react-intl'
import {MemoryRouter} from 'react-router-dom'
import {StoreLocatorForm} from '@salesforce/retail-react-app/app/components/store-locator/form'
import {useStoreLocator} from '@salesforce/retail-react-app/app/hooks/use-store-locator'
import {useGeolocation} from '@salesforce/retail-react-app/app/hooks/use-geo-location'
import {useSelectedStore} from '@salesforce/retail-react-app/app/hooks/use-selected-store'
import {StoreLocatorProvider} from '@salesforce/retail-react-app/app/contexts/store-locator-provider'
import {MultiSiteProvider} from '@salesforce/retail-react-app/app/contexts'
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'
import {useStores} from '@salesforce/commerce-sdk-react'
import PropTypes from 'prop-types'

jest.mock('@salesforce/retail-react-app/app/hooks/use-store-locator', () => ({
    useStoreLocator: jest.fn()
}))

jest.mock('@salesforce/retail-react-app/app/hooks/use-geo-location', () => ({
    useGeolocation: jest.fn()
}))

jest.mock('@salesforce/retail-react-app/app/hooks/use-selected-store', () => ({
    useSelectedStore: jest.fn()
}))

jest.mock('@salesforce/retail-react-app/app/hooks/use-current-basket', () => ({
    useCurrentBasket: jest.fn()
}))

jest.mock('@salesforce/commerce-sdk-react', () => ({
    useStores: jest.fn()
}))

describe('StoreLocatorForm', () => {
    const mockConfig = {
        supportedCountries: [
            {countryCode: 'US', countryName: 'United States'},
            {countryCode: 'CA', countryName: 'Canada'}
        ],
        defaultCountryCode: 'US',
        defaultPostalCode: '10178'
    }

    const mockSite = {
        id: 'RefArch',
        alias: 'us'
    }

    const mockSetFormValues = jest.fn()
    const mockSetDeviceCoordinates = jest.fn()
    const mockRefresh = jest.fn()
    let user

    // Mock messages for intl
    const messages = {
        'store_locator.field.placeholder.enter_postal_code': 'Enter postal code',
        'store_locator.action.select_a_country': 'Select a country',
        'store_locator.action.find': 'Find',
        'store_locator.description.or': 'Or',
        'store_locator.action.use_my_location': 'Use My Location',
        'store_locator.error.please_enter_a_postal_code': 'Enter a postal code.',
        'store_locator.error.please_select_a_country': 'Select a country.',
        'store_locator.error.agree_to_share_your_location':
            'To use your location, enable location sharing.'
    }

    const TestWrapper = ({children}) => (
        <IntlProvider locale="en" messages={messages}>
            <MultiSiteProvider site={mockSite}>
                <MemoryRouter>
                    <StoreLocatorProvider config={mockConfig}>{children}</StoreLocatorProvider>
                </MemoryRouter>
            </MultiSiteProvider>
        </IntlProvider>
    )

    TestWrapper.propTypes = {
        children: PropTypes.node
    }

    beforeEach(() => {
        jest.clearAllMocks()
        user = userEvent.setup()

        useStoreLocator.mockImplementation(() => ({
            config: mockConfig,
            formValues: {countryCode: '', postalCode: ''},
            setFormValues: mockSetFormValues,
            setDeviceCoordinates: mockSetDeviceCoordinates,
            isOpen: false,
            onOpen: jest.fn(),
            onClose: jest.fn()
        }))

        useGeolocation.mockImplementation(() => ({
            coordinates: {latitude: null, longitude: null},
            error: null,
            refresh: mockRefresh
        }))

        useSelectedStore.mockImplementation(() => ({
            selectedStore: null
        }))

        useCurrentBasket.mockImplementation(() => ({
            derivedData: {totalItems: 0}
        }))

        useStores.mockImplementation(() => ({
            data: null,
            isLoading: false,
            error: null
        }))
    })

    const renderWithProviders = (ui) => {
        return render(ui, {wrapper: TestWrapper})
    }

    it('renders postal code input field', () => {
        renderWithProviders(<StoreLocatorForm />)
        const postalCodeInput = screen.getByPlaceholderText('Enter postal code')
        expect(postalCodeInput).toBeInTheDocument()
    })

    it('renders country selector when supportedCountries exist', () => {
        renderWithProviders(<StoreLocatorForm />)
        const countrySelect = screen.getByText('Select a country')
        expect(countrySelect).toBeInTheDocument()
    })

    it('renders "Use My Location" button', () => {
        renderWithProviders(<StoreLocatorForm />)
        const locationButton = screen.getByText('Use My Location')
        expect(locationButton).toBeInTheDocument()
    })

    it('submits form with entered values', async () => {
        renderWithProviders(<StoreLocatorForm />)

        const countrySelect = screen.getByRole('combobox')
        const postalCodeInput = screen.getByPlaceholderText('Enter postal code')

        await user.selectOptions(countrySelect, 'US')
        await user.type(postalCodeInput, '12345')

        const findButton = screen.getByText('Find')
        await user.click(findButton)

        await waitFor(() => {
            expect(mockSetFormValues).toHaveBeenCalledWith({
                countryCode: 'US',
                postalCode: '12345'
            })
        })
    })

    it('shows validation error for empty postal code', async () => {
        renderWithProviders(<StoreLocatorForm />)

        const findButton = screen.getByText('Find')
        await user.click(findButton)

        await waitFor(() => {
            const errorMessage = screen.getByText('Enter a postal code.')
            expect(errorMessage).toBeInTheDocument()
        })
    })

    it('clears form when "Use My Location" is clicked', async () => {
        renderWithProviders(<StoreLocatorForm />)

        const countrySelect = screen.getByRole('combobox')
        const postalCodeInput = screen.getByPlaceholderText('Enter postal code')

        await user.selectOptions(countrySelect, 'US')
        await user.type(postalCodeInput, '12345')

        const locationButton = screen.getByText('Use My Location')
        await user.click(locationButton)

        await waitFor(() => {
            expect(mockSetFormValues).toHaveBeenCalledWith({
                countryCode: '',
                postalCode: ''
            })
        })

        expect(mockRefresh).toHaveBeenCalled()
    })

    it('does not render country selector when no supported countries', () => {
        useStoreLocator.mockImplementation(() => ({
            config: {...mockConfig, supportedCountries: []},
            formValues: {countryCode: '', postalCode: ''},
            setFormValues: mockSetFormValues,
            setDeviceCoordinates: mockSetDeviceCoordinates,
            isOpen: false,
            onOpen: jest.fn(),
            onClose: jest.fn()
        }))

        renderWithProviders(<StoreLocatorForm />)

        const countrySelect = screen.queryByText('Select a country')
        expect(countrySelect).not.toBeInTheDocument()
    })

    it('initializes form with selected store data', () => {
        const mockSelectedStore = {
            countryCode: 'CA',
            postalCode: 'M5V 3A8'
        }

        useSelectedStore.mockImplementation(() => ({
            selectedStore: mockSelectedStore
        }))

        useStoreLocator.mockImplementation(() => ({
            config: mockConfig,
            formValues: {countryCode: '', postalCode: ''},
            setFormValues: mockSetFormValues,
            setDeviceCoordinates: mockSetDeviceCoordinates,
            isOpen: false,
            onOpen: jest.fn(),
            onClose: jest.fn()
        }))

        renderWithProviders(<StoreLocatorForm />)

        expect(mockSetFormValues).toHaveBeenCalledWith({
            countryCode: 'CA',
            postalCode: 'M5V 3A8'
        })
    })

    it('calls refresh when "Use My Location" is clicked', async () => {
        renderWithProviders(<StoreLocatorForm />)

        const locationButton = screen.getByText('Use My Location')
        await user.click(locationButton)

        expect(mockRefresh).toHaveBeenCalled()
        await waitFor(() => {
            expect(mockSetFormValues).toHaveBeenCalledWith({
                countryCode: '',
                postalCode: ''
            })
        })
    })
})
