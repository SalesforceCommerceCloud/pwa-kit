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
    Button,
    Modal,
    ModalContent,
    ModalBody,
    ModalCloseButton,
    useDisclosure,
    Heading,
    Stack,
    Text,
    Box,
    Flex
} from '@salesforce/retail-react-app/app/components/shared/ui'
import {HideOnDesktop, HideOnMobile} from '@salesforce/retail-react-app/app/components/responsive'
import {useDNT} from '@salesforce/commerce-sdk-react'
import {useLocation} from 'react-router-dom'

export const DntNotification = ({isOpen, onOpen, onClose}) => {
    const {selectedDnt, updateDNT} = useDNT()
    const {formatMessage} = useIntl()
    const location = useLocation()

    useEffect(() => {
        if (selectedDnt === undefined) {
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
                width="100%"
            >
                <FormattedMessage defaultMessage="Decline" id="dnt_notification.button.decline" />
            </Button>
            <Button
                onClick={() => {
                    updateDNT(false)
                    onClose()
                }}
                boxShadow="md"
                width="100%"
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
        <Text color={'gray.700'} fontWeight={500} marginTop={7}>
            <FormattedMessage
                defaultMessage="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur."
                id="dnt_notification.description"
            />
        </Text>
    )

    return (
        <Modal
            size="sm"
            data-testid="sf-dnt-notification"
            blockScrollOnMount={false}
            closeOnOverlayClick={false}
            trapFocus={false}
            isOpen={isOpen}
            onOpen={onOpen}
            onClose={onCloseNotification}
        >
            <ModalContent
                width="100%"
                maxWidth="100%"
                position="absolute"
                bottom={0}
                left={0}
                right={0}
                pointerEvents="all"
                containerProps={{
                    pointerEvents: 'none'
                }}
                margin="0"
                borderTopRadius="md"
            >
                <Box boxShadow="0 12px 48px rgba(0, 0, 0, 0.3)">
                    <ModalCloseButton
                        aria-label={formatMessage({
                            id: 'dnt_notification.button.assistive_msg.close',
                            defaultMessage: 'Close consent tracking form'
                        })}
                    />
                    <ModalBody pb={8} bg="white" paddingBottom={14} marginTop={7}>
                        <Heading as="h3" fontSize={25} width="100%">
                            <FormattedMessage
                                defaultMessage="Tracking Consent"
                                id="dnt_notification.title"
                            />
                        </Heading>
                        <HideOnDesktop>
                            <Flex direction="column">
                                {description}
                                <Stack direction="column" spacing={4} mt={4} align="flex-end">
                                    {buttons}
                                </Stack>
                            </Flex>
                        </HideOnDesktop>
                        <HideOnMobile>
                            <Flex align="center">
                                {description}
                                <Stack
                                    direction="row"
                                    spacing={4}
                                    mt={4}
                                    marginLeft={6}
                                    align="flex-end"
                                >
                                    {buttons}
                                </Stack>
                            </Flex>
                        </HideOnMobile>
                    </ModalBody>
                </Box>
            </ModalContent>
        </Modal>
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
    const {isOpen, onOpen, onClose} = useDisclosure()

    return {
        isOpen,
        onOpen,
        onClose
    }
}
