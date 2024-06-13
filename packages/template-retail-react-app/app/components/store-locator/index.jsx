/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useState, useEffect} from 'react'
import PropTypes from 'prop-types'
import {useIntl} from 'react-intl'
import {
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    useBreakpointValue
} from '@salesforce/retail-react-app/app/components/shared/ui'
import StoreLocatorContent from '@salesforce/retail-react-app/app/components/store-locator/store-locator-content'
import {useSearchStores} from '@salesforce/commerce-sdk-react'
import {isServer} from '@salesforce/retail-react-app/app/utils/utils'
import {
    SUPPORTED_STORE_LOCATOR_COUNTRIES,
    DEFAULT_STORE_LOCATORY_COUNTRY,
    DEFAULT_STORE_LOCATORY_POSTAL_CODE
} from '@salesforce/retail-react-app/app/constants'

export const getDefaultSearchStoresParams = (intl) => {
    var formattedStoreLocatorCountries = SUPPORTED_STORE_LOCATOR_COUNTRIES.map(
        ({countryCode, countryName}) => {
            return {countryCode: countryCode, countryName: intl.formatMessage(countryName)}
        }
    )
    var defaultCountryCode = formattedStoreLocatorCountries.find(
        (obj) => obj.countryName == intl.formatMessage(DEFAULT_STORE_LOCATORY_COUNTRY)
    ).countryCode

    var defaultSearchStoresParams = {
        countryCode: defaultCountryCode,
        postalCode: DEFAULT_STORE_LOCATORY_POSTAL_CODE
    }
    if (!isServer) {
        var searchStoresParamsFromLocalStorage = JSON.parse(
            window.localStorage.getItem('STORE_LOCATOR_LOCAL_STORAGE')
        )
        if (searchStoresParamsFromLocalStorage)
            defaultSearchStoresParams = searchStoresParamsFromLocalStorage
    }

    return defaultSearchStoresParams
}

const StoreLocatorModal = (props) => {
    const {isOpen, setIsOpen} = props
    const intl = useIntl()
    var defaultSearchStoresParams = getDefaultSearchStoresParams(intl)
    const [searchStoresParams, setSearchStoresParams] = useState(defaultSearchStoresParams)
    var searchStoresData = useSearchStores({
        parameters: {
            countryCode: searchStoresParams.countryCode,
            postalCode: searchStoresParams.postalCode,
            locale: intl.locale,
            maxDistance: 100
        }
    })

    useEffect(() => {
        if (!isServer)
            window.localStorage.setItem(
                'STORE_LOCATOR_LOCAL_STORAGE',
                JSON.stringify(searchStoresParams)
            )
    }, [searchStoresParams])

    const isDesktopView = useBreakpointValue({base: false, lg: true})

    return (
        <>
            {isDesktopView ? (
                <Modal size="4xl" isOpen={isOpen}>
                    <ModalContent
                        display={{base: 'none', lg: 'block'}}
                        position="absolute"
                        top="0"
                        right="0"
                        width="33.33%"
                        height="100vh"
                        borderLeft="1px solid"
                        borderColor="gray.200"
                        marginTop="0px"
                    >
                        <ModalCloseButton
                            onClick={() => {
                                setIsOpen(false)
                            }}
                        />
                        <ModalBody pb={8} bg="white" paddingBottom={6} marginTop={6}>
                            <StoreLocatorContent
                                searchStoresData={searchStoresData}
                                searchStoresParams={searchStoresParams}
                                setSearchStoresParams={setSearchStoresParams}
                                defaultSearchStoresParams={defaultSearchStoresParams}
                            />
                        </ModalBody>
                    </ModalContent>
                </Modal>
            ) : (
                <Modal size="4xl" isOpen={isOpen}>
                    <ModalContent
                        position="absolute"
                        top="0"
                        right="0"
                        height="100vh"
                        borderLeft="1px solid"
                        borderColor="gray.200"
                        marginTop="0px"
                    >
                        <ModalCloseButton
                            onClick={() => {
                                setIsOpen(false)
                            }}
                        />
                        <ModalBody pb={8} bg="white" paddingBottom={6} marginTop={6}>
                            <StoreLocatorContent
                                searchStoresData={searchStoresData}
                                searchStoresParams={searchStoresParams}
                                setSearchStoresParams={setSearchStoresParams}
                                defaultSearchStoresParams={defaultSearchStoresParams}
                            />
                        </ModalBody>
                    </ModalContent>
                </Modal>
            )}
        </>
    )
}

StoreLocatorModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    setIsOpen: PropTypes.func.isRequired
}

export default StoreLocatorModal
