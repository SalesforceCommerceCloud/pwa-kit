/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {Accordion, Box} from '@chakra-ui/react'
import {Store} from '../types/store'

interface StoreLocatorListItemProps {
    store: Store
}

export const StoreLocatorListItem: React.FC<StoreLocatorListItemProps> = ({store}) => {
    return (
        <Accordion.Item value={`store-${store.name || 'unknown'}`}>
            <Box margin="10px">
                {store.name && <Box fontSize="lg">{store.name}</Box>}
                <Box fontSize="md" color="gray.600">
                    {store.address1}
                </Box>
                <Box fontSize="md" color="gray.600">
                    {store.city}, {store.stateCode ? store.stateCode : ''} {store.postalCode}
                </Box>
                {store.distance !== undefined && (
                    <>
                        <br />
                        <Box fontSize="md" color="gray.600">
                            {store.distance} {store.distanceUnit}
                            {' away'}
                        </Box>
                    </>
                )}
                {store.phone && (
                    <>
                        <br />
                        <Box fontSize="md" color="gray.600">
                            {'Phone: '}
                            {store.phone}
                        </Box>
                    </>
                )}
                {store.storeHours && (
                    <>
                        <Accordion.ItemTrigger
                            cursor="pointer"
                            color="blue.700"
                            style={{marginTop: '10px'}}
                        >
                            <Box fontSize="lg" flex="1" textAlign="left">
                                View More
                            </Box>
                            <Accordion.ItemIndicator />
                        </Accordion.ItemTrigger>
                        <Accordion.ItemContent mb={6} mt={4}>
                            <div
                                dangerouslySetInnerHTML={{
                                    __html: store.storeHours
                                }}
                            />
                        </Accordion.ItemContent>
                    </>
                )}
            </Box>
        </Accordion.Item>
    )
}
