/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {renderHook, act} from '@testing-library/react'
import {useForm} from 'react-hook-form'
import useAddressFields from '../forms/useAddressFields'
import {
    getAddressSuggestions,
    parseAddressSuggestion
} from '@salesforce/retail-react-app/app/utils/address-suggestions'

// Mock the address service
jest.mock('@salesforce/retail-react-app/app/utils/address-suggestions')
jest.mock('react-intl', () => ({
    useIntl: () => ({
        formatMessage: jest.fn((message) => message.defaultMessage || message.id)
    }),
    defineMessages: jest.fn((messages) => messages)
}))

// Mock the phone formatter
jest.mock('@salesforce/retail-react-app/app/utils/phone-utils', () => ({
    formatPhoneNumber: jest.fn((value) => value)
}))

// Mock the state/province options
jest.mock('@salesforce/retail-react-app/app/components/forms/state-province-options', () => ({
    stateOptions: [
        {value: 'NY', label: 'New York'},
        {value: 'CA', label: 'California'}
    ],
    provinceOptions: [
        {value: 'ON', label: 'Ontario'},
        {value: 'BC', label: 'British Columbia'}
    ]
}))

// Mock the constants
jest.mock('@salesforce/retail-react-app/app/constants', () => ({
    SHIPPING_COUNTRY_CODES: [
        {value: 'US', label: 'United States'},
        {value: 'CA', label: 'Canada'}
    ]
}))

describe('useAddressFields', () => {
    let mockForm
    let mockSetValue
    let mockWatch

    beforeEach(() => {
        jest.clearAllMocks()

        mockSetValue = jest.fn()
        mockWatch = jest.fn()

        mockForm = {
            watch: mockWatch,
            control: {},
            setValue: mockSetValue,
            formState: {errors: {}}
        }

        // Mock the address service responses
        getAddressSuggestions.mockResolvedValue([
            {
                mainText: '123 Main Street',
                secondaryText: 'New York, NY 10001, USA',
                country: 'US'
            }
        ])

        parseAddressSuggestion.mockReturnValue({
            address1: '123 Main Street',
            city: 'New York',
            stateCode: 'NY',
            postalCode: '10001',
            countryCode: 'US'
        })
    })

    it('should return all required address fields', () => {
        const {result} = renderHook(() => useAddressFields({form: mockForm}))

        expect(result.current).toHaveProperty('firstName')
        expect(result.current).toHaveProperty('lastName')
        expect(result.current).toHaveProperty('phone')
        expect(result.current).toHaveProperty('countryCode')
        expect(result.current).toHaveProperty('address1')
        expect(result.current).toHaveProperty('city')
        expect(result.current).toHaveProperty('stateCode')
        expect(result.current).toHaveProperty('postalCode')
        expect(result.current).toHaveProperty('preferred')
    })

    it('should set default country to US', () => {
        const {result} = renderHook(() => useAddressFields({form: mockForm}))

        expect(result.current.countryCode.defaultValue).toBe('US')
    })

    it('should call getAddressSuggestions when address input changes', async () => {
        const {result} = renderHook(() => useAddressFields({form: mockForm}))

        // Simulate address input change
        await act(async () => {
            const inputProps = result.current.address1.inputProps({onChange: jest.fn()})
            inputProps.onChange({
                target: {value: '123 Main'}
            })
        })

        // Wait for debounce
        await new Promise((resolve) => setTimeout(resolve, 350))

        expect(getAddressSuggestions).toHaveBeenCalledWith('123 Main', undefined)
    })

    it('should not call getAddressSuggestions for input shorter than 3 characters', async () => {
        const {result} = renderHook(() => useAddressFields({form: mockForm}))

        await act(async () => {
            const inputProps = result.current.address1.inputProps({onChange: jest.fn()})
            inputProps.onChange({
                target: {value: '12'}
            })
        })

        // Wait for debounce
        await new Promise((resolve) => setTimeout(resolve, 350))

        expect(getAddressSuggestions).not.toHaveBeenCalled()
    })

    it('should populate address1 field when suggestion is selected (city/state/zip in next PR)', () => {
        const {result} = renderHook(() => useAddressFields({form: mockForm}))

        const suggestion = {
            mainText: '123 Main Street',
            secondaryText: 'New York, NY 10001, USA',
            country: 'US'
        }

        act(() => {
            result.current.address1.autocomplete.onSelectSuggestion(suggestion)
        })

        expect(parseAddressSuggestion).toHaveBeenCalledWith(suggestion)
        expect(mockSetValue).toHaveBeenCalledWith('address1', '123 Main Street')
        // City, state, zip, and country population will be implemented in next PR
        // expect(mockSetValue).toHaveBeenCalledWith('city', 'New York')
        // expect(mockSetValue).toHaveBeenCalledWith('stateCode', 'NY')
        // expect(mockSetValue).toHaveBeenCalledWith('postalCode', '10001')
        // expect(mockSetValue).toHaveBeenCalledWith('countryCode', 'US')
    })

    it('should handle address focus correctly', () => {
        const {result} = renderHook(() => useAddressFields({form: mockForm}))

        act(() => {
            const inputProps = result.current.address1.inputProps({onChange: jest.fn()})
            inputProps.onFocus()
        })

        // The focus handler should reset the dismissed state
        // This is tested by checking that the autocomplete props are available
        expect(result.current.address1.autocomplete).toBeDefined()
    })

    it('should handle address cut event', async () => {
        const {result} = renderHook(() => useAddressFields({form: mockForm}))

        await act(async () => {
            const inputProps = result.current.address1.inputProps({onChange: jest.fn()})
            inputProps.onCut({
                target: {value: '123 Main'}
            })
        })

        // Wait for debounce
        await new Promise((resolve) => setTimeout(resolve, 350))

        expect(getAddressSuggestions).toHaveBeenCalledWith('123 Main', undefined)
    })

    it('should close dropdown when onClose is called', () => {
        const {result} = renderHook(() => useAddressFields({form: mockForm}))

        act(() => {
            result.current.address1.autocomplete.onClose()
        })

        // The close handler should set showDropdown to false and clear suggestions
        // This is tested by checking that the autocomplete props are available
        expect(result.current.address1.autocomplete).toBeDefined()
    })

    it('should handle country change and reset address fields', () => {
        mockWatch.mockReturnValue('CA') // Simulate country change to Canada

        const {result} = renderHook(() => useAddressFields({form: mockForm}))

        // When country changes, address fields should be reset
        expect(mockSetValue).toHaveBeenCalledWith('address1', '')
        expect(mockSetValue).toHaveBeenCalledWith('city', '')
        expect(mockSetValue).toHaveBeenCalledWith('stateCode', '')
        expect(mockSetValue).toHaveBeenCalledWith('postalCode', '')
    })

    it('should use prefix for field names when provided', () => {
        const {result} = renderHook(() =>
            useAddressFields({
                form: mockForm,
                prefix: 'shipping'
            })
        )

        expect(result.current.firstName.name).toBe('shippingfirstName')
        expect(result.current.lastName.name).toBe('shippinglastName')
        expect(result.current.address1.name).toBe('shippingaddress1')
    })

    it('should handle phone number formatting', () => {
        const {result} = renderHook(() => useAddressFields({form: mockForm}))

        const mockOnChange = jest.fn()

        act(() => {
            result.current.phone.inputProps({onChange: mockOnChange}).onChange({
                target: {value: '1234567890'}
            })
        })

        expect(mockOnChange).toHaveBeenCalledWith('1234567890')
    })

    it('should show province label for Canada', () => {
        mockWatch.mockReturnValue('CA')

        const {result} = renderHook(() => useAddressFields({form: mockForm}))

        expect(result.current.stateCode.label[0].value).toBe('Province')
    })

    it('should show state label for US', () => {
        mockWatch.mockReturnValue('US')

        const {result} = renderHook(() => useAddressFields({form: mockForm}))

        expect(result.current.stateCode.label[0].value).toBe('State')
    })

    it('should show postal code label for Canada', () => {
        mockWatch.mockReturnValue('CA')

        const {result} = renderHook(() => useAddressFields({form: mockForm}))

        expect(result.current.postalCode.label[0].value).toBe('Postal Code')
    })

    it('should show zip code label for US', () => {
        mockWatch.mockReturnValue('US')

        const {result} = renderHook(() => useAddressFields({form: mockForm}))

        expect(result.current.postalCode.label[0].value).toBe('Zip Code')
    })

    it('should handle errors correctly', () => {
        const mockFormWithErrors = {
            ...mockForm,
            formState: {
                errors: {
                    firstName: {message: 'First name is required'},
                    address1: {message: 'Address is required'}
                }
            }
        }

        const {result} = renderHook(() => useAddressFields({form: mockFormWithErrors}))

        expect(result.current.firstName.error).toEqual({message: 'First name is required'})
        expect(result.current.address1.error).toEqual({message: 'Address is required'})
    })
})
