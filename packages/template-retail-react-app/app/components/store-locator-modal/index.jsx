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
    DEFAULT_STORE_LOCATOR_COUNTRY,
    DEFAULT_STORE_LOCATOR_POSTAL_CODE,
    STORE_LOCATOR_DISTANCE
} from '@salesforce/retail-react-app/app/constants'
import {noop} from '@salesforce/retail-react-app/app/utils/utils'
import {useForm} from 'react-hook-form'
import {isServer} from '@salesforce/retail-react-app/app/utils/utils'

const StoreLocatorModal = ({onClose = noop}) => {
    const intl = useIntl()
    var defaultSearchStoresParams = {
        countryCode: DEFAULT_STORE_LOCATOR_COUNTRY.countryCode,
        postalCode: DEFAULT_STORE_LOCATOR_POSTAL_CODE,
        limit: 10
    }
    var defaultUserHasSetManualGeolocation = false
    if (!isServer) {
        var searchStoresParamsFromLocalStorage = JSON.parse(
            window.localStorage.getItem('STORE_LOCATOR_SEARCH_STORES_PARAMS')
        )
        var userHasSetManualGeolocationFromLocalStorage = window.localStorage.getItem(
            'STORE_LOCATOR_USER_HAS_SET_GEOLOCATION'
        )
        if (searchStoresParamsFromLocalStorage)
            defaultSearchStoresParams = searchStoresParamsFromLocalStorage
        if (userHasSetManualGeolocationFromLocalStorage)
            defaultUserHasSetManualGeolocation = Boolean(
                userHasSetManualGeolocationFromLocalStorage
            )
    }
    const [userHasSetManualGeolocation, setUserHasSetManualGeolocation] = useState(
        defaultUserHasSetManualGeolocation
    )

    const [searchStoresParams, setSearchStoresParams] = useState(defaultSearchStoresParams)
    const form = useForm({
        mode: 'onChange',
        reValidateMode: 'onChange',
        defaultValues: {
            countryCode: userHasSetManualGeolocation ? searchStoresParams.countryCode : '',
            postalCode: userHasSetManualGeolocation ? searchStoresParams.postalCode : ''
        }
    })

    const searchStoresDataRef = useRef({
        data: []
    })

    var {data: searchStoresData, isLoading} = useSearchStores({
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

    if (isLoading === false) searchStoresDataRef.current = searchStoresData
    const storesInfo = searchStoresDataRef.current.data ? searchStoresDataRef.current.data : []
    const numStores = isLoading ? 0 : searchStoresData.total

    const submitForm = async (formData) => {
        const {postalCode, countryCode} = formData
        setSearchStoresParams({
            postalCode: postalCode,
            countryCode: countryCode,
            limit: 10
        })
        setUserHasSetManualGeolocation(true)
    }

    const isDesktopView = useBreakpointValue({base: false, lg: true})
    useEffect(() => {
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
                userHasSetManualGeolocation ? 1 : 0
            )
    }, [userHasSetManualGeolocation])

    const storeLocatorContent = (
        <>
            <StoreLocatorContent
                form={form}
                submitForm={submitForm}
                storesInfo={storesInfo}
                searchStoresParams={searchStoresParams}
                setSearchStoresParams={setSearchStoresParams}
                userHasSetManualGeolocation={userHasSetManualGeolocation}
                setUserHasSetManualGeolocation={setUserHasSetManualGeolocation}
            />
            {searchStoresParams.limit < numStores && searchStoresParams.limit < 200 ? (
                <Box marginTop="10px">
                    <Button
                        key="load-more-button"
                        onClick={() => {
                            setSearchStoresParams({
                                ...searchStoresParams,
                                limit:
                                    searchStoresParams.limit + 10 <= 200
                                        ? searchStoresParams.limit + 10
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
        </>
    )

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
                            {storeLocatorContent}
                        </ModalBody>
                    </ModalContent>
                </Modal>
            ) : (
                <Modal size="4xl" isOpen={true} onClose={onClose}>
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
                            {storeLocatorContent}
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
