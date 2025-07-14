/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useEffect, useState} from 'react'
import {Accordion, AccordionItem, Box, Button} from '@chakra-ui/react'
import {StoreLocatorListItem} from '@salesforce/retail-react-app/app/components/store-locator/list-item'
import {useStoreLocator} from '@salesforce/retail-react-app/app/hooks/use-store-locator'

export const StoreLocatorList = () => {
    const {data, isLoading, config, formValues, mode} = useStoreLocator()
    const [page, setPage] = useState(1)
    useEffect(() => {
        setPage(1)
    }, [data])

    const displayStoreLocatorStatusMessage = () => {
        if (isLoading) return 'Loading locations...'
        if (data?.total === 0) return 'Sorry, there are no locations in this area'

        if (mode === 'input') {
            const countryName =
                config.supportedCountries.length !== 0
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
                {storesToShow?.map((store, index) => (
                    <StoreLocatorListItem key={index} store={store} />
                ))}
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
