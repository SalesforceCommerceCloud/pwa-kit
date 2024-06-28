/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useEffect} from 'react'
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
    STORE_LOCATOR_DISTANCE,
    STORE_LOCATOR_NUM_STORES_PER_LOAD
} from '@salesforce/retail-react-app/app/constants'
import {noop} from '@salesforce/retail-react-app/app/utils/utils'
import {useForm} from 'react-hook-form'

const NUM_STORES_PER_REQUEST_API_MAX = 200
const StoreLocatorModalWithHooks = ({
    userHasSetManualGeolocation,
    setUserHasSetManualGeolocation,
    searchStoresParams,
    setSearchStoresParams,
    isOpen,
    onClose = noop
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

    var {data: searchStoresData, isLoading} = useSearchStores(
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
                limit: searchStoresParams.limit,
                offset: 0
            }
        },
        {keepPreviousData: true}
    )
    const storesInfo = isLoading ? undefined : searchStoresData?.data || []
    const numStores = searchStoresData?.total || 0
    console.log('(JEREMY) storesInfo: ', storesInfo)

    const submitForm = async (formData) => {
        const {postalCode, countryCode} = formData
        setSearchStoresParams({
            postalCode: postalCode,
            countryCode: countryCode,
            limit: STORE_LOCATOR_NUM_STORES_PER_LOAD
        })
        setUserHasSetManualGeolocation(true)
    }

    const isDesktopView = useBreakpointValue({base: false, lg: true})
    useEffect(() => {
        setSearchStoresParams(searchStoresParams)
    }, [searchStoresParams])

    useEffect(() => {
        setUserHasSetManualGeolocation(userHasSetManualGeolocation)
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
            {searchStoresParams.limit < numStores &&
            searchStoresParams.limit < NUM_STORES_PER_REQUEST_API_MAX ? (
                <Box marginTop="10px">
                    <Button
                        key="load-more-button"
                        onClick={() => {
                            setSearchStoresParams({
                                ...searchStoresParams,
                                limit:
                                    searchStoresParams.limit + STORE_LOCATOR_NUM_STORES_PER_LOAD <=
                                    NUM_STORES_PER_REQUEST_API_MAX
                                        ? searchStoresParams.limit +
                                          STORE_LOCATOR_NUM_STORES_PER_LOAD
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
                <Modal size="4xl" isOpen={isOpen} onClose={onClose}>
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
                <Modal size="4xl" isOpen={isOpen} onClose={onClose}>
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

StoreLocatorModalWithHooks.propTypes = {
    searchStoresParams: PropTypes.object,
    setSearchStoresParams: PropTypes.func,
    userHasSetManualGeolocation: PropTypes.bool,
    setUserHasSetManualGeolocation: PropTypes.func,
    isOpen: PropTypes.bool,
    onClose: PropTypes.func
}

export default StoreLocatorModalWithHooks
