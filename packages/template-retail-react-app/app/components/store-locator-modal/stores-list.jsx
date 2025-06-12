/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useEffect, useState} from 'react'
import {useIntl} from 'react-intl'
import PropTypes from 'prop-types'

// Components
import {
    AccordionItem,
    AccordionButton,
    AccordionIcon,
    AccordionPanel,
    Box,
    HStack,
    Radio,
    RadioGroup
} from '@salesforce/retail-react-app/app/components/shared/ui'

import useMultiSite from '@salesforce/retail-react-app/app/hooks/use-multi-site'

const StoresList = ({storesInfo}) => {
    const intl = useIntl()
    const {site} = useMultiSite()
    const storeInfoKey = `store_${site.id}`
    const [selectedStore, setSelectedStore] = useState('')

    useEffect(() => {
        let existingStore = null

        try {
            if (typeof window !== 'undefined') {
                existingStore = window.localStorage.getItem(storeInfoKey)
            }
        } catch (e) {
            console.warn('Error accessing localStorage:', e)
        }

        if (existingStore) {
            try {
                const storeData = JSON.parse(existingStore)

                if (storeData.id) {
                    setSelectedStore(storeData.id)
                }
            } catch (e) {
                // Invalid localStorage data, ignore
            }
        } else {
            setSelectedStore('')
        }
    }, [storeInfoKey, storesInfo])

    const handleChange = (storeId) => {
        setSelectedStore(storeId)
        const store = storesInfo.find((store) => store.id === storeId)

        const manualSearchParams = {}
        if (store.postalCode && store.countryCode) {
            manualSearchParams.postalCode = store.postalCode
            manualSearchParams.countryCode = store.countryCode
        } else if (store.latitude && store.longitude) {
            manualSearchParams.latitude = store.latitude
            manualSearchParams.longitude = store.longitude
            manualSearchParams.countryCode = store.countryCode
        } else if (store.countryCode) {
            manualSearchParams.countryCode = store.countryCode
        }

        const newStoreData = {
            id: storeId,
            name: store.name || null,
            inventoryId: store.inventoryId || null,
            isSESelection: false,
            timestamp: Date.now(),
            manualSearchParams: manualSearchParams
        }

        try {
            if (typeof window !== 'undefined') {
                window.localStorage.setItem(storeInfoKey, JSON.stringify(newStoreData))
            }
        } catch (e) {
            console.warn('Error saving to localStorage:', e)
        }
    }

    return (
        <RadioGroup onChange={handleChange} value={selectedStore}>
            {storesInfo?.map((store, index) => {
                return (
                    <AccordionItem key={index}>
                        <HStack align="flex-start" mt="16px" mb="16px">
                            <Radio
                                value={store.id}
                                mt="1px"
                                aria-describedby={`store-info-${store.id}`}
                            ></Radio>
                            <Box id={`store-info-${store.id}`}>
                                {store.name && <Box fontSize="lg">{store.name}</Box>}
                                <Box fontSize="md" color="gray.600">
                                    {store.address1}
                                </Box>
                                <Box fontSize="md" color="gray.600">
                                    {store.city}, {store.stateCode ? store.stateCode : ''}{' '}
                                    {store.postalCode}
                                </Box>
                                {store.distance !== undefined && (
                                    <>
                                        <br />
                                        <Box fontSize="md" color="gray.600">
                                            {store.distance} {store.distanceUnit}{' '}
                                            {intl.formatMessage({
                                                id: 'store_locator.description.away',
                                                defaultMessage: 'away'
                                            })}
                                        </Box>
                                    </>
                                )}
                                {store.phone && (
                                    <>
                                        <br />
                                        <Box fontSize="md" color="gray.600">
                                            {intl.formatMessage({
                                                id: 'store_locator.description.phone',
                                                defaultMessage: 'Phone:'
                                            })}{' '}
                                            {store.phone}
                                        </Box>
                                    </>
                                )}
                                {store.storeHours && (
                                    <>
                                        {' '}
                                        <AccordionButton
                                            color="blue.700"
                                            sx={{marginTop: '10px', paddingBottom: '0px'}}
                                        >
                                            <Box fontSize="lg">
                                                {intl.formatMessage({
                                                    id: 'store_locator.action.viewMore',
                                                    defaultMessage: 'View More'
                                                })}
                                            </Box>
                                            <AccordionIcon />
                                        </AccordionButton>
                                        <AccordionPanel mb={6} mt={4}>
                                            <div
                                                dangerouslySetInnerHTML={{
                                                    __html: store?.storeHours
                                                }}
                                            />
                                        </AccordionPanel>{' '}
                                    </>
                                )}
                            </Box>
                        </HStack>
                    </AccordionItem>
                )
            })}
        </RadioGroup>
    )
}

StoresList.propTypes = {
    storesInfo: PropTypes.array
}

export default StoresList
