/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useEffect} from 'react'
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
import {useStoreLocator} from '@salesforce/retail-react-app/app/hooks/use-store-locator'
import {useGeolocation} from '@salesforce/retail-react-app/app/hooks/use-geo-location'

export const StoreLocatorForm = () => {
    const {config, formValues, setFormValues, setDeviceCoordinates} = useStoreLocator()
    const {coordinates, error, refresh} = useGeolocation()
    const form = useForm({
        mode: 'onChange',
        reValidateMode: 'onChange',
        defaultValues: {
            countryCode: formValues.countryCode,
            postalCode: formValues.postalCode
        }
    })
    const {control} = form
    useEffect(() => {
        if (coordinates.latitude && coordinates.longitude) {
            setDeviceCoordinates(coordinates)
        }
    }, [coordinates])

    const showCountrySelector = config.supportedCountries.length > 0

    const submitForm = (formValues) => {
        setFormValues(formValues)
    }

    const clearForm = () => {
        form.reset()
        setFormValues({
            countryCode: '',
            postalCode: ''
        })
    }

    return (
        <form
            id="store-locator-form"
            onSubmit={(e) => {
                e.preventDefault()
                void form.handleSubmit(submitForm)(e)
            }}
        >
            <InputGroup>
                {showCountrySelector && (
                    <Controller
                        name="countryCode"
                        control={control}
                        rules={{
                            required: 'Please select a country.'
                        }}
                        render={({field}) => {
                            return (
                                <FormControl isInvalid={!!form.formState.errors.countryCode}>
                                    <Select
                                        {...field}
                                        marginBottom="10px"
                                        placeholder={'Select a country'}
                                        borderColor="gray.500"
                                    >
                                        {config.supportedCountries.map(
                                            ({countryCode, countryName}) => {
                                                return (
                                                    <option value={countryCode} key={countryCode}>
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
                        required: 'Please enter a postal code.'
                    }}
                    render={({field}) => {
                        return (
                            <FormControl isInvalid={!!form.formState.errors.postalCode}>
                                <Input {...field} placeholder={'Enter postal code'} />
                                {form.formState.errors.postalCode && (
                                    <FormErrorMessage sx={{top: '-20px'}} color="red.600">
                                        {form.formState.errors.postalCode.message}
                                    </FormErrorMessage>
                                )}
                            </FormControl>
                        )
                    }}
                />
                <Button key="find-button" type="submit" width="15%" marginLeft={2} variant="solid">
                    Find
                </Button>
            </InputGroup>
            <Box
                style={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}
                margin="10px"
            >
                Or
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
                Use My Location
            </Button>
            <FormControl isInvalid={!!error}>
                <FormErrorMessage
                    color="red.600"
                    alignItems="center"
                    justifyContent="center"
                    marginBottom={4}
                >
                    Please agree to share your location
                </FormErrorMessage>
            </FormControl>
        </form>
    )
}
