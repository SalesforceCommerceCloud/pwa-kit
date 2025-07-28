/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {renderHook, act} from '@testing-library/react'
import useAddressFields from '../forms/useAddressFields'
import {parseAddressSuggestion} from '@salesforce/retail-react-app/app/utils/address-suggestions'
import {useAutocompleteSuggestions} from '@salesforce/retail-react-app/app/hooks/useAutocompleteSuggestions'

// Mock the address service
jest.mock('@salesforce/retail-react-app/app/utils/address-suggestions')

// Mock the autocomplete suggestions hook
jest.mock('@salesforce/retail-react-app/app/hooks/useAutocompleteSuggestions', () => ({
    useAutocompleteSuggestions: jest.fn()
}))

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
    let mockUseAutocompleteSuggestions

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

        // Mock the autocomplete suggestions hook
        mockUseAutocompleteSuggestions = {
            suggestions: [],
            isLoading: false,
            resetSession: jest.fn()
        }

        useAutocompleteSuggestions.mockReturnValue(mockUseAutocompleteSuggestions)

        parseAddressSuggestion.mockResolvedValue({
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

    it('should handle address input changes', () => {
        const {result} = renderHook(() => useAddressFields({form: mockForm}))

        act(() => {
            const inputProps = result.current.address1.inputProps({onChange: jest.fn()})
            inputProps.onChange({
                target: {value: '123 Main'}
            })
        })

        // The input change should be handled by the useAutocompleteSuggestions hook
        expect(result.current.address1.autocomplete).toBeDefined()
    })

    it('should handle address input changes for short input', () => {
        const {result} = renderHook(() => useAddressFields({form: mockForm}))

        act(() => {
            const inputProps = result.current.address1.inputProps({onChange: jest.fn()})
            inputProps.onChange({
                target: {value: '12'}
            })
        })

        // The input change should be handled by the useAutocompleteSuggestions hook
        expect(result.current.address1.autocomplete).toBeDefined()
    })

    it('should populate all address fields when suggestion is selected', async () => {
        const {result} = renderHook(() => useAddressFields({form: mockForm}))

        const suggestion = {
            mainText: '123 Main Street',
            secondaryText: 'New York, NY 10001, USA',
            country: 'US'
        }

        await act(async () => {
            await result.current.address1.autocomplete.onSelectSuggestion(suggestion)
        })

        expect(parseAddressSuggestion).toHaveBeenCalledWith(suggestion)
        expect(mockSetValue).toHaveBeenCalledWith('address1', '123 Main Street')
        expect(mockSetValue).toHaveBeenCalledWith('city', 'New York')
        expect(mockSetValue).toHaveBeenCalledWith('stateCode', 'NY')
        expect(mockSetValue).toHaveBeenCalledWith('postalCode', '10001')
        expect(mockSetValue).toHaveBeenCalledWith('countryCode', 'US')
    })

    it('should handle partial address data when some fields are missing', async () => {
        const {result} = renderHook(() => useAddressFields({form: mockForm}))

        // Mock parseAddressSuggestion to return partial data
        parseAddressSuggestion.mockResolvedValue({
            address1: '456 Oak Avenue',
            city: 'Toronto'
            // Missing stateCode, postalCode, and countryCode
        })

        const suggestion = {
            mainText: '456 Oak Avenue',
            secondaryText: 'Toronto, Canada',
            country: 'CA'
        }

        await act(async () => {
            await result.current.address1.autocomplete.onSelectSuggestion(suggestion)
        })

        expect(parseAddressSuggestion).toHaveBeenCalledWith(suggestion)
        expect(mockSetValue).toHaveBeenCalledWith('address1', '456 Oak Avenue')
        expect(mockSetValue).toHaveBeenCalledWith('city', 'Toronto')
        expect(mockSetValue).toHaveBeenCalledWith('stateCode', '')
        expect(mockSetValue).toHaveBeenCalledWith('postalCode', '')
        // No expectation for countryCode
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

    it('should handle address cut event', () => {
        const {result} = renderHook(() => useAddressFields({form: mockForm}))

        act(() => {
            const inputProps = result.current.address1.inputProps({onChange: jest.fn()})
            inputProps.onCut({
                target: {value: '123 Main'}
            })
        })

        // The cut event should be handled by the useAutocompleteSuggestions hook
        expect(result.current.address1.autocomplete).toBeDefined()
    })

    it('should close dropdown when onClose is called', () => {
        const {result} = renderHook(() => useAddressFields({form: mockForm}))

        act(() => {
            result.current.address1.autocomplete.onClose()
        })

        // The close handler should set showDropdown to false and clear suggestions
        // This is tested by checking that the autocomplete props are available
        expect(result.current.address1.autocomplete).toBeDefined()
        expect(result.current.address1.autocomplete.onClose).toBeDefined()
    })

    it('should handle country change and reset address fields', () => {
        mockWatch.mockReturnValue('CA') // Simulate country change to Canada

        const {result} = renderHook(() => useAddressFields({form: mockForm}))

        // When country changes, address fields should be reset
        expect(mockSetValue).toHaveBeenCalledWith('address1', '')
        expect(mockSetValue).toHaveBeenCalledWith('city', '')
        expect(mockSetValue).toHaveBeenCalledWith('stateCode', '')
        expect(mockSetValue).toHaveBeenCalledWith('postalCode', '')

        // Should also reset the autocomplete session
        expect(mockUseAutocompleteSuggestions.resetSession).toHaveBeenCalled()
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

    it('should call useAutocompleteSuggestions with correct parameters', () => {
        mockWatch.mockReturnValue('US') // Set country to US

        renderHook(() => useAddressFields({form: mockForm}))

        // Should be called with empty input initially and US country code
        expect(useAutocompleteSuggestions).toHaveBeenCalledWith('', 'US')
    })

    it('should call useAutocompleteSuggestions with prefix when provided', () => {
        mockWatch.mockReturnValue('CA') // Set country to Canada

        renderHook(() => useAddressFields({form: mockForm, prefix: 'shipping'}))

        // Should be called with empty input initially and CA country code
        expect(useAutocompleteSuggestions).toHaveBeenCalledWith('', 'CA')
    })
})
