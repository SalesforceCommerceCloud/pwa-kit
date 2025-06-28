/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {useIntl} from 'react-intl'
import {
    Box,
    Accordion,
    AccordionItem,
    AccordionButton,
    AccordionPanel,
    AccordionIcon
} from '@salesforce/retail-react-app/app/components/shared/ui'

const StoreDisplay = ({
    store,
    showDistance = false,
    showStoreHours = true,
    showPhone = true,
    showEmail = true,
    nameStyle = {fontSize: 'md', fontWeight: 'bold'},
    textSize = 'sm',
    accordionButtonStyle = {},
    accordionPanelStyle = {}
}) => {
    const intl = useIntl()

    if (!store) {
        return null
    }

    return (
        <Box id={`store-info-${store.id}`}>
            {store.name && <Box {...nameStyle}>{store.name}</Box>}
            <Box fontSize={textSize} color="gray.600">
                {store.address1}
            </Box>
            <Box fontSize={textSize} color="gray.600">
                {intl.formatMessage(
                    {
                        id: 'store_display.format.address_line_2',
                        defaultMessage: '{city}, {stateCode} {postalCode}'
                    },
                    {
                        city: store.city,
                        stateCode: store.stateCode || '',
                        postalCode: store.postalCode
                    }
                )}
            </Box>
            {showDistance && store.distance !== undefined && (
                <>
                    <br />
                    <Box fontSize={textSize} color="gray.600">
                        {intl.formatMessage(
                            {
                                id: 'store_locator.description.away',
                                defaultMessage: '{distance} {unit} away'
                            },
                            {
                                distance: store.distance,
                                unit: store.distanceUnit
                            }
                        )}
                    </Box>
                </>
            )}
            {showEmail && store.c_customerServiceEmail && (
                <>
                    <br />
                    <Box fontSize={textSize} color="gray.600">
                        {intl.formatMessage(
                            {
                                id: 'store_locator.description.email',
                                defaultMessage: 'Email: {email}'
                            },
                            {email: store.c_customerServiceEmail}
                        )}
                    </Box>
                </>
            )}
            {showPhone && store.phone && (
                <>
                    <br />
                    <Box fontSize={textSize} color="gray.600">
                        {intl.formatMessage(
                            {
                                id: 'store_locator.description.phone',
                                defaultMessage: 'Phone: {phone}'
                            },
                            {phone: store.phone}
                        )}
                    </Box>
                </>
            )}
            {showStoreHours && store.storeHours && (
                <Box mt={2}>
                    <Accordion allowToggle>
                        <AccordionItem border="none">
                            <AccordionButton
                                px={0}
                                py={1}
                                color="blue.700"
                                fontSize="sm"
                                fontWeight="semibold"
                                _hover={{bg: 'transparent'}}
                                {...accordionButtonStyle}
                            >
                                <Box flex="1" textAlign="left">
                                    {intl.formatMessage({
                                        id: 'store_display.label.store_hours',
                                        defaultMessage: 'Store Hours'
                                    })}
                                </Box>
                                <AccordionIcon />
                            </AccordionButton>
                            <AccordionPanel px={0} pb={2} {...accordionPanelStyle}>
                                <Box fontSize={textSize} color="gray.600">
                                    <div dangerouslySetInnerHTML={{__html: store.storeHours}} />
                                </Box>
                            </AccordionPanel>
                        </AccordionItem>
                    </Accordion>
                </Box>
            )}
        </Box>
    )
}

StoreDisplay.propTypes = {
    /** Store object containing store information */
    store: PropTypes.shape({
        id: PropTypes.string,
        name: PropTypes.string,
        address1: PropTypes.string,
        city: PropTypes.string,
        stateCode: PropTypes.string,
        postalCode: PropTypes.string,
        phone: PropTypes.string,
        c_customerServiceEmail: PropTypes.string,
        storeHours: PropTypes.string,
        distance: PropTypes.number,
        distanceUnit: PropTypes.string
    }),
    /** Whether to show distance information */
    showDistance: PropTypes.bool,
    /** Whether to show store hours */
    showStoreHours: PropTypes.bool,
    /** Whether to show phone number */
    showPhone: PropTypes.bool,
    /** Whether to show email address */
    showEmail: PropTypes.bool,
    /** Style object for store name */
    nameStyle: PropTypes.object,
    /** Font size for general text */
    textSize: PropTypes.string,
    /** Custom style props for accordion button */
    accordionButtonStyle: PropTypes.object,
    /** Custom style props for accordion panel */
    accordionPanelStyle: PropTypes.object
}

export default StoreDisplay
