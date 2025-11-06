/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {useIntl, FormattedMessage} from 'react-intl'
import {
    Box,
    Button,
    Flex,
    Accordion,
    AccordionItem,
    AccordionButton,
    AccordionPanel,
    AccordionIcon,
    useBreakpointValue
} from '@salesforce/retail-react-app/app/components/shared/ui'
import {LocationIcon} from '@salesforce/retail-react-app/app/components/icons'

// Helper component for Store Hours Accordion
const StoreHoursAccordion = ({
    store,
    textSize,
    accordionButtonStyle,
    accordionPanelStyle,
    intl
}) => (
    <Box mt={0} w="100%">
        <Accordion allowToggle w="100%">
            <AccordionItem border="none">
                <AccordionButton
                    px={0}
                    py={0}
                    color="blue.700"
                    fontSize="sm"
                    fontWeight="semibold"
                    _hover={{bg: 'transparent'}}
                    {...accordionButtonStyle}
                    w="100%"
                >
                    <Box flex="1" textAlign="left">
                        {intl.formatMessage({
                            id: 'store_display.label.store_hours',
                            defaultMessage: 'Store Hours'
                        })}
                    </Box>
                    <AccordionIcon />
                </AccordionButton>
                <AccordionPanel px={0} pb={2} {...accordionPanelStyle} w="100%">
                    <Box fontSize={textSize} color="gray.600">
                        <div
                            dangerouslySetInnerHTML={{
                                __html: store.storeHours
                            }}
                        />
                    </Box>
                </AccordionPanel>
            </AccordionItem>
        </Accordion>
    </Box>
)
StoreHoursAccordion.propTypes = {
    store: PropTypes.object.isRequired,
    textSize: PropTypes.string.isRequired,
    accordionButtonStyle: PropTypes.object.isRequired,
    accordionPanelStyle: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired
}

const StoreAddressBlock = ({store, nameStyle, textSize, intl}) => (
    <Flex align="flex-start" gap={5}>
        <Box {...nameStyle}>{store.name}</Box>
        <Box fontSize={textSize} color="gray.600">
            {store.address1}
            <br />
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
    </Flex>
)
StoreAddressBlock.propTypes = {
    store: PropTypes.object.isRequired,
    nameStyle: PropTypes.object.isRequired,
    textSize: PropTypes.string.isRequired,
    intl: PropTypes.object.isRequired
}

const StoreDistance = ({store, textSize, intl}) => (
    <Box
        fontSize={textSize}
        color="gray.600"
        display="flex"
        alignItems="center"
        minW="80px"
        whiteSpace="nowrap"
    >
        <LocationIcon />
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
)
StoreDistance.propTypes = {
    store: PropTypes.object.isRequired,
    textSize: PropTypes.string.isRequired,
    intl: PropTypes.object.isRequired
}

const StoreContactInfo = ({store, textSize, intl, showEmail, showPhone}) => (
    <>
        <Box mt={0} w="100%">
            <Accordion allowToggle w="100%">
                <AccordionItem border="none">
                    <AccordionButton
                        px={0}
                        py={0}
                        color="blue.700"
                        fontSize="sm"
                        fontWeight="semibold"
                        _hover={{bg: 'transparent'}}
                        w="100%"
                    >
                        <Box flex="1" textAlign="left">
                            {intl.formatMessage({
                                id: 'store_display.label.store_contact_info',
                                defaultMessage: 'Store Contact Info'
                            })}
                        </Box>
                        <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel px={0} pb={2} w="100%">
                        <Box fontSize={textSize} color="gray.600">
                            {showEmail && store.c_customerServiceEmail && (
                                <>
                                    {intl.formatMessage(
                                        {
                                            id: 'store_locator.description.email',
                                            defaultMessage: 'Email: {email}'
                                        },
                                        {email: store.c_customerServiceEmail}
                                    )}
                                    {showPhone && store.phone && <br />}
                                </>
                            )}
                            {showPhone &&
                                store.phone &&
                                intl.formatMessage(
                                    {
                                        id: 'store_locator.description.phone',
                                        defaultMessage: 'Phone: {phone}'
                                    },
                                    {phone: store.phone}
                                )}
                        </Box>
                    </AccordionPanel>
                </AccordionItem>
            </Accordion>
        </Box>
    </>
)
StoreContactInfo.propTypes = {
    store: PropTypes.object.isRequired,
    textSize: PropTypes.string.isRequired,
    intl: PropTypes.object.isRequired,
    showEmail: PropTypes.bool,
    showPhone: PropTypes.bool
}

const StoreDisplay = ({
    store,
    showDistance = false,
    showStoreHours = true,
    showPhone = true,
    showEmail = true,
    nameStyle = {fontSize: 'md', fontWeight: 'bold'},
    textSize = 'sm',
    accordionButtonStyle = {},
    accordionPanelStyle = {},
    onChangeStore
}) => {
    const intl = useIntl()
    const isDesktop = useBreakpointValue({base: false, lg: true})
    if (!store) {
        return null
    }
    const showContactInfo = Boolean(store.phone) || Boolean(store.c_customerServiceEmail)

    if (isDesktop) {
        return (
            <Box id={`store-info-${store.id}`}>
                <Flex direction="column" align="flex-start" gap={1} w="100%">
                    <Flex justify="space-between" align="flex-start" w="100%">
                        <StoreAddressBlock
                            store={store}
                            nameStyle={nameStyle}
                            textSize={textSize}
                            intl={intl}
                        />
                        {onChangeStore && store.name && (
                            <Button
                                variant="link"
                                size="sm"
                                fontWeight="normal"
                                onClick={onChangeStore}
                                data-testid="change-store-button"
                            >
                                <FormattedMessage
                                    defaultMessage="Use Recent Store"
                                    id="store_display.button.use_recent_store"
                                />
                            </Button>
                        )}
                    </Flex>
                    {showDistance && Boolean(store.distance) && Boolean(store.distanceUnit) ? (
                        <Flex align="stretch" gap={3} mt={2} w="100%" flexWrap="wrap">
                            <Box flex="1" minW="120px">
                                <StoreDistance store={store} textSize={textSize} intl={intl} />
                            </Box>
                            <Box flex="1" minW="150px">
                                {showContactInfo && (
                                    <StoreContactInfo
                                        store={store}
                                        textSize={textSize}
                                        intl={intl}
                                        showEmail={showEmail}
                                        showPhone={showPhone}
                                    />
                                )}
                            </Box>
                            <Box flex="1" minW="150px">
                                {showStoreHours && store.storeHours && (
                                    <StoreHoursAccordion
                                        store={store}
                                        textSize={textSize}
                                        accordionButtonStyle={accordionButtonStyle}
                                        accordionPanelStyle={accordionPanelStyle}
                                        intl={intl}
                                    />
                                )}
                            </Box>
                        </Flex>
                    ) : (
                        <Flex align="stretch" gap={3} mt={2} w="100%" flexWrap="wrap">
                            <Box flex="1" minW="150px">
                                {showContactInfo && (
                                    <StoreContactInfo
                                        store={store}
                                        textSize={textSize}
                                        intl={intl}
                                        showEmail={showEmail}
                                        showPhone={showPhone}
                                    />
                                )}
                            </Box>
                            <Box flex="1" minW="150px">
                                {showStoreHours && store.storeHours && (
                                    <StoreHoursAccordion
                                        store={store}
                                        textSize={textSize}
                                        accordionButtonStyle={accordionButtonStyle}
                                        accordionPanelStyle={accordionPanelStyle}
                                        intl={intl}
                                    />
                                )}
                            </Box>
                        </Flex>
                    )}
                </Flex>
            </Box>
        )
    }

    return (
        <Box id={`store-info-${store.id}`}>
            {store.name && (
                <Flex justify="space-between" align="flex-start" mb={1}>
                    <Box {...nameStyle}>{store.name}</Box>
                    {onChangeStore && (
                        <Button
                            variant="link"
                            size="sm"
                            fontWeight="normal"
                            onClick={onChangeStore}
                            data-testid="change-store-button"
                            ml={2}
                        >
                            <FormattedMessage
                                defaultMessage="Use Recent Store"
                                id="store_display.button.use_recent_store"
                            />
                        </Button>
                    )}
                </Flex>
            )}
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
            {showDistance && Boolean(store.distance) && Boolean(store.distanceUnit) && (
                <>
                    <br />
                    <StoreDistance store={store} textSize={textSize} intl={intl} />
                </>
            )}
            <br />
            {showContactInfo && (
                <StoreContactInfo
                    store={store}
                    textSize={textSize}
                    intl={intl}
                    showEmail={showEmail}
                    showPhone={showPhone}
                />
            )}
            {showStoreHours && store.storeHours && (
                <StoreHoursAccordion
                    store={store}
                    textSize={textSize}
                    accordionButtonStyle={accordionButtonStyle}
                    accordionPanelStyle={accordionPanelStyle}
                    intl={intl}
                />
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
    accordionPanelStyle: PropTypes.object,
    /** Callback function to handle change store action */
    onChangeStore: PropTypes.func
}

export default StoreDisplay
