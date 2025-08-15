/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {renderHook, act} from '@testing-library/react'
import useAddressFields from '../forms/useAddressFields'
import {
    processAddressSuggestion,
    setAddressFieldValues
} from '@salesforce/retail-react-app/app/utils/address-suggestions'
import {useAutocompleteSuggestions} from '@salesforce/retail-react-app/app/hooks/useAutocompleteSuggestions'

jest.mock('@salesforce/retail-react-app/app/utils/address-suggestions')

jest.mock('@salesforce/retail-react-app/app/hooks/useAutocompleteSuggestions', () => ({
    useAutocompleteSuggestions: jest.fn()
}))

jest.mock('react-intl', () => ({
    useIntl: () => ({
        formatMessage: jest.fn((message) => message.defaultMessage || message.id)
    }),
    defineMessages: jest.fn((messages) => messages)
}))

jest.mock('@salesforce/retail-react-app/app/utils/phone-utils', () => ({
    formatPhoneNumber: jest.fn((value) => value)
}))

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

        mockUseAutocompleteSuggestions = {
            suggestions: [],
            isLoading: false,
            resetSession: jest.fn()
        }

        useAutocompleteSuggestions.mockReturnValue(mockUseAutocompleteSuggestions)

        processAddressSuggestion.mockResolvedValue({
            address1: '123 Main Street',
            city: 'New York',
            stateCode: 'NY',
            postalCode: '10001',
            countryCode: 'US'
        })

        setAddressFieldValues.mockImplementation((setValue, prefix, addressFields) => {
            setValue(`${prefix}address1`, addressFields.address1)
            if (addressFields.city) {
                setValue(`${prefix}city`, addressFields.city)
            }
            if (addressFields.stateCode) {
                setValue(`${prefix}stateCode`, addressFields.stateCode)
            }
            if (addressFields.postalCode) {
                setValue(`${prefix}postalCode`, addressFields.postalCode)
            }
            if (addressFields.countryCode) {
                setValue(`${prefix}countryCode`, addressFields.countryCode)
            }
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

        expect(processAddressSuggestion).toHaveBeenCalledWith(suggestion)
        expect(setAddressFieldValues).toHaveBeenCalledWith(mockSetValue, '', {
            address1: '123 Main Street',
            city: 'New York',
            stateCode: 'NY',
            postalCode: '10001',
            countryCode: 'US'
        })
    })

    it('should handle partial address data when some fields are missing', async () => {
        const {result} = renderHook(() => useAddressFields({form: mockForm}))

        processAddressSuggestion.mockResolvedValue({
            address1: '456 Oak Avenue',
            city: 'Toronto'
        })

        const suggestion = {
            mainText: '456 Oak Avenue',
            secondaryText: 'Toronto, Canada',
            country: 'CA'
        }

        await act(async () => {
            await result.current.address1.autocomplete.onSelectSuggestion(suggestion)
        })

        expect(processAddressSuggestion).toHaveBeenCalledWith(suggestion)
        expect(setAddressFieldValues).toHaveBeenCalledWith(mockSetValue, '', {
            address1: '456 Oak Avenue',
            city: 'Toronto'
        })
    })

    it('should handle address focus correctly', () => {
        const {result} = renderHook(() => useAddressFields({form: mockForm}))

        act(() => {
            const inputProps = result.current.address1.inputProps({onChange: jest.fn()})
            inputProps.onFocus()
        })

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

        expect(result.current.address1.autocomplete).toBeDefined()
    })

    it('should close dropdown when onClose is called', () => {
        const {result} = renderHook(() => useAddressFields({form: mockForm}))

        act(() => {
            result.current.address1.autocomplete.onClose()
        })

        expect(result.current.address1.autocomplete).toBeDefined()
        expect(result.current.address1.autocomplete.onClose).toBeDefined()
    })

    it('should handle country change and reset address fields', () => {
        let callCount = 0
        mockWatch.mockImplementation(() => {
            callCount++
            return callCount === 1 ? 'US' : 'CA'
        })

        const {rerender} = renderHook(() => useAddressFields({form: mockForm}))

        rerender()

        expect(mockSetValue).toHaveBeenCalledWith('address1', '')
        expect(mockSetValue).toHaveBeenCalledWith('city', '')
        expect(mockSetValue).toHaveBeenCalledWith('stateCode', '')
        expect(mockSetValue).toHaveBeenCalledWith('postalCode', '')

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
        mockWatch.mockReturnValue('US')

        renderHook(() => useAddressFields({form: mockForm}))

        expect(useAutocompleteSuggestions).toHaveBeenCalledWith('', 'US')
    })

    it('should call useAutocompleteSuggestions with prefix when provided', () => {
        mockWatch.mockReturnValue('CA')

        renderHook(() => useAddressFields({form: mockForm, prefix: 'shipping'}))

        expect(useAutocompleteSuggestions).toHaveBeenCalledWith('', 'CA')
    })
})
