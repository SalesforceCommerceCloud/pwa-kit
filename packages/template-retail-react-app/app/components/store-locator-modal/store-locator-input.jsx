/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {useIntl} from 'react-intl'
import PropTypes from 'prop-types'

// Components
import {
    Button,
    InputGroup,
    Select,
    Box,
    Input,
    FormControl,
    FormErrorMessage
} from '@salesforce/retail-react-app/app/components/shared/ui'
import {AlertIcon} from '@salesforce/retail-react-app/app/components/icons'
import {Controller} from 'react-hook-form'

// Others
import {SUPPORTED_STORE_LOCATOR_COUNTRIES} from '@salesforce/retail-react-app/app/constants'
import {useStoreLocator} from '@salesforce/retail-react-app/app/components/store-locator-modal/hooks'
import {useGeolocation} from '@salesforce/retail-react-app/app/components/store-locator-modal/store-locator-content'

const StoreLocatorInput = ({form, submitForm}) => {
    const {control} = form
    const intl = useIntl()
    const getUserGeolocation = useGeolocation()
    const {
        searchStoresParams,
        userHasSetManualGeolocation,
        userWantsToShareLocation,
        setUserWantsToShareLocation,
        automaticGeolocationHasFailed
    } = useStoreLocator()

    return (
        <form id="store-locator-form" onSubmit={form.handleSubmit(submitForm)}>
            <InputGroup>
                <Controller
                    name="countryCode"
                    control={control}
                    defaultValue={
                        userHasSetManualGeolocation ? searchStoresParams?.countryCode : ''
                    }
                    rules={{
                        required: intl.formatMessage({
                            id: 'store_locator.error.please_select_a_country',
                            defaultMessage: 'Please select a country.'
                        })
                    }}
                    render={({field}) => {
                        return SUPPORTED_STORE_LOCATOR_COUNTRIES.length !== 0 ? (
                            <FormControl isInvalid={form.formState.errors.countryCode}>
                                <Select
                                    {...field}
                                    marginBottom="10px"
                                    placeholder={intl.formatMessage({
                                        id: 'store_locator.action.select_a_country',
                                        defaultMessage: 'Select a country'
                                    })}
                                >
                                    {SUPPORTED_STORE_LOCATOR_COUNTRIES.map(
                                        ({countryCode, countryName}) => {
                                            return (
                                                <option value={countryCode} key={countryCode}>
                                                    {intl.formatMessage(countryName)}
                                                </option>
                                            )
                                        }
                                    )}
                                </Select>
                                {form.formState.errors.countryCode && (
                                    <FormErrorMessage sx={{marginBottom: '10px'}} color="red.600">
                                        <AlertIcon aria-hidden="true" mr={2} />
                                        {form.formState.errors.countryCode.message}
                                    </FormErrorMessage>
                                )}
                            </FormControl>
                        ) : (
                            <></>
                        )
                    }}
                ></Controller>
            </InputGroup>
            <InputGroup>
                <Controller
                    name="postalCode"
                    control={control}
                    rules={{
                        required: intl.formatMessage({
                            id: 'store_locator.error.please_enter_a_postal_code',
                            defaultMessage: 'Please enter a postal code.'
                        })
                    }}
                    defaultValue={userHasSetManualGeolocation ? searchStoresParams?.postalCode : ''}
                    render={({field}) => {
                        return (
                            <FormControl isInvalid={form.formState.errors.postalCode}>
                                <Input
                                    {...field}
                                    placeholder={intl.formatMessage({
                                        id: 'store_locator.field.placeholder.enter_postal_code',
                                        defaultMessage: 'Enter postal code'
                                    })}
                                />
                                {form.formState.errors.postalCode && (
                                    <FormErrorMessage sx={{top: '-20px'}} color="red.600">
                                        <AlertIcon aria-hidden="true" mr={2} />
                                        {form.formState.errors.postalCode.message}
                                    </FormErrorMessage>
                                )}
                            </FormControl>
                        )
                    }}
                ></Controller>
                <Button
                    key="find-button"
                    type="submit"
                    onClick={() => {
                        setUserWantsToShareLocation(false)
                    }}
                    width="15%"
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
            {/* TODO: a bug with my code: clicking this button does not show the error message */}
            <Button
                key="use-my-location-button"
                onClick={() => {
                    setUserWantsToShareLocation(true)
                    getUserGeolocation()
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
            <FormControl isInvalid={automaticGeolocationHasFailed && userWantsToShareLocation}>
                <FormErrorMessage
                    color="red.600"
                    alignItems="center"
                    justifyContent="center"
                    marginBottom={4}
                >
                    <AlertIcon aria-hidden="true" mr={2} />
                    {intl.formatMessage({
                        id: 'store_locator.error.agree_to_share_your_location',
                        defaultMessage: 'Please agree to share your location'
                    })}
                </FormErrorMessage>
            </FormControl>
        </form>
    )
}

StoreLocatorInput.propTypes = {
    form: PropTypes.object,
    storesInfo: PropTypes.array,
    searchStoresParams: PropTypes.object,
    setSearchStoresParams: PropTypes.func,
    submitForm: PropTypes.func,
    getUserGeolocation: PropTypes.func,
    userHasSetManualGeolocation: PropTypes.bool,
    automaticGeolocationHasFailed: PropTypes.bool,
    setUserWantsToShareLocation: PropTypes.func,
    userWantsToShareLocation: PropTypes.bool
}

export default StoreLocatorInput
