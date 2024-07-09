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
    Accordion,
    AccordionItem,
    Box,
    Button
} from '@salesforce/retail-react-app/app/components/shared/ui'
import StoresList from '@salesforce/retail-react-app/app/components/store-locator-modal/stores-list'
import StoreLocatorInput from '@salesforce/retail-react-app/app/components/store-locator-modal/store-locator-input'
import {useSearchStores} from '@salesforce/commerce-sdk-react'
import {
    SUPPORTED_STORE_LOCATOR_COUNTRIES,
    DEFAULT_STORE_LOCATOR_COUNTRY,
    STORE_LOCATOR_DISTANCE,
    STORE_LOCATOR_NUM_STORES_PER_LOAD,
    STORE_LOCATOR_DISTANCE_UNIT
} from '@salesforce/retail-react-app/app/constants'
import {useForm} from 'react-hook-form'

const NUM_STORES_PER_REQUEST_API_MAX = 200
const useGeolocation = (
    setSearchStoresParams,
    userHasSetManualGeolocation,
    setUserHasSetManualGeolocation,
    setAutomaticGeolocationHasFailed
) => {
    const getGeolocationError = () => {
        setAutomaticGeolocationHasFailed(true)
    }

    const getGeolocationSuccess = (position) => {
        setAutomaticGeolocationHasFailed(false)
        setSearchStoresParams({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            limit: STORE_LOCATOR_NUM_STORES_PER_LOAD
        })
    }

    const getUserGeolocation = () => {
        if (typeof navigator !== 'undefined' && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(getGeolocationSuccess, getGeolocationError)
            setUserHasSetManualGeolocation(false)
        } else {
            console.log('Geolocation not supported')
        }
    }

    useEffect(() => {
        if (!userHasSetManualGeolocation) getUserGeolocation()
    }, [])

    return getUserGeolocation
}

const StoreLocatorContent = ({
    searchStoresParams,
    setSearchStoresParams,
    userHasSetManualGeolocation,
    setUserHasSetManualGeolocation
}) => {
    const intl = useIntl()
    const form = useForm({
        mode: 'onChange',
        reValidateMode: 'onChange',
        defaultValues: {
            countryCode: userHasSetManualGeolocation ? searchStoresParams.countryCode : '',
            postalCode: userHasSetManualGeolocation ? searchStoresParams.postalCode : ''
        }
    })
    const [automaticGeolocationHasFailed, setAutomaticGeolocationHasFailed] = useState(false)
    const [userWantsToShareLocation, setUserWantsToShareLocation] = useState(false)

    const getUserGeolocation = useGeolocation(
        setSearchStoresParams,
        userHasSetManualGeolocation,
        setUserHasSetManualGeolocation,
        setAutomaticGeolocationHasFailed
    )
    const [limit, setLimit] = useState(searchStoresParams.limit)

    const {data: searchStoresData, isLoading} = useSearchStores(
        {
            parameters: {
                countryCode: searchStoresParams.latitude
                    ? undefined
                    : searchStoresParams.countryCode,
                postalCode: searchStoresParams.latitude ? undefined : searchStoresParams.postalCode,
                latitude: searchStoresParams.countryCode ? undefined : searchStoresParams.latitude,
                longitude: searchStoresParams.countryCode
                    ? undefined
                    : searchStoresParams.longitude,
                locale: intl.locale,
                maxDistance: STORE_LOCATOR_DISTANCE,
                limit: 200,
                distanceUnit: STORE_LOCATOR_DISTANCE_UNIT
            }
        },
        {keepPreviousData: true}
    )

    const storesInfo = isLoading
        ? undefined
        : searchStoresData?.data
        ? searchStoresData?.data.slice(0, limit)
        : []
    const numStores = searchStoresData?.total || 0

    const submitForm = async (formData) => {
        const {postalCode, countryCode} = formData
        if (postalCode !== '' && countryCode !== '') {
            setSearchStoresParams({
                postalCode: postalCode,
                countryCode: countryCode,
                limit: STORE_LOCATOR_NUM_STORES_PER_LOAD
            })
            setUserHasSetManualGeolocation(true)
        }
    }

    return (
        <>
            <Heading fontSize="2xl" style={{marginBottom: '25px'}}>
                {intl.formatMessage({
                    id: 'store_locator.title',
                    defaultMessage: 'Find a Store'
                })}
            </Heading>
            <StoreLocatorInput
                form={form}
                searchStoresParams={searchStoresParams}
                automaticGeolocationHasFailed={automaticGeolocationHasFailed}
                submitForm={submitForm}
                setSearchStoresParams={setSearchStoresParams}
                userHasSetManualGeolocation={userHasSetManualGeolocation}
                getUserGeolocation={getUserGeolocation}
                setUserWantsToShareLocation={setUserWantsToShareLocation}
                userWantsToShareLocation={userWantsToShareLocation}
            ></StoreLocatorInput>
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
                        {storesInfo === undefined
                            ? intl.formatMessage({
                                  id: 'store_locator.description.loading_locations',
                                  defaultMessage: 'Loading locations...'
                              })
                            : storesInfo.length === 0
                            ? intl.formatMessage({
                                  id: 'store_locator.description.no_locations',
                                  defaultMessage: 'Sorry, there are no locations in this area'
                              })
                            : searchStoresParams.postalCode !== undefined
                            ? `${intl.formatMessage(
                                  {
                                      id: 'store_locator.description.viewing_near_postal_code',
                                      defaultMessage:
                                          'Viewing stores within {distance}{distanceUnit} of {postalCode} in '
                                  },
                                  {
                                      distance: STORE_LOCATOR_DISTANCE,
                                      distanceUnit: STORE_LOCATOR_DISTANCE_UNIT,
                                      postalCode: searchStoresParams.postalCode
                                  }
                              )}
                            ${
                                SUPPORTED_STORE_LOCATOR_COUNTRIES.length !== 0
                                    ? intl.formatMessage(
                                          SUPPORTED_STORE_LOCATOR_COUNTRIES.find(
                                              (o) =>
                                                  o.countryCode === searchStoresParams.countryCode
                                          ).countryName
                                      )
                                    : intl.formatMessage(DEFAULT_STORE_LOCATOR_COUNTRY.countryName)
                            }`
                            : intl.formatMessage({
                                  id: 'store_locator.description.viewing_near_your_location',
                                  defaultMessage: 'Viewing stores near your location'
                              })}
                    </Box>
                </AccordionItem>
                <StoresList storesInfo={storesInfo} />
            </Accordion>
            {limit < numStores && limit < NUM_STORES_PER_REQUEST_API_MAX ? (
                <Box paddingTop="10px" marginTop="10px">
                    <Button
                        key="load-more-button"
                        onClick={() => {
                            setLimit(
                                limit + STORE_LOCATOR_NUM_STORES_PER_LOAD <=
                                    NUM_STORES_PER_REQUEST_API_MAX
                                    ? limit + STORE_LOCATOR_NUM_STORES_PER_LOAD
                                    : limit
                            )
                        }}
                        width="100%"
                        variant="outline"
                        marginBottom={4}
                    >
                        {intl.formatMessage({
                            id: 'store_locator.pagination.load_more',
                            defaultMessage: 'Load More'
                        })}
                    </Button>
                </Box>
            ) : (
                ''
            )}
        </>
    )
}

StoreLocatorContent.propTypes = {
    form: PropTypes.object,
    storesInfo: PropTypes.array,
    searchStoresParams: PropTypes.object,
    submitForm: PropTypes.func,
    setSearchStoresParams: PropTypes.func,
    userHasSetManualGeolocation: PropTypes.bool,
    setUserHasSetManualGeolocation: PropTypes.func,
    numStores: PropTypes.number
}

export default StoreLocatorContent
