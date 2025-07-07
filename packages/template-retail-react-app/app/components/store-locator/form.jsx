/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useEffect, useRef, useState} from 'react'
import {
    Box,
    Button,
    InputGroup,
    Select,
    FormControl,
    FormErrorMessage,
    Input
} from '@chakra-ui/react'
import {useForm, Controller} from 'react-hook-form'
import {useIntl} from 'react-intl'
import {useStoreLocator} from '@salesforce/retail-react-app/app/hooks/use-store-locator'
import {useGeolocation} from '@salesforce/retail-react-app/app/hooks/use-geo-location'
import {useSelectedStore} from '@salesforce/retail-react-app/app/hooks/use-selected-store'

export const StoreLocatorForm = () => {
    const intl = useIntl()
    const {config, formValues, setFormValues, setDeviceCoordinates} = useStoreLocator()
    const {coordinates, error, refresh} = useGeolocation()
    const {selectedStore} = useSelectedStore()
    const initialLoadDone = useRef(false)
    const [shouldUseLocation, setShouldUseLocation] = useState(false)

    const form = useForm({
        mode: 'onChange',
        reValidateMode: 'onChange',
        defaultValues: {
            countryCode: formValues.countryCode,
            postalCode: formValues.postalCode
        }
    })
    const {control, reset} = form

    useEffect(() => {
        if (selectedStore && !initialLoadDone.current && !formValues.postalCode) {
            reset({
                countryCode: selectedStore.countryCode,
                postalCode: selectedStore.postalCode
            })
            setFormValues({
                countryCode: selectedStore.countryCode,
                postalCode: selectedStore.postalCode
            })
            initialLoadDone.current = true
        }
    }, [selectedStore, reset, setFormValues, formValues.postalCode])

    useEffect(() => {
        if (coordinates.latitude && coordinates.longitude && shouldUseLocation) {
            setDeviceCoordinates(coordinates)
            setShouldUseLocation(false)
        }
    }, [coordinates])

    const showCountrySelector = config.supportedCountries.length > 0

    const submitForm = (formValues) => {
        setFormValues(formValues)
    }

    const clearForm = () => {
        form.reset({
            countryCode: '',
            postalCode: ''
        })
        setFormValues({
            countryCode: '',
            postalCode: ''
        })
        initialLoadDone.current = false
        setShouldUseLocation(true)
    }

    return (
        <form
            id="store-locator-form"
            onSubmit={(e) => {
                e.preventDefault()
                void form.handleSubmit(submitForm)(e)
            }}
        >
            <Box as="fieldset">
                <InputGroup>
                    {showCountrySelector && (
                        <Controller
                            name="countryCode"
                            control={control}
                            rules={{
                                required: intl.formatMessage({
                                    id: 'store_locator.error.please_select_a_country',
                                    defaultMessage: 'Select a country.'
                                })
                            }}
                            render={({field}) => {
                                return (
                                    <FormControl isInvalid={!!form.formState.errors.countryCode}>
                                        <Select
                                            {...field}
                                            marginBottom="10px"
                                            placeholder={intl.formatMessage({
                                                id: 'store_locator.action.select_a_country',
                                                defaultMessage: 'Select a country'
                                            })}
                                            borderColor="gray.500"
                                        >
                                            {config.supportedCountries.map(
                                                ({countryCode, countryName}) => {
                                                    return (
                                                        <option
                                                            value={countryCode}
                                                            key={countryCode}
                                                        >
                                                            {countryName}
                                                        </option>
                                                    )
                                                }
                                            )}
                                        </Select>
                                        {form.formState.errors.countryCode && (
                                            <FormErrorMessage
                                                sx={{marginBottom: '10px'}}
                                                color="red.600"
                                            >
                                                {form.formState.errors.countryCode.message}
                                            </FormErrorMessage>
                                        )}
                                    </FormControl>
                                )
                            }}
                        />
                    )}
                </InputGroup>
                <InputGroup>
                    <Controller
                        name="postalCode"
                        control={control}
                        rules={{
                            required: intl.formatMessage({
                                id: 'store_locator.error.please_enter_a_postal_code',
                                defaultMessage: 'Enter a postal code.'
                            })
                        }}
                        render={({field}) => {
                            return (
                                <FormControl isInvalid={!!form.formState.errors.postalCode}>
                                    <Input
                                        {...field}
                                        placeholder={intl.formatMessage({
                                            id: 'store_locator.field.placeholder.enter_postal_code',
                                            defaultMessage: 'Enter postal code'
                                        })}
                                    />
                                    {form.formState.errors.postalCode && (
                                        <FormErrorMessage sx={{top: '-20px'}} color="red.600">
                                            {form.formState.errors.postalCode.message}
                                        </FormErrorMessage>
                                    )}
                                </FormControl>
                            )
                        }}
                    />
                    <Button
                        key="find-button"
                        type="submit"
                        width="15%"
                        marginLeft={2}
                        variant="solid"
                    >
                        {intl.formatMessage({
                            id: 'store_locator.action.find',
                            defaultMessage: 'Find'
                        })}
                    </Button>
                </InputGroup>
                <Box
                    style={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}
                    margin="10px"
                >
                    {intl.formatMessage({
                        id: 'store_locator.description.or',
                        defaultMessage: 'Or'
                    })}
                </Box>
                <Button
                    onClick={() => {
                        clearForm()
                        refresh()
                    }}
                    width="100%"
                    variant="solid"
                    fontWeight="bold"
                    marginBottom={4}
                >
                    {intl.formatMessage({
                        id: 'store_locator.action.use_my_location',
                        defaultMessage: 'Use My Location'
                    })}
                </Button>
                <FormControl isInvalid={!!error}>
                    <FormErrorMessage
                        color="red.600"
                        alignItems="center"
                        justifyContent="center"
                        marginBottom={4}
                    >
                        {intl.formatMessage({
                            id: 'store_locator.error.agree_to_share_your_location',
                            defaultMessage: 'To use your location, enable location sharing.'
                        })}
                    </FormErrorMessage>
                </FormControl>
            </Box>
        </form>
    )
}
