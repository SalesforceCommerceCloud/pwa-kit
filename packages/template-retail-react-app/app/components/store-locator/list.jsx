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
import {useSelectedStore} from '@salesforce/retail-react-app/app/hooks/use-selected-store'
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'

export const StoreLocatorList = () => {
    const {data, isLoading, config, formValues, mode, selectedStoreId, setSelectedStoreId} =
        useStoreLocator()
    const {store: selectedStore} = useSelectedStore()
    const {derivedData} = useCurrentBasket()
    const [page, setPage] = useState(1)

    const hasItemsInBasket = derivedData?.totalItems > 0

    useEffect(() => {
        setPage(1)
    }, [data])

    const handleChange = (selectedStoreId) => {
        if (!hasItemsInBasket) {
            setSelectedStoreId(selectedStoreId)
        }
    }

    const displayStoreLocatorStatusMessage = () => {
        if (isLoading) return 'Loading locations...'
        if (!data?.data?.length && !selectedStore)
            return 'Sorry, there are no locations in this area'
        if (hasItemsInBasket) {
            return 'Sorry, you have items in your basket. Please remove them to continue.'
        }

        if (mode === 'input') {
            const countryName =
                Array.isArray(config.supportedCountries) && config.supportedCountries.length !== 0
                    ? config.supportedCountries.find(
                          (o) => o.countryCode === formValues.countryCode
                      )?.countryName || config.defaultCountry
                    : config.defaultCountry
            const displayZipCode = formValues.postalCode || data?.data[0]?.postalCode

            return `Viewing stores within ${String(config.radius)}${String(
                config.radiusUnit
            )} of ${String(displayZipCode)} in ${String(countryName)}`
        }

        return 'Viewing stores near your location'
    }

    const sortedStores = useMemo(() => {
        const stores = []

        if (selectedStore && (!data?.data || !data.data.find((s) => s.id === selectedStore.id))) {
            stores.push(selectedStore)
        }

        if (data?.data) {
            stores.push(...data.data)
        }

        return stores.sort((a, b) => {
            if (a.id === selectedStoreId) return -1
            if (b.id === selectedStoreId) return 1

            if (a.distance && b.distance) {
                return a.distance - b.distance
            }
            return 0
        })
    }, [data?.data, selectedStoreId, selectedStore])

    const showNumberOfStores = page * config.defaultPageSize
    const showLoadMoreButton = sortedStores.length > showNumberOfStores
    const storesToShow = sortedStores.slice(0, showNumberOfStores) || []

    return (
        <>
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

            <Box as="fieldset" disabled={hasItemsInBasket} opacity={hasItemsInBasket ? 0.5 : 1}>
                <Accordion allowMultiple flex={[1, 1, 1, 5]}>
                    <AccordionItem>
                        <RadioGroup onChange={handleChange} value={selectedStoreId} width="100%">
                            {storesToShow?.map((store) => (
                                <StoreLocatorListItem
                                    key={store.id}
                                    store={store}
                                    radioProps={{
                                        value: store.id,
                                        isChecked: selectedStoreId === store.id,
                                        'aria-describedby': `store-info-${store.id}`
                                    }}
                                />
                            ))}
                        </RadioGroup>
                    </AccordionItem>
                </Accordion>
            </Box>
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
