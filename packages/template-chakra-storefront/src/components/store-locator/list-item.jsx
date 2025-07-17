/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'
import {AccordionItem, AccordionButton, AccordionIcon, AccordionPanel, Box} from '@chakra-ui/react'

export const StoreLocatorListItem = ({store}) => {
    return (
        <AccordionItem>
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
                        <AccordionButton color="blue.700" style={{marginTop: '10px'}}>
                            <Box fontSize="lg">View More</Box>
                            <AccordionIcon />
                        </AccordionButton>
                        <AccordionPanel mb={6} mt={4}>
                            <div
                                dangerouslySetInnerHTML={{
                                    __html: store.storeHours
                                }}
                            />
                        </AccordionPanel>
                    </>
                )}
            </Box>
        </AccordionItem>
    )
}

StoreLocatorListItem.propTypes = {
    store: PropTypes.shape({
        name: PropTypes.string,
        address1: PropTypes.string.isRequired,
        city: PropTypes.string.isRequired,
        stateCode: PropTypes.string,
        postalCode: PropTypes.string.isRequired,
        distance: PropTypes.number,
        distanceUnit: PropTypes.string,
        phone: PropTypes.string,
        storeHours: PropTypes.string
    }).isRequired
}
