/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useEffect, useState, useMemo} from 'react'
import {Accordion, AccordionItem, Box, Button, RadioGroup} from '@chakra-ui/react'
import {StoreLocatorListItem} from '@salesforce/retail-react-app/app/components/store-locator/list-item'
import {useStoreLocator} from '@salesforce/retail-react-app/app/hooks/use-store-locator'
import useSeStoreSelection from '@salesforce/retail-react-app/app/hooks/use-se-store-selection'
import useMultiSite from '@salesforce/retail-react-app/app/hooks/use-multi-site'

export const StoreLocatorList = () => {
    const {data, isLoading, config, formValues, mode} = useStoreLocator()
    const {modalStores, isLoadingModalStores, selectedStoreId} = useSeStoreSelection()
    const [page, setPage] = useState(1)
    const {site} = useMultiSite()
    const storeInfoKey = `store_${site.id}`
    const [selectedStore, setSelectedStore] = useState('')

    const useSeData = modalStores && modalStores.length > 0
    const currentData = useSeData ? {data: modalStores, total: modalStores.length} : data
    const currentIsLoading = useSeData ? isLoadingModalStores : isLoading

    useEffect(() => {
        setPage(1)
    }, [currentData])

    useEffect(() => {
        const storeId = selectedStoreId || JSON.parse(window.localStorage.getItem(storeInfoKey))?.id || ''
        setSelectedStore(storeId)
    }, [storeInfoKey, selectedStoreId])

    const handleChange = (storeId) => {
        setSelectedStore(storeId)
        const store = currentData?.data?.find((store) => store.id === storeId)
        if (store) {
            let existingSeParams = null
            try {
                const existingInfo = localStorage.getItem(storeInfoKey)
                if (existingInfo) {
                    const parsed = JSON.parse(existingInfo)
                    if (parsed.seSearchParams) {
                        existingSeParams = parsed.seSearchParams
                    }
                }
            } catch (e) {
                // Continue without existing params
            }

            if (!existingSeParams && useSeData) {
                existingSeParams = {
                    postalCode: store.postalCode,
                    countryCode: store.countryCode
                }
            }

            window.localStorage.setItem(
                storeInfoKey,
                JSON.stringify({
                    id: storeId,
                    name: store?.name || null,
                    inventoryId: store?.inventoryId || null,
                    isSeSelection: useSeData || Boolean(existingSeParams),
                    timestamp: Date.now(),
                    seSearchParams: existingSeParams
                })
            )
        }
    }

    const displayStoreLocatorStatusMessage = () => {
        if (currentIsLoading) return 'Loading locations...'
        if (currentData?.total === 0) return 'Sorry, there are no locations in this area'

        if (useSeData) {
            const selectedStoreInfo = modalStores.find(store => store.isSelected)
            if (selectedStoreInfo) {
                return `Showing stores near your selected location`
            }
            return 'Showing nearby store locations'
        }

        if (mode === 'input' || mode === 'se') {
            const countryName =
                Array.isArray(config.supportedCountries) && config.supportedCountries.length !== 0
                    ? config.supportedCountries.find(
                          (o) => o.countryCode === formValues.countryCode
                      )?.countryName || config.defaultCountry
                    : config.defaultCountry
            let locationDescription = 'your location'
            if (typeof window !== 'undefined') {
                try {
                    const storedInfo = localStorage.getItem(storeInfoKey)
                    if (storedInfo) {
                        const parsed = JSON.parse(storedInfo)
                        if (parsed.isSeSelection && parsed.seSearchParams) {
                            if (parsed.seSearchParams.postalCode) {
                                locationDescription = parsed.seSearchParams.postalCode
                            } else if (parsed.seSearchParams.latitude && parsed.seSearchParams.longitude) {
                                locationDescription = 'your coordinates'
                            }
                        }
                    }
                } catch (e) {
                    // Fallback to form values
                }
            }
            
            const postalCode = formValues.postalCode || locationDescription

            return `Viewing stores within ${String(config.radius)}${String(
                config.radiusUnit
            )} of ${String(postalCode)} in ${String(countryName)}`
        }

        return 'Viewing stores near your location'
    }

    const sortedStores = useMemo(() => {
        if (!currentData?.data) return []
        
        const stores = [...currentData.data]
        return stores.sort((a, b) => {
            if (a.id === selectedStore && b.id !== selectedStore) return -1
            if (b.id === selectedStore && a.id !== selectedStore) return 1
            
            if (useSeData) {
                if (a.isSelected && !b.isSelected) return -1
                if (b.isSelected && !a.isSelected) return 1
            }
            
            if (a.distance !== null && b.distance !== null) {
                return a.distance - b.distance
            }
            
            return 0
        })
    }, [currentData?.data, selectedStore, useSeData])

    const showNumberOfStores = page * config.defaultPageSize
    const showLoadMoreButton = sortedStores.length > showNumberOfStores
    const storesToShow = sortedStores.slice(0, showNumberOfStores)

    return (
        <>
            <Accordion allowMultiple flex={[1, 1, 1, 5]}>
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
                <RadioGroup onChange={handleChange} value={selectedStore} width="100%">
                    {storesToShow?.map((store, index) => {
                        const showSeIndicator = store.isSelected && store.id === selectedStore && useSeData
                        
                        return (
                            <StoreLocatorListItem
                                key={store.id}
                                store={store}
                                radioProps={{
                                    value: store.id,
                                    'aria-describedby': `store-info-${store.id}`
                                }}
                                isSeSelected={showSeIndicator}
                            />
                        )
                    })}
                </RadioGroup>
            </Accordion>
            {showLoadMoreButton && (
                <Box paddingTop={3} marginTop={3}>
                    <Button
                        id="load-more-button"
                        onClick={() => {
                            setPage(page + 1)
                        }}
                        width="100%"
                        variant="outline"
                        marginBottom={4}
                    >
                        Load More
                    </Button>
                </Box>
            )}
        </>
    )
}
