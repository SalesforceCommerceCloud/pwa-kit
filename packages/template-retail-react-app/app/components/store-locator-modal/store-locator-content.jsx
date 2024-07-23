/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useState, useContext} from 'react'
import {useIntl} from 'react-intl'

// Components
import {
    Heading,
    Accordion,
    AccordionItem,
    Box,
    Button
} from '@salesforce/retail-react-app/app/components/shared/ui'
import StoresList from '@salesforce/retail-react-app/app/components/store-locator-modal/stores-list'
import StoreLocatorInput from '@salesforce/retail-react-app/app/components/store-locator-modal/store-locator-input'

// Others
import {
    SUPPORTED_STORE_LOCATOR_COUNTRIES,
    DEFAULT_STORE_LOCATOR_COUNTRY,
    STORE_LOCATOR_DISTANCE,
    STORE_LOCATOR_NUM_STORES_PER_LOAD,
    STORE_LOCATOR_DISTANCE_UNIT
} from '@salesforce/retail-react-app/app/constants'

//This is an API limit and is therefore not configurable
const NUM_STORES_PER_REQUEST_API_MAX = 200

// Hooks
import {useSearchStores} from '@salesforce/commerce-sdk-react'
import {useForm} from 'react-hook-form'

import {StoreLocatorContext} from '@salesforce/retail-react-app/app/components/store-locator-modal/index'

const StoreLocatorContent = () => {
    const {
        searchStoresParams,
        setSearchStoresParams,
        userHasSetManualGeolocation,
        setUserHasSetManualGeolocation
    } = useContext(StoreLocatorContext)
    const {countryCode, postalCode, latitude, longitude, limit} = searchStoresParams
    const intl = useIntl()
    const form = useForm({
        mode: 'onChange',
        reValidateMode: 'onChange',
        defaultValues: {
            countryCode: userHasSetManualGeolocation ? countryCode : '',
            postalCode: userHasSetManualGeolocation ? postalCode : ''
        }
    })

    const [numStoresToShow, setNumStoresToShow] = useState(limit)
    // Either the countryCode & postalCode or latitude & longitude are defined, never both
    const {
        data: searchStoresData,
        isLoading,
        refetch,
        isFetching
    } = useSearchStores({
        parameters: {
            countryCode: countryCode,
            postalCode: postalCode,
            latitude: latitude,
            longitude: longitude,
            locale: intl.locale,
            maxDistance: STORE_LOCATOR_DISTANCE,
            limit: NUM_STORES_PER_REQUEST_API_MAX,
            distanceUnit: STORE_LOCATOR_DISTANCE_UNIT
        }
    })

    const storesInfo =
        isLoading || isFetching
            ? undefined
            : searchStoresData?.data?.slice(0, numStoresToShow) || []
    const numStores = searchStoresData?.total || 0

    const submitForm = async (formData) => {
        const {postalCode, countryCode} = formData
        if (postalCode !== '') {
            if (countryCode !== '') {
                setSearchStoresParams({
                    postalCode: postalCode,
                    countryCode: countryCode,
                    limit: STORE_LOCATOR_NUM_STORES_PER_LOAD
                })
                setUserHasSetManualGeolocation(true)
            } else {
                if (SUPPORTED_STORE_LOCATOR_COUNTRIES.length === 0) {
                    setSearchStoresParams({
                        postalCode: postalCode,
                        countryCode: DEFAULT_STORE_LOCATOR_COUNTRY.countryCode,
                        limit: STORE_LOCATOR_NUM_STORES_PER_LOAD
                    })
                    setUserHasSetManualGeolocation(true)
                }
            }
        }
        // Reset the number of stores in the UI
        setNumStoresToShow(STORE_LOCATOR_NUM_STORES_PER_LOAD)

        // Ensures API call is made regardless of caching to provide UX feedback on click
        refetch()
    }

    const displayStoreLocatorStatusMessage = () => {
        if (storesInfo === undefined)
            return intl.formatMessage({
                id: 'store_locator.description.loading_locations',
                defaultMessage: 'Loading locations...'
            })
        if (storesInfo.length === 0)
            return intl.formatMessage({
                id: 'store_locator.description.no_locations',
                defaultMessage: 'Sorry, there are no locations in this area'
            })
        if (searchStoresParams.postalCode !== undefined)
            return `${intl.formatMessage(
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
                                  (o) => o.countryCode === searchStoresParams.countryCode
                              ).countryName
                          )
                        : intl.formatMessage(DEFAULT_STORE_LOCATOR_COUNTRY.countryName)
                }`
        else
            return intl.formatMessage({
                id: 'store_locator.description.viewing_near_your_location',
                defaultMessage: 'Viewing stores near your location'
            })
    }

    return (
        <>
            <Heading fontSize="2xl" style={{marginBottom: '25px'}}>
                {intl.formatMessage({
                    id: 'store_locator.title',
                    defaultMessage: 'Find a Store'
                })}
            </Heading>
            <StoreLocatorInput form={form} submitForm={submitForm}></StoreLocatorInput>
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
                        {displayStoreLocatorStatusMessage()}
                    </Box>
                </AccordionItem>
                <StoresList storesInfo={storesInfo} />
            </Accordion>
            {!isFetching &&
            numStoresToShow < numStores &&
            numStoresToShow < NUM_STORES_PER_REQUEST_API_MAX ? (
                <Box paddingTop="10px" marginTop="10px">
                    <Button
                        key="load-more-button"
                        onClick={() => {
                            setNumStoresToShow(
                                numStoresToShow + STORE_LOCATOR_NUM_STORES_PER_LOAD <=
                                    NUM_STORES_PER_REQUEST_API_MAX
                                    ? numStoresToShow + STORE_LOCATOR_NUM_STORES_PER_LOAD
                                    : numStoresToShow
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

StoreLocatorContent.propTypes = {}

export default StoreLocatorContent
