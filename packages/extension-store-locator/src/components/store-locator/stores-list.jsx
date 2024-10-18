/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'
import {AccordionItem, AccordionButton, AccordionIcon, AccordionPanel, Box} from '@chakra-ui/react'

const StoresList = ({storesInfo}) => {
    return storesInfo?.map((store, index) => {
        return (
            <AccordionItem key={index}>
                <Box margin="10px">
                    {store.name ? <Box fontSize="lg">{store.name}</Box> : ''}
                    <Box fontSize="md" color="gray.600">
                        {store.address1}
                    </Box>
                    <Box fontSize="md" color="gray.600">
                        {store.city}, {store.stateCode ? store.stateCode : ''} {store.postalCode}
                    </Box>
                    {store.distance !== undefined ? (
                        <>
                            <br />
                            <Box fontSize="md" color="gray.600">
                                {store.distance} {store.distanceUnit}{' away'}
                            </Box>
                        </>
                    ) : (
                        ''
                    )}
                    {store.phone !== undefined ? (
                        <>
                            <br />
                            <Box fontSize="md" color="gray.600">
                                {'Phone: '}{store.phone}
                            </Box>
                        </>
                    ) : (
                        ''
                    )}
                    {store?.storeHours ? (
                        <>
                            {' '}
                            <AccordionButton color="blue.700" style={{marginTop: '10px'}}>
                                <Box fontSize="lg">
                                View More
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
                    ) : (
                        ''
                    )}
                </Box>
            </AccordionItem>
        )
    })
}

StoresList.propTypes = {
    storesInfo: PropTypes.array
}

export default StoresList
