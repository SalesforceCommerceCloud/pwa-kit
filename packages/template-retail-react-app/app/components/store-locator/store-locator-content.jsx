/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useState, useEffect} from 'react'
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
import {
    SUPPORTED_STORE_LOCATOR_COUNTRIES,
    DEFAULT_STORE_LOCATORY_COUNTRY,
    DEFAULT_STORE_LOCATORY_POSTAL_CODE
} from '@salesforce/retail-react-app/app/constants'

const StoreLocatorContent = () => {
    const [searchStoresParams, setSearchStoresParams] = useState({})
    const intl = useIntl()
    var formattedStoreLocatorCountries = SUPPORTED_STORE_LOCATOR_COUNTRIES.map(
        ({countryCode, countryName}) => {
            return {countryCode: countryCode, countryName: intl.formatMessage(countryName)}
        }
    )
    var defaultCountryCode = formattedStoreLocatorCountries.find(
        (obj) => obj.countryName == intl.formatMessage(DEFAULT_STORE_LOCATORY_COUNTRY)
    ).countryCode
    const formProps = useForm({
        mode: 'onChange',
        reValidateMode: 'onChange',
        defaultValues: {
            countryCode: defaultCountryCode
        }
    })
    const {control, handleSubmit} = formProps
    useEffect(() => {
        setSearchStoresParams({
            countryCode: defaultCountryCode,
            postalCode: DEFAULT_STORE_LOCATORY_POSTAL_CODE
        })
    }, [])

    return (
        <>
            <Heading fontSize="2xl" style={{marginBottom: '25px'}}>
                {intl.formatMessage({
                    id: 'store_locator.title',
                    defaultMessage: 'Find a Store'
                })}
            </Heading>
            <Controller
                name="countryCode"
                control={control}
                defaultValue={defaultCountryCode}
                render={({field}) => {
                    return (
                        <Box style={{marginBottom: '10px'}}>
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
                        </Box>
                    )
                }}
            ></Controller>
            <InputGroup>
                <Controller
                    name="postalCode"
                    control={control}
                    defaultValue={DEFAULT_STORE_LOCATORY_POSTAL_CODE}
                    render={({field}) => {
                        return <Input {...field} />
                    }}
                ></Controller>
                <Button
                    key="cart-button"
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
                <StoresList searchStoresParams={searchStoresParams} />
            </Accordion>
        </>
    )
}

StoreLocatorContent.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    setIsOpen: PropTypes.func.isRequired
}

export default StoreLocatorContent
