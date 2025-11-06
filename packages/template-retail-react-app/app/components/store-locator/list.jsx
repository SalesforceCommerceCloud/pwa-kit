/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useEffect, useState, useMemo} from 'react'
import {Accordion, AccordionItem, Box, Button, RadioGroup} from '@chakra-ui/react'
import {useIntl} from 'react-intl'
import {StoreLocatorListItem} from '@salesforce/retail-react-app/app/components/store-locator/list-item'
import {useStoreLocator} from '@salesforce/retail-react-app/app/hooks/use-store-locator'
import {useSelectedStore} from '@salesforce/retail-react-app/app/hooks/use-selected-store'
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'

export const StoreLocatorList = () => {
    const intl = useIntl()
    const {data, isLoading, config, formValues, mode, selectedStoreId, setSelectedStoreId} =
        useStoreLocator()
    const {selectedStore} = useSelectedStore()
    const {derivedData} = useCurrentBasket()
    const [page, setPage] = useState(1)
    const [initialSelectedStoreId, setInitialSelectedStoreId] = useState(selectedStoreId)

    // with BOPIS enabled: store locator selector can't be changed unless basket is emty
    // with BOPIS and MULTI_SHIP enabled, store locator can be changed any time
    const hasItemsInBasket = derivedData?.totalItems > 0
    const multishipEnabled = getConfig()?.app?.multishipEnabled ?? true
    const storeSelectionDisabled = multishipEnabled ? false : hasItemsInBasket

    useEffect(() => {
        setPage(1)
        // Capture the selected store on each page load
        setInitialSelectedStoreId(selectedStoreId)
    }, [data])

    const handleChange = (selectedStoreId) => {
        if (!storeSelectionDisabled) {
            setSelectedStoreId(selectedStoreId)
        }
    }

    const displayStoreLocatorStatusMessage = () => {
        if (isLoading)
            return intl.formatMessage({
                id: 'store_locator.description.loading_locations',
                defaultMessage: 'Loading locations...'
            })
        if (!data?.data?.length && !selectedStore)
            return intl.formatMessage({
                id: 'store_locator.description.no_locations',
                defaultMessage: 'Sorry, there are no locations in this area.'
            })
        if (storeSelectionDisabled && hasItemsInBasket) {
            return intl.formatMessage({
                id: 'store_locator.error.items_in_basket',
                defaultMessage: 'To change your selected store, remove all items from your cart.'
            })
        }

        if (mode === 'input') {
            const countryName =
                Array.isArray(config.supportedCountries) && config.supportedCountries.length !== 0
                    ? config.supportedCountries.find(
                          (o) => o.countryCode === formValues.countryCode
                      )?.countryName || config.defaultCountry
                    : config.defaultCountry
            const displayZipCode = formValues.postalCode || data?.data[0]?.postalCode

            return intl.formatMessage(
                {
                    id: 'store_locator.description.viewing_near_postal_code',
                    defaultMessage:
                        'Viewing stores within {distance} {distanceUnit} of {postalCode} in {countryName}'
                },
                {
                    distance: config.radius,
                    distanceUnit: config.radiusUnit,
                    postalCode: displayZipCode,
                    countryName: countryName
                }
            )
        }

        return intl.formatMessage({
            id: 'store_locator.description.viewing_near_your_location',
            defaultMessage: 'Viewing stores near your location'
        })
    }

    const sortedStores = useMemo(() => {
        const stores = []
        const storeIds = new Set()

        // Add all stores from search results first
        if (data?.data) {
            data.data.forEach((store) => {
                stores.push(store)
                storeIds.add(store.id)
            })
        }

        // Add selected store that isn't already in search results
        if (selectedStore && !storeIds.has(selectedStore.id)) {
            stores.push(selectedStore)
            storeIds.add(selectedStore.id)
        }

        return stores.sort((a, b) => {
            if (a.id === initialSelectedStoreId) return -1
            if (b.id === initialSelectedStoreId) return 1

            if (a.distance && b.distance) {
                return a.distance - b.distance
            }
            return 0
        })
    }, [data?.data, selectedStore, initialSelectedStoreId])

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

            <Box as="fieldset">
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
                                        'aria-describedby': `store-info-${store.id}`,
                                        isDisabled: !store.inventoryId || storeSelectionDisabled
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
                        {intl.formatMessage({
                            id: 'store_locator.pagination.load_more',
                            defaultMessage: 'Load More'
                        })}
                    </Button>
                </Box>
            )}
        </>
    )
}
