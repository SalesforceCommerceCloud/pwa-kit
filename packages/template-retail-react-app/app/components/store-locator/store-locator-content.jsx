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
    Heading,
    Button,
    InputGroup,
    Accordion,
    AccordionItem,
    Select,
    Box,
    Input
} from '@salesforce/retail-react-app/app/components/shared/ui'
import StoresList from '@salesforce/retail-react-app/app/components/store-locator/stores-list'
import {Controller, useForm} from 'react-hook-form'
import {SUPPORTED_STORE_LOCATOR_COUNTRIES} from '@salesforce/retail-react-app/app/constants'

const StoreLocatorContent = (props) => {
    const {searchStoresData, searchStoresParams, setSearchStoresParams} = props

    const intl = useIntl()
    const formProps = useForm({
        mode: 'onChange',
        reValidateMode: 'onChange',
        defaultValues: {
            countryCode: searchStoresParams?.countryCode,
            postalCode: searchStoresParams?.postalCode
        }
    })
    const {control, handleSubmit} = formProps

    return (
        <>
            <Heading fontSize="2xl" style={{marginBottom: '25px'}}>
                {intl.formatMessage({
                    id: 'store_locator.title',
                    defaultMessage: 'Find a Store'
                })}
            </Heading>
            <InputGroup>
                <Controller
                    name="postalCode"
                    control={control}
                    defaultValue={searchStoresParams?.postalCode}
                    render={({field}) => {
                        return <Input {...field} marginBottom="10px" />
                    }}
                ></Controller>
            </InputGroup>
            <InputGroup>
                <Controller
                    name="countryCode"
                    control={control}
                    defaultValue={searchStoresParams?.countryCode}
                    render={({field}) => {
                        return (
                            <Select {...field}>
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
                        )
                    }}
                ></Controller>
                <Button
                    key="find-button"
                    onClick={handleSubmit(async (formData) => {
                        const {postalCode, countryCode} = formData
                        setSearchStoresParams({
                            postalCode: postalCode,
                            countryCode: countryCode
                        })
                    })}
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
                key="cart-button"
                onClick={() => {}}
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
            <Accordion allowMultiple flex={[1, 1, 1, 5]}>
                {/* Details */}
                <AccordionItem>
                    <Box
                        flex="1"
                        fontWeight="semibold"
                        fontSize="md"
                        style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            margin: '20px'
                        }}
                    >
                        {intl.formatMessage({
                            id: 'store_locator.description.viewing_within',
                            defaultMessage: 'Viewing stores within 100 miles'
                        })}
                    </Box>
                </AccordionItem>
                <StoresList storesData={searchStoresData} />
            </Accordion>
        </>
    )
}

StoreLocatorContent.propTypes = {
    searchStoresData: PropTypes.object,
    searchStoresParams: PropTypes.object,
    setSearchStoresParams: PropTypes.func
}

export default StoreLocatorContent
