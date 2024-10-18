/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useState, useContext} from 'react'
import {Heading, Accordion, AccordionItem, Box, Button} from '@chakra-ui/react'
import StoresList from './stores-list'
import StoreLocatorInput from './store-locator-input'

import {
    DEFAULT_STORE_LOCATOR_COUNTRY,
    DEFAULT_STORE_LOCATOR_POSTAL_CODE,
    STORE_LOCATOR_NUM_STORES_PER_LOAD,
    STORE_LOCATOR_DISTANCE,
    STORE_LOCATOR_DISTANCE_UNIT,
    STORE_LOCATOR_IS_ENABLED,
    SUPPORTED_STORE_LOCATOR_COUNTRIES
} from './constants'

//This is an API limit and is therefore not configurable
const NUM_STORES_PER_REQUEST_API_MAX = 200

import {useSearchStores} from '@salesforce/commerce-sdk-react'
import {useForm} from 'react-hook-form'

import {StoreLocatorContext} from './index'

const StoreLocatorContent = () => {
    const {
        searchStoresParams,
        setSearchStoresParams,
        userHasSetManualGeolocation,
        setUserHasSetManualGeolocation
    } = useContext(StoreLocatorContext)
    const {countryCode, postalCode, latitude, longitude, limit} = searchStoresParams
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
            // @TODO translations
            locale: 'en-GB',
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
            // @TODO: add translations
            return 'Loading locations...'
        if (storesInfo.length === 0)
            return 'Sorry, there are no locations in this area'
        if (searchStoresParams.postalCode !== undefined)
            return `Viewing stores within ${STORE_LOCATOR_DISTANCE}${STORE_LOCATOR_DISTANCE_UNIT} of ${searchStoresParams.postalCode} in 
                ${
                    SUPPORTED_STORE_LOCATOR_COUNTRIES.length !== 0
                        ? 
                              SUPPORTED_STORE_LOCATOR_COUNTRIES.find(
                                  (o) => o.countryCode === searchStoresParams.countryCode
                              ).countryName
                          
                        : DEFAULT_STORE_LOCATOR_COUNTRY.countryName
                }`
        else
            return 'Viewing stores near your location'
    }

    return (
        <>
            <Heading fontSize="2xl" style={{marginBottom: '25px'}}>
                Find a Store
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
                        Load More
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
