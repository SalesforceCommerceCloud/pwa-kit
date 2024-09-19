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
    ModalBody,
    ModalCloseButton,
    ModalContent,
    useDisclosure,
    Box,
    Heading,
    Stack,
    Text,
    Flex
} from '@salesforce/retail-react-app/app/components/shared/ui'
import {useDNT} from '@salesforce/commerce-sdk-react'
import {useLocation} from 'react-router-dom'

export const DntModal = ({isOpen, onOpen, onClose, ...props}) => {
    const {dntStatus, updateDNT} = useDNT()
    const {formatMessage} = useIntl()
    const location = useLocation()

    useEffect(() => {
        if (dntStatus === undefined) onOpen()
    }, [location])

    const onCloseModal = () => {
        updateDNT(null)
        onClose()
    }

    return (
        <Modal
            size="sm"
            closeOnOverlayClick={true}
            data-testid="sf-dnt-modal"
            isOpen={isOpen}
            onOpen={onOpen}
            onClose={onCloseModal}
            {...props}
        >
            <ModalContent
                width="100%"
                maxWidth="100%"
                position="absolute"
                bottom={0}
                left={0}
                right={0}
                margin="0"
                borderTopRadius="md"
                boxShadow="0 12px 48px rgba(0, 0, 0, 0.3)"
            >
                <ModalCloseButton
                    aria-label={formatMessage({
                        id: 'dnt_modal.button.close.assistive_msg',
                        defaultMessage: 'Close dnt form'
                    })}
                />
                <ModalBody pb={8} bg="white" paddingBottom={14} marginTop={7}>
                    <Box>
                        <Heading as="h3" fontSize={25}>
                            <FormattedMessage
                                defaultMessage="Tracking Consent"
                                id="dnt_modal.title"
                            />
                        </Heading>
                        <Flex align="center">
                            <Text color={'gray.700'} fontWeight={500} marginTop={7}>
                                <FormattedMessage
                                    defaultMessage="This website uses cookies to enhance user experience and to analyze performance and traffic on our website. We also share information about your use of our site with our social media, advertising and analytics partners.  By clicking “Accept,” you agree to our website’s cookie use as described in our Cookie Policy. You can change your cookie settings at any time by clicking “Preferences.”"
                                    id="dnt_modal.description"
                                />
                            </Text>
                            <Stack
                                direction="row"
                                spacing={4}
                                mt={4}
                                marginLeft={6}
                                align="flex-end"
                            >
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
                                >
                                    <FormattedMessage
                                        defaultMessage="Decline"
                                        id="dnt_modal.decline"
                                    />
                                </Button>
                                <Button
                                    onClick={() => {
                                        updateDNT(false)
                                        onClose()
                                    }}
                                    boxShadow="md"
                                >
                                    <FormattedMessage
                                        defaultMessage="Accept"
                                        id="dnt_modal.accept"
                                    />
                                </Button>
                            </Stack>
                        </Flex>
                    </Box>
                </ModalBody>
            </ModalContent>
        </Modal>
    )
}

DntModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onOpen: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired
}

/**
 *
 * @returns {Object} - Object props to be spread on to the DntModal component
 */
export const useDntModal = () => {
    const {isOpen, onOpen, onClose} = useDisclosure()

    return {
        isOpen,
        onOpen,
        onClose
    }
}
