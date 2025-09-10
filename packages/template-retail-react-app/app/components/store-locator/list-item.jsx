/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'
import {AccordionItem, Box, Radio, HStack} from '@chakra-ui/react'
import StoreDisplay from '@salesforce/retail-react-app/app/components/store-display'

export const StoreLocatorListItem = ({store, radioProps}) => {
    return (
        <AccordionItem>
            <Box margin="10px">
                <HStack align="flex-start" spacing={3}>
                    <Radio {...radioProps} mt="1px" />
                    <Box flex={1} minW={0}>
                        <StoreDisplay
                            store={store}
                            showDistance={true}
                            showStoreHours={true}
                            showPhone={true}
                            showEmail={true}
                            nameStyle={{fontSize: 'lg'}}
                            textSize="md"
                            accordionPanelStyle={{mb: 6, mt: 4}}
                        />
                    </Box>
                </HStack>
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
    }).isRequired,
    radioProps: PropTypes.object
}
