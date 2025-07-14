/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useIntl, defineMessages} from 'react-intl'
import {useState, useRef, useCallback, useEffect} from 'react'
import {formatPhoneNumber} from '@salesforce/retail-react-app/app/utils/phone-utils'
import {
    stateOptions,
    provinceOptions
} from '@salesforce/retail-react-app/app/components/forms/state-province-options'
import {SHIPPING_COUNTRY_CODES} from '@salesforce/retail-react-app/app/constants'
import {
    getAddressSuggestions,
    parseAddressSuggestion
} from '@salesforce/retail-react-app/app/utils/address-suggestions' // TODO: replace with the actual API call to the address service

const messages = defineMessages({
    required: {defaultMessage: 'Required', id: 'use_address_fields.error.required'},
    firstName: {defaultMessage: 'First Name', id: 'use_address_fields.label.first_name'},
    lastName: {defaultMessage: 'Last Name', id: 'use_address_fields.label.last_name'},
    phone: {defaultMessage: 'Phone', id: 'use_address_fields.label.phone'},
    country: {defaultMessage: 'Country', id: 'use_address_fields.label.country'},
    address: {defaultMessage: 'Address', id: 'use_address_fields.label.address'},
    city: {defaultMessage: 'City', id: 'use_address_fields.label.city'},
    state: {defaultMessage: 'State', id: 'use_address_fields.label.state'},
    province: {defaultMessage: 'Province', id: 'use_address_fields.label.province'},
    zipCode: {defaultMessage: 'Zip Code', id: 'use_address_fields.label.zipCode'},
    postalCode: {defaultMessage: 'Postal Code', id: 'use_address_fields.label.postal_code'},
    stateCodeInvalid: {
        defaultMessage: 'Please enter 2-letter state/province.',
        id: 'use_address_fields.error.state_code_invalid'
    },
    preferred: {defaultMessage: 'Set as default', id: 'use_address_fields.label.preferred'}
})

/**
 * A React hook that provides the field definitions for an address form.
 * @param {Object} form - The object returned from `useForm`
 * @param {Object} form.control - The form control object
 * @param {Object} form.formState.errors - An object containing field errors
 * @returns {Object} Field definitions for use in a form
 */
export default function useAddressFields({
    form: {
        watch,
        control,
        setValue,
        formState: {errors}
    },
    prefix = ''
}) {
    const {formatMessage} = useIntl()

    // Address autocomplete state
    const [suggestions, setSuggestions] = useState([]) // no suggestions by default
    const [showDropdown, setShowDropdown] = useState(false) // dropdown is initially hidden
    const [isDismissed, setIsDismissed] = useState(false) // user has not dismissed the dropdown
    const [isLoading, setIsLoading] = useState(false) // loading state for the API call

    // Debounce timeout ref
    const debounceTimeoutRef = useRef(null)

    const countryCode = watch('countryCode')

    // Reset address fields when country changes
    useEffect(() => {
        // Clear address fields when country changes
        setValue(`${prefix}address1`, '')
        setValue(`${prefix}city`, '')
        setValue(`${prefix}stateCode`, '')
        setValue(`${prefix}postalCode`, '')
        // Clear autocomplete suggestions
        setSuggestions([])
        setShowDropdown(false)
        setIsDismissed(false)
    }, [countryCode, prefix, setValue])

    // Handle address input changes with debouncing
    const handleAddressInputChange = useCallback(
        async (value) => {
            // Clear any existing timeout
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current)
            }

            // If input is too short, clear suggestions
            if (!value || value.length < 3) {
                setSuggestions([])
                setShowDropdown(false)
                return
            }

            // Set loading state
            setIsLoading(true)

            // Debounce the API call
            debounceTimeoutRef.current = setTimeout(async () => {
                try {
                    const results = await getAddressSuggestions(value, countryCode)
                    setSuggestions(results)
                    setShowDropdown(true)
                    setIsDismissed(false)
                } catch (error) {
                    console.error('Error fetching address suggestions:', error)
                    setSuggestions([])
                } finally {
                    setIsLoading(false)
                }
            }, 300) // 300ms debounce
        },
        [countryCode]
    )

    // Handle address field focus when user clicks into the address field
    const handleAddressFocus = useCallback(() => {
        setIsDismissed(false) // Reset dismissal on new focus
    }, [])

    // Handle cut event
    const handleAddressCut = useCallback(
        (e) => {
            // Get the new value after the cut operation
            const newValue = e.target.value
            // Trigger the address change handler with the new value
            handleAddressInputChange(newValue)
        },
        [handleAddressInputChange]
    )

    // Handle click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            // Get the address input element
            const addressInput = document.querySelector(`input[name="${prefix}address1"]`)
            // Get the dropdown element
            const dropdown = document.querySelector('[data-testid="address-suggestion-dropdown"]')

            // If click is outside both the input and dropdown, close the dropdown
            if (
                addressInput &&
                dropdown &&
                !addressInput.contains(event.target) &&
                !dropdown.contains(event.target)
            ) {
                setShowDropdown(false)
                setIsDismissed(true)
                setSuggestions([])
            }
        }

        // Add click event listener
        document.addEventListener('mousedown', handleClickOutside)

        // Cleanup
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [prefix, setShowDropdown, setIsDismissed, setSuggestions])

    // Handle dropdown close when user clicks outside the dropdown
    const handleDropdownClose = useCallback(() => {
        setShowDropdown(false)
        setIsDismissed(true)
        setSuggestions([])
    }, [setShowDropdown, setIsDismissed, setSuggestions])

    // Handle suggestion selection
    const handleSuggestionSelect = useCallback(
        (suggestion) => {
            // Parse the address suggestion to extract individual fields
            const parsedFields = parseAddressSuggestion(suggestion)

            // Populate all address fields
            setValue(`${prefix}address1`, parsedFields.address1)
            if (parsedFields.city) {
                setValue(`${prefix}city`, parsedFields.city)
            }
            if (parsedFields.stateCode) {
                setValue(`${prefix}stateCode`, parsedFields.stateCode)
            }
            if (parsedFields.postalCode) {
                setValue(`${prefix}postalCode`, parsedFields.postalCode)
            }
            if (parsedFields.countryCode) {
                setValue(`${prefix}countryCode`, parsedFields.countryCode)
            }
            setShowDropdown(false)
            setIsDismissed(true)
            setSuggestions([])
        },
        [prefix, setValue]
    )

    // Define address fields
    const fields = {
        firstName: {
            name: `${prefix}firstName`,
            label: formatMessage(messages.firstName),
            defaultValue: '',
            type: 'text',
            autoComplete: 'given-name',
            rules: {
                required: formatMessage({
                    defaultMessage: 'Please enter your first name.',
                    id: 'use_address_fields.error.please_enter_first_name'
                })
            },
            error: errors[`${prefix}firstName`],
            control
        },
        lastName: {
            name: `${prefix}lastName`,
            label: formatMessage(messages.lastName),
            defaultValue: '',
            type: 'text',
            autoComplete: 'family-name',
            rules: {
                required: formatMessage({
                    defaultMessage: 'Please enter your last name.',
                    id: 'use_address_fields.error.please_enter_last_name'
                })
            },
            error: errors[`${prefix}lastName`],
            control
        },
        phone: {
            name: `${prefix}phone`,
            label: formatMessage(messages.phone),
            defaultValue: '',
            type: 'tel',
            autoComplete: 'tel',
            rules: {
                required: formatMessage({
                    defaultMessage: 'Please enter your phone number.',
                    id: 'use_address_fields.error.please_enter_phone_number'
                })
            },
            error: errors[`${prefix}phone`],
            inputProps: ({onChange}) => ({
                inputMode: 'numeric',
                onChange(evt) {
                    onChange(formatPhoneNumber(evt.target.value))
                }
            }),
            control
        },
        countryCode: {
            name: `${prefix}countryCode`,
            label: formatMessage(messages.country),
            defaultValue: 'US',
            type: 'select',
            options: SHIPPING_COUNTRY_CODES,
            rules: {
                required: formatMessage({
                    defaultMessage: 'Please select your country.',
                    id: 'use_address_fields.error.please_select_your_country'
                })
            },
            error: errors[`${prefix}countryCode`],
            control
        },
        address1: {
            name: `${prefix}address1`,
            label: formatMessage(messages.address),
            defaultValue: '',
            type: 'text',
            autoComplete: 'address-line1',
            rules: {
                required: formatMessage({
                    defaultMessage: 'Please enter your address.',
                    id: 'use_address_fields.error.please_select_your_address'
                })
            },
            error: errors[`${prefix}address1`],
            control,

            // inputProps with autocomplete functionality
            inputProps: ({onChange}) => ({
                onChange(evt) {
                    // Call original onChange first (this updates the form)
                    onChange(evt.target.value)
                    // Then handle autocomplete
                    handleAddressInputChange(evt.target.value)
                },
                onFocus: handleAddressFocus,
                onCut: handleAddressCut
            }),
            // Autocomplete-specific props
            autocomplete: {
                suggestions,
                showDropdown,
                isLoading,
                isDismissed,
                onInputChange: handleAddressInputChange,
                onFocus: handleAddressFocus,
                onClose: handleDropdownClose,
                onSelectSuggestion: handleSuggestionSelect
            }
        },
        city: {
            name: `${prefix}city`,
            label: formatMessage(messages.city),
            defaultValue: '',
            type: 'text',
            rules: {
                required: formatMessage({
                    defaultMessage: 'Please enter your city.',
                    id: 'use_address_fields.error.please_select_your_city'
                })
            },
            error: errors[`${prefix}city`],
            control
        },
        stateCode: {
            name: `${prefix}stateCode`,
            label: formatMessage(countryCode === 'CA' ? messages.province : messages.state),
            defaultValue: '',
            type: 'select',
            options: [
                {value: '', label: ''},
                ...(countryCode === 'CA' ? provinceOptions : stateOptions)
            ],
            rules: {
                required:
                    countryCode === 'CA'
                        ? 'Please select your province.' // FYI we won't translate this
                        : formatMessage({
                              defaultMessage: 'Please select your state.',
                              id: 'use_address_fields.error.please_select_your_state_or_province',
                              description: 'Error message for a blank state (US-specific checkout)'
                          })
            },
            error: errors[`${prefix}stateCode`],
            control
        },
        postalCode: {
            name: `${prefix}postalCode`,
            label: formatMessage(countryCode === 'CA' ? messages.postalCode : messages.zipCode),
            defaultValue: '',
            type: 'text',
            autoComplete: 'postal-code',
            rules: {
                required:
                    countryCode === 'CA'
                        ? 'Please enter your postal code.' // FYI we won't translate this
                        : formatMessage({
                              defaultMessage: 'Please enter your zip code.',
                              id: 'use_address_fields.error.please_enter_your_postal_or_zip',
                              description:
                                  'Error message for a blank zip code (US-specific checkout)'
                          })
            },
            error: errors[`${prefix}postalCode`],
            control
        },
        preferred: {
            name: `${prefix}preferred`,
            label: formatMessage(messages.preferred),
            defaultValue: false,
            type: 'checkbox',
            autoComplete: 'honorific-prefix',
            rules: {},
            control
        }
    }

    return fields
}
