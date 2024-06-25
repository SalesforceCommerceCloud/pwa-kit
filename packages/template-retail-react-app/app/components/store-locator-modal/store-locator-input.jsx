/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {useIntl} from 'react-intl'
import PropTypes from 'prop-types'
import {
    Button,
    InputGroup,
    Select,
    Box,
    Input
} from '@salesforce/retail-react-app/app/components/shared/ui'
import {Controller} from 'react-hook-form'
import {SUPPORTED_STORE_LOCATOR_COUNTRIES} from '@salesforce/retail-react-app/app/constants'

const StoreLocatorInput = ({
    form,
    submitForm,
    searchStoresParams,
    userHasSetGeolocation,
    getUserGeolocation
}) => {
    const {control} = form
    const intl = useIntl()
    // console.log("(JEREMY) searchStoresParams: ", searchStoresParams)
    // console.log("(JEREMY) userHasSetGeolocation: ", userHasSetGeolocation)
    // console.log("(JEREMY) searchStoresParams: ", searchStoresParams)
    return (
        <form id="store-locator-form" onSubmit={form.handleSubmit(submitForm)}>
            <InputGroup>
                <Controller
                    name="countryCode"
                    control={control}
                    defaultValue={userHasSetGeolocation ? searchStoresParams?.countryCode : ''}
                    render={({field}) => {
                        return SUPPORTED_STORE_LOCATOR_COUNTRIES.length !== 0 ? (
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
                    defaultValue={userHasSetGeolocation ? searchStoresParams?.postalCode : ''}
                    render={({field}) => {
                        return (
                            <Input
                                {...field}
                                placeholder={intl.formatMessage({
                                    id: 'store_locator.field.placeholder.enter_postal_code',
                                    defaultMessage: 'Enter postal code'
                                })}
                            />
                        )
                    }}
                ></Controller>
                <Button
                    key="find-button"
                    type="submit"
                    onClick={() => {}}
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
            <Button
                key="use-my-location-button"
                onClick={getUserGeolocation}
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
    userHasSetGeolocation: PropTypes.bool
}

export default StoreLocatorInput
