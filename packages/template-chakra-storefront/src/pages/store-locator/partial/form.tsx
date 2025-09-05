/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useEffect} from 'react'
import {Box, Button, Stack} from '@chakra-ui/react'
import {useForm} from 'react-hook-form'
import {useStoreLocator} from '../hooks/use-store-locator'
import type {FormValues} from '../contexts/provider'
import {useGeolocation} from '../hooks/use-geo-location'

export const StoreLocatorForm: React.FC = () => {
    const {config, formValues, setFormValues, setDeviceCoordinates} = useStoreLocator()

    const {coordinates, error, refresh} = useGeolocation()
    const form = useForm<FormValues>({
        mode: 'onChange',
        reValidateMode: 'onChange',
        defaultValues: {
            countryCode: formValues.countryCode,
            postalCode: formValues.postalCode
        }
    })
    const {register} = form
    useEffect(() => {
        if (coordinates.latitude && coordinates.longitude) {
            setDeviceCoordinates(coordinates)
        }
    }, [coordinates])

    const showCountrySelector = config.supportedCountries.length > 0

    const submitForm = (formValues: FormValues) => {
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
            {showCountrySelector && (
                <Box>
                    <select
                        {...register('countryCode', {
                            required: 'Please select a country.'
                        })}
                        style={{
                            marginBottom: '10px',
                            borderColor: 'gray.500',
                            width: '100%',
                            padding: '8px',
                            borderRadius: '4px',
                            border: '1px solid #ccc'
                        }}
                    >
                        <option value="">Select a country</option>
                        {config.supportedCountries.map(({countryCode, countryName}) => {
                            return (
                                <option value={countryCode} key={countryCode}>
                                    {countryName}
                                </option>
                            )
                        })}
                    </select>
                    {form.formState.errors.countryCode && (
                        <Box color="red.600" fontSize="sm" marginBottom="10px">
                            {form.formState.errors.countryCode.message}
                        </Box>
                    )}
                </Box>
            )}
            <Stack direction="row" gap={2}>
                <Box flex="1">
                    <input
                        {...register('postalCode', {
                            required: 'Please enter a postal code.'
                        })}
                        placeholder="Enter postal code"
                        style={{
                            width: '100%',
                            padding: '8px',
                            borderRadius: '4px',
                            border: '1px solid #ccc'
                        }}
                    />
                    {form.formState.errors.postalCode && (
                        <Box color="red.600" fontSize="sm" position="absolute" top="-20px">
                            {form.formState.errors.postalCode.message}
                        </Box>
                    )}
                </Box>
                <Button key="find-button" type="submit" width="15%" marginLeft={2} variant="solid">
                    Find
                </Button>
            </Stack>
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
            {error && (
                <Box color="red.600" fontSize="sm" textAlign="center" marginBottom={4}>
                    Please agree to share your location
                </Box>
            )}
        </form>
    )
}
