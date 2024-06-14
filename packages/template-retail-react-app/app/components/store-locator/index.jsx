/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useState} from 'react'
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
import {
    DEFAULT_STORE_LOCATORY_COUNTRY_CODE,
    DEFAULT_STORE_LOCATORY_POSTAL_CODE
} from '@salesforce/retail-react-app/app/constants'
import {noop} from '@salesforce/retail-react-app/app/utils/utils'
import {useForm} from 'react-hook-form'

const StoreLocatorModal = ({isOpen, setIsOpen, onClose = noop}) => {
    const intl = useIntl()

    const [searchStoresParams, setSearchStoresParams] = useState({
        countryCode: DEFAULT_STORE_LOCATORY_COUNTRY_CODE,
        postalCode: DEFAULT_STORE_LOCATORY_POSTAL_CODE
    })
    const form = useForm({
        mode: 'onChange',
        reValidateMode: 'onChange',
        defaultValues: {
            countryCode: searchStoresParams?.countryCode,
            postalCode: searchStoresParams?.postalCode
        }
    })
    var searchStoresData = useSearchStores({
        parameters: {
            countryCode: searchStoresParams.countryCode,
            postalCode: searchStoresParams.postalCode,
            locale: intl.locale,
            maxDistance: 100
        }
    })

    const submitForm = async (formData) => {
        const {postalCode, countryCode} = formData
        setSearchStoresParams({
            postalCode: postalCode,
            countryCode: countryCode
        })
    }

    const isDesktopView = useBreakpointValue({base: false, lg: true})
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
                                form={form}
                                submitForm={submitForm}
                                searchStoresData={searchStoresData}
                                searchStoresParams={searchStoresParams}
                            />
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
                        <ModalCloseButton
                            onClick={() => {
                                setIsOpen(false)
                            }}
                        />
                        <ModalBody pb={8} bg="white" paddingBottom={6} marginTop={6}>
                            <StoreLocatorContent
                                form={form}
                                submitForm={submitForm}
                                searchStoresData={searchStoresData}
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
    isOpen: PropTypes.bool.isRequired,
    setIsOpen: PropTypes.func.isRequired,
    onClose: PropTypes.func
}

export default StoreLocatorModal
