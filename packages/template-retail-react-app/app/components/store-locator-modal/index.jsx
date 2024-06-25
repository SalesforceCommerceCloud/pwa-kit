/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useState, useRef, useEffect} from 'react'
import PropTypes from 'prop-types'
import {useIntl} from 'react-intl'
import {
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    useBreakpointValue,
    Button,
    Box
} from '@salesforce/retail-react-app/app/components/shared/ui'
import StoreLocatorContent from '@salesforce/retail-react-app/app/components/store-locator-modal/store-locator-content'
import {useSearchStores} from '@salesforce/commerce-sdk-react'
import {
    DEFAULT_STORE_LOCATOR_COUNTRY_CODE,
    DEFAULT_STORE_LOCATOR_POSTAL_CODE,
    STORE_LOCATOR_DISTANCE
} from '@salesforce/retail-react-app/app/constants'
import {noop} from '@salesforce/retail-react-app/app/utils/utils'
import {useForm} from 'react-hook-form'
import {isServer} from '@salesforce/retail-react-app/app/utils/utils'

const StoreLocatorModal = ({onClose = noop}) => {
    const intl = useIntl()
    var defaultSearchStoresParams = {
        countryCode: DEFAULT_STORE_LOCATOR_COUNTRY_CODE,
        postalCode: DEFAULT_STORE_LOCATOR_POSTAL_CODE,
        limit: 10
    }
    var defaultUserHasSetGeolocation = false
    if (!isServer) {
        var searchStoresParamsFromLocalStorage = JSON.parse(
            window.localStorage.getItem('STORE_LOCATOR_SEARCH_STORES_PARAMS')
        )
        var userHasSetGeolocationFromLocalStorage = window.localStorage.getItem(
            'STORE_LOCATOR_USER_HAS_SET_GEOLOCATION'
        )
        if (searchStoresParamsFromLocalStorage)
            defaultSearchStoresParams = searchStoresParamsFromLocalStorage
        if (userHasSetGeolocationFromLocalStorage)
            defaultUserHasSetGeolocation = Boolean(userHasSetGeolocationFromLocalStorage)
    }

    const [userHasSetGeolocation, setUserHasSetGeolocation] = useState(defaultUserHasSetGeolocation)

    const [searchStoresParams, setSearchStoresParams] = useState(defaultSearchStoresParams)
    const searchStoresDataRef = useRef({})

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
    if (searchStoresData.data !== undefined) searchStoresDataRef.current = searchStoresData

    const storesInfo =
        searchStoresDataRef.current.data !== undefined
            ? searchStoresDataRef.current.data.data !== undefined
                ? searchStoresDataRef.current.data.data
                : []
            : undefined
    const numStores =
        searchStoresDataRef.current.data !== undefined ? searchStoresDataRef.current.data.total : 0

    const form = useForm({
        mode: 'onChange',
        reValidateMode: 'onChange',
        defaultValues: {
            countryCode: userHasSetGeolocation ? searchStoresParams.countryCode : '',
            postalCode: userHasSetGeolocation ? searchStoresParams.postalCode : ''
        }
    })
    const submitForm = async (formData) => {
        const {postalCode, countryCode} = formData
        setSearchStoresParams({
            postalCode: postalCode,
            countryCode: countryCode,
            limit: 15
        })
        setUserHasSetGeolocation(true)
    }

    const isDesktopView = useBreakpointValue({base: false, lg: true})

    useEffect(() => {
        console.log('(JEREMY) about to cache searchStoresParams: ', searchStoresParams)
        if (!isServer)
            window.localStorage.setItem(
                'STORE_LOCATOR_SEARCH_STORES_PARAMS',
                JSON.stringify(searchStoresParams)
            )
    }, [searchStoresParams])

    useEffect(() => {
        if (!isServer)
            window.localStorage.setItem(
                'STORE_LOCATOR_USER_HAS_SET_GEOLOCATION',
                userHasSetGeolocation ? 1 : 0
            )
    }, [userHasSetGeolocation])
    
    return (
        <>
            {isDesktopView ? (
                <Modal size="4xl" isOpen={true} onClose={onClose}>
                    <ModalContent
                        display={{base: 'none', lg: 'block'}}
                        position="absolute"
                        top="0"
                        right="0"
                        width="33.33%"
                        height="100vh"
                        marginTop="0px"
                    >
                        <ModalCloseButton onClick={onClose} />
                        <ModalBody
                            pb={8}
                            bg="white"
                            paddingBottom={6}
                            paddingTop={6}
                            borderLeft="1px solid"
                            borderColor="gray.200"
                        >
                            <StoreLocatorContent
                                form={form}
                                submitForm={submitForm}
                                storesInfo={storesInfo}
                                searchStoresParams={searchStoresParams}
                                setSearchStoresParams={setSearchStoresParams}
                                userHasSetGeolocation={userHasSetGeolocation}
                            />
                            {searchStoresParams.limit < numStores &&
                            searchStoresParams.limit < 200 ? (
                                <Box marginTop="10px">
                                    <Button
                                        key="load-more-button"
                                        onClick={() => {
                                            setSearchStoresParams({
                                                ...searchStoresParams,
                                                limit:
                                                    searchStoresParams.limit + 15 <= 200
                                                        ? searchStoresParams.limit + 15
                                                        : searchStoresParams.limit
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
                                </Box>
                            ) : (
                                ''
                            )}
                        </ModalBody>
                    </ModalContent>
                </Modal>
            ) : (
                <Modal size="4xl" onClose={onClose}>
                    <ModalContent
                        position="absolute"
                        top="0"
                        right="0"
                        height="100vh"
                        borderLeft="1px solid"
                        borderColor="gray.200"
                        marginTop="0px"
                    >
                        <ModalCloseButton onClick={onClose} />
                        <ModalBody pb={8} bg="white" paddingBottom={6} marginTop={6}>
                            <StoreLocatorContent
                                form={form}
                                submitForm={submitForm}
                                storesInfo={storesInfo}
                                searchStoresParams={searchStoresParams}
                            />
                        </ModalBody>
                    </ModalContent>
                </Modal>
            )}
        </>
    )
}

StoreLocatorModal.propTypes = {
    onClose: PropTypes.func
}

export default StoreLocatorModal
