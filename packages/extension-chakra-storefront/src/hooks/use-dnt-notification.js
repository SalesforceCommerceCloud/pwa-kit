/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useEffect} from 'react'
import PropTypes from 'prop-types'
import {FormattedMessage, useIntl} from 'react-intl'
import {
    Box,
    Button,
    CloseButton,
    Dialog,
    Flex,
    Heading,
    Stack,
    Text,

    //hooks
    useDisclosure
} from '@chakra-ui/react'
import {HideOnDesktop, HideOnMobile} from '../components/responsive'
import {useDNT} from '@salesforce/commerce-sdk-react'
import {useLocation} from 'react-router-dom'

export const DntNotification = ({isOpen, onOpen, onClose}) => {
    console.log('isOpen', isOpen)
    const {selectedDnt, updateDNT} = useDNT()
    console.log('selectedDnt', selectedDnt)
    const {formatMessage} = useIntl()
    const location = useLocation()

    useEffect(() => {
        if (selectedDnt === undefined) {
            console.log('Test---')
            onOpen()
        } else {
            onClose()
        }
    }, [location, selectedDnt])

    const onCloseNotification = () => {
        updateDNT(null)
        onClose()
    }

    const buttons = (
        <>
            <Button
                bg="white"
                color="black"
                border="1px"
                _hover={{bg: 'gray.100'}}
                borderColor="gray.100"
                boxShadow="md"
                onClick={() => {
                    updateDNT(true)
                    onClose()
                }}
                aria-label={formatMessage({
                    id: 'dnt_notification.button.assistive_msg.decline',
                    defaultMessage: 'Decline tracking'
                })}
            >
                <FormattedMessage defaultMessage="Decline" id="dnt_notification.button.decline" />
            </Button>
            <Button
                onClick={() => {
                    updateDNT(false)
                    onClose()
                }}
                boxShadow="md"
                aria-label={formatMessage({
                    id: 'dnt_notification.button.assistive_msg.accept',
                    defaultMessage: 'Accept tracking'
                })}
            >
                <FormattedMessage defaultMessage="Accept" id="dnt_notification.button.accept" />
            </Button>
        </>
    )
    // Placeholder for the consent tracking form for demonstration purposes
    const description = (
        <Text color="gray.700" fontWeight="500" marginTop="7">
            <FormattedMessage
                defaultMessage="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur."
                id="dnt_notification.description"
            />
        </Text>
    )

    return (
        <Dialog.Root
            size="sm"
            data-testid="sf-dnt-notification"
            closeOnInteractOutside={false}
            trapFocus={false}
            open={isOpen}
            preventScroll={false}
            onOpenChange={isOpen ? onClose : onOpen}
            placement="bottom"
            onClose={onCloseNotification}
        >
            <Dialog.Positioner>
                <Dialog.Content
                    width="100%"
                    maxWidth="100%"
                    position="absolute"
                    bottom="0"
                    left="0"
                    right="0"
                    margin="0"
                    borderTopRadius="md"
                >
                    <Box boxShadow="0 12px 48px rgba(0, 0, 0, 0.3)">
                        <Dialog.CloseTrigger asChild>
                            <CloseButton colorPalette="gray" size="xs" />
                        </Dialog.CloseTrigger>
                        <Dialog.Body pb="8" bg="white" paddingBottom="14" marginTop="7">
                            <Heading as="h3" fontSize={25} width="100%">
                                <FormattedMessage
                                    defaultMessage="Tracking Consent"
                                    id="dnt_notification.title"
                                />
                            </Heading>
                            <HideOnDesktop>
                                <Flex direction="column">
                                    {description}
                                    <Stack direction="column" gap="4" mt="4" alignItems="flex-end">
                                        {buttons}
                                    </Stack>
                                </Flex>
                            </HideOnDesktop>
                            <HideOnMobile>
                                <Flex align="center">
                                    {description}
                                    <Stack
                                        direction="row"
                                        gap="4"
                                        mt="4"
                                        marginLeft="6"
                                        alignItems="flex-end"
                                    >
                                        {buttons}
                                    </Stack>
                                </Flex>
                            </HideOnMobile>
                        </Dialog.Body>
                    </Box>
                </Dialog.Content>
            </Dialog.Positioner>
        </Dialog.Root>
    )
}

DntNotification.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onOpen: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired
}

/**
 *
 * @returns {Object} - Object props to be passed into the DntNotification component
 */
export const useDntNotification = () => {
    const {open, onOpen, onClose} = useDisclosure()

    return {
        isOpen: open,
        onOpen,
        onClose
    }
}
