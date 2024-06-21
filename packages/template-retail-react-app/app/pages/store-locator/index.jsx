/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useState, useRef} from 'react'
import {useIntl} from 'react-intl'
import {
    Box, 
    Container,
    Button
} from '@salesforce/retail-react-app/app/components/shared/ui'
import Seo from '@salesforce/retail-react-app/app/components/seo'
import StoreLocatorContent from '@salesforce/retail-react-app/app/components/store-locator-modal/store-locator-content'
import {useSearchStores} from '@salesforce/commerce-sdk-react'
import {
    DEFAULT_STORE_LOCATOR_COUNTRY_CODE,
    DEFAULT_STORE_LOCATOR_POSTAL_CODE,
    STORE_LOCATOR_DISTANCE
} from '@salesforce/retail-react-app/app/constants'
import {useForm} from 'react-hook-form'

const StoreLocator = () => {
    const intl = useIntl()
    const [userHasSetGeolocation, setUserHasSetGeolocation] = useState(false)
    const [searchStoresParams, setSearchStoresParams] = useState({
        countryCode: DEFAULT_STORE_LOCATOR_COUNTRY_CODE,
        postalCode: DEFAULT_STORE_LOCATOR_POSTAL_CODE,
        limit: 10
    })
    const searchStoresDataRef = useRef({});
    const form = useForm({
        mode: 'onChange',
        reValidateMode: 'onChange',
        defaultValues: {
            countryCode: searchStoresParams.countryCode,
            postalCode: userHasSetGeolocation ? searchStoresParams.postalCode : ''
        }
    })
    
    var searchStoresData = useSearchStores({
        parameters: {
            countryCode: searchStoresParams.latitude ? undefined : searchStoresParams.countryCode,
            postalCode: searchStoresParams.latitude ? undefined : searchStoresParams.postalCode,
            latitude: searchStoresParams.countryCode ? undefined : searchStoresParams.latitude,
            longitude: searchStoresParams.countryCode ? undefined : searchStoresParams.longitude,
            locale: intl.locale,
            maxDistance: STORE_LOCATOR_DISTANCE,
            limit: searchStoresParams.limit,
            offset: 0
        }
    })
    if (searchStoresData.data !== undefined)
        searchStoresDataRef.current = searchStoresData
    console.log("(JEREMY) searchStoresDataRef.current: ", searchStoresDataRef.current)
    const storesInfo =
        searchStoresDataRef.current.data !== undefined
            ? searchStoresDataRef.current.data.data !== undefined
                ? searchStoresDataRef.current.data.data
                : []
            : undefined

    const numStores = searchStoresDataRef.current.data !== undefined ? searchStoresDataRef.current.data.total : 0
    const submitForm = async (formData) => {
        const {postalCode, countryCode} = formData
        setSearchStoresParams({
            postalCode: postalCode,
            countryCode: countryCode,
            limit: 15
        })
        setUserHasSetGeolocation(true)
    }

    return (
        <Box data-testid="store-locator-page" bg="gray.50" py={[8, 16]}>
            <Seo title="Store Locator" description="Find a Store" />
            <Container
                overflowY="scroll"
                paddingTop={8}
                width={['90%']}
                bg="white"
                paddingBottom={14}
                marginTop={8}
                marginBottom={8}
                borderRadius="base"
            >
                <StoreLocatorContent
                    form={form}
                    submitForm={submitForm}
                    storesInfo={storesInfo}
                    searchStoresParams={searchStoresParams}
                    setSearchStoresParams={setSearchStoresParams}
                />
                {
                    (searchStoresParams.limit < numStores && searchStoresParams.limit < 200) ?
                    <Box
                        marginTop="10px"
                    >
                        <Button
                            key="load-more-button"
                            onClick={() => {
                                setSearchStoresParams({
                                    ...searchStoresParams,
                                    limit: searchStoresParams.limit + 15 <= 200 ? searchStoresParams.limit + 15 : searchStoresParams.limit
                                })
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
                    </Box> : ''
                }
            </Container>
        </Box>
    )
}

StoreLocator.getTemplateName = () => 'store-locator'

StoreLocator.propTypes = {}

export default StoreLocator
