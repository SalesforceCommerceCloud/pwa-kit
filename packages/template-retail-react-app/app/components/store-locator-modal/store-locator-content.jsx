/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useEffect} from 'react'
import {useIntl} from 'react-intl'
import PropTypes from 'prop-types'
import {
    Heading,
    Accordion,
    AccordionItem,
    Box
} from '@salesforce/retail-react-app/app/components/shared/ui'
import StoresList from '@salesforce/retail-react-app/app/components/store-locator-modal/stores-list'
import StoreLocatorInput from '@salesforce/retail-react-app/app/components/store-locator-modal/store-locator-input'
import {
    SUPPORTED_STORE_LOCATOR_COUNTRIES,
    DEFAULT_STORE_LOCATOR_COUNTRY,
    DEFAULT_STORE_LOCATOR_POSTAL_CODE
} from '@salesforce/retail-react-app/app/constants'

const StoreLocatorContent = ({
    form,
    submitForm,
    storesInfo,
    searchStoresParams,
    setSearchStoresParams,
    userHasSetManualGeolocation,
    setUserHasSetManualGeolocation
}) => {
    const intl = useIntl()

    const getGeolocationError = () => {
        console.log('Unable to retrieve your location')
        setSearchStoresParams({
            countryCode: DEFAULT_STORE_LOCATOR_COUNTRY.countryCode,
            postalCode: DEFAULT_STORE_LOCATOR_POSTAL_CODE,
            limit: 15
        })
    }

    const getGeolocationSuccess = (position) => {
        const latitude = position.coords.latitude
        const longitude = position.coords.longitude
        setSearchStoresParams({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            limit: 15
        })
        console.log(`Latitude: ${latitude}, Longitude: ${longitude}`)
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
                submitForm={submitForm}
                setSearchStoresParams={setSearchStoresParams}
                userHasSetManualGeolocation={userHasSetManualGeolocation}
                getUserGeolocation={getUserGeolocation}
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
                                      defaultMessage: 'Viewing stores near {postalCode} in'
                                  },
                                  {
                                      postalCode: searchStoresParams.postalCode
                                  }
                              )} ${intl.formatMessage(DEFAULT_STORE_LOCATOR_COUNTRY.countryName)}`
                            : intl.formatMessage({
                                  id: 'store_locator.description.viewing_near_your_location',
                                  defaultMessage: 'Viewing stores near your location'
                              })}
                    </Box>
                </AccordionItem>
                <StoresList storesInfo={storesInfo} />
            </Accordion>
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
    setUserHasSetManualGeolocation: PropTypes.func
}

export default StoreLocatorContent
