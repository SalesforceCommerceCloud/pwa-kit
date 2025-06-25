/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {StoreLocatorForm} from '@salesforce/retail-react-app/app/components/store-locator/form'
import {useStoreLocator} from '@salesforce/retail-react-app/app/hooks/use-store-locator'
import {useGeolocation} from '@salesforce/retail-react-app/app/hooks/use-geo-location'

jest.mock('@salesforce/retail-react-app/app/hooks/use-store-locator', () => ({
    useStoreLocator: jest.fn()
}))

jest.mock('@salesforce/retail-react-app/app/hooks/use-geo-location', () => ({
    useGeolocation: jest.fn()
}))

describe('StoreLocatorForm', () => {
    const mockConfig = {
        supportedCountries: [
            {countryCode: 'US', countryName: 'United States'},
            {countryCode: 'CA', countryName: 'Canada'}
        ]
    }

    const mockSetFormValues = jest.fn()
    const mockSetDeviceCoordinates = jest.fn()
    let user

    beforeEach(() => {
        jest.clearAllMocks()
        user = userEvent.setup()

        useStoreLocator.mockImplementation(() => ({
            config: mockConfig,
            formValues: {countryCode: '', postalCode: ''},
            setFormValues: mockSetFormValues,
            setDeviceCoordinates: mockSetDeviceCoordinates
        }))

        useGeolocation.mockImplementation(() => ({
            coordinates: {latitude: null, longitude: null},
            error: null,
            refresh: jest.fn()
        }))
    })

    it('renders postal code input field', () => {
        render(<StoreLocatorForm />)
        const postalCodeInput = screen.queryByPlaceholderText('Enter postal code')
        expect(postalCodeInput).not.toBeNull()
    })

    it('renders country selector when supportedCountries exist', () => {
        render(<StoreLocatorForm />)
        const countrySelect = screen.queryByText('Select a country')
        expect(countrySelect).not.toBeNull()
    })

    it('renders "Use My Location" button', () => {
        render(<StoreLocatorForm />)
        const locationButton = screen.queryByText('Use My Location')
        expect(locationButton).not.toBeNull()
    })

    it('submits form with entered values', async () => {
        render(<StoreLocatorForm />)

        const countrySelect = screen.getByRole('combobox')
        const postalCodeInput = screen.getByPlaceholderText('Enter postal code')

        await user.selectOptions(countrySelect, 'US')
        await user.type(postalCodeInput, '12345')

        const findButton = screen.getByText('Find')
        await user.click(findButton)

        expect(mockSetFormValues).toHaveBeenCalledWith({
            countryCode: 'US',
            postalCode: '12345'
        })
    })

    it('shows validation error for empty postal code', async () => {
        render(<StoreLocatorForm />)

        const findButton = screen.getByText('Find')
        await user.click(findButton)

        const errorMessage = screen.queryByText('Please enter a postal code.')
        expect(errorMessage).not.toBeNull()
    })

    it('clears form when "Use My Location" is clicked', async () => {
        const mockRefresh = jest.fn()
        useGeolocation.mockImplementation(() => ({
            coordinates: {latitude: null, longitude: null},
            error: null,
            refresh: mockRefresh
        }))

        render(<StoreLocatorForm />)

        const countrySelect = screen.getByRole('combobox')
        const postalCodeInput = screen.getByPlaceholderText('Enter postal code')

        await user.selectOptions(countrySelect, 'US')
        await user.type(postalCodeInput, '12345')

        const locationButton = screen.getByText('Use My Location')
        await user.click(locationButton)

        expect(mockSetFormValues).toHaveBeenCalledWith({
            countryCode: '',
            postalCode: ''
        })
        expect(mockRefresh).toHaveBeenCalled()
    })

    it('updates device coordinates when geolocation is successful', () => {
        const mockCoordinates = {latitude: 37.7749, longitude: -122.4194}
        useGeolocation.mockImplementation(() => ({
            coordinates: mockCoordinates,
            error: null,
            refresh: jest.fn()
        }))

        render(<StoreLocatorForm />)

        expect(mockSetDeviceCoordinates).toHaveBeenCalledWith(mockCoordinates)
    })

    it('shows geolocation error message when permission is denied', () => {
        useGeolocation.mockImplementation(() => ({
            coordinates: {latitude: null, longitude: null},
            error: new Error('Geolocation permission denied'),
            refresh: jest.fn()
        }))

        render(<StoreLocatorForm />)

        const errorMessage = screen.queryByText('Please agree to share your location')
        expect(errorMessage).not.toBeNull()
    })
})
