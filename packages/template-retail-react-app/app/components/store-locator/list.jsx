/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useEffect, useState} from 'react'
import {Accordion, AccordionItem, Box, Button, RadioGroup} from '@chakra-ui/react'
import {StoreLocatorListItem} from '@salesforce/retail-react-app/app/components/store-locator/list-item'
import {useStoreLocator} from '@salesforce/retail-react-app/app/hooks/use-store-locator'
import useMultiSite from '@salesforce/retail-react-app/app/hooks/use-multi-site'

export const StoreLocatorList = () => {
    const {data, isLoading, config, formValues, mode} = useStoreLocator()
    const [page, setPage] = useState(1)
    const {site} = useMultiSite()
    const storeInfoKey = `store_${site.id}`
    const [selectedStore, setSelectedStore] = useState('')

    useEffect(() => {
        setPage(1)
    }, [data])

    useEffect(() => {
        setSelectedStore(JSON.parse(window.localStorage.getItem(storeInfoKey))?.id || '')
    }, [storeInfoKey])

    const handleChange = (storeId) => {
        setSelectedStore(storeId)
        const store = data?.data?.find((store) => store.id === storeId)
        window.localStorage.setItem(
            storeInfoKey,
            JSON.stringify({
                id: storeId,
                name: store?.name || null,
                inventoryId: store?.inventoryId || null
            })
        )
    }

    const displayStoreLocatorStatusMessage = () => {
        if (isLoading) return 'Loading locations...'
        if (data?.total === 0) return 'Sorry, there are no locations in this area'

        if (mode === 'input') {
            const countryName =
                Array.isArray(config.supportedCountries) && config.supportedCountries.length !== 0
                ? config.supportedCountries.find(
                        (o) => o.countryCode === formValues.countryCode
                    )?.countryName || config.defaultCountry
                    : config.defaultCountry

            return `Viewing stores within ${String(config.radius)}${String(
                config.radiusUnit
            )} of ${String(data?.data[0].postalCode)} in ${String(countryName)}`
        }

        return 'Viewing stores near your location'
    }

    const showNumberOfStores = page * config.defaultPageSize
    const showLoadMoreButton = data?.total > showNumberOfStores
    const storesToShow = data?.data?.slice(0, showNumberOfStores) || []

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
                    {storesToShow?.map((store, index) => (
                        <StoreLocatorListItem
                            key={index}
                            store={store}
                            radioProps={{
                                value: store.id,
                                isChecked: selectedStore === store.id,
                                'aria-describedby': `store-info-${store.id}`
                            }}
                        />
                    ))}
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
