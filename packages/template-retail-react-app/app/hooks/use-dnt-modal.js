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
    CloseButton,
    Box,
    useDisclosure,
    Heading,
    Stack,
    Text,
    Flex
} from '@salesforce/retail-react-app/app/components/shared/ui'
import {HideOnDesktop, HideOnMobile} from '@salesforce/retail-react-app/app/components/responsive'
import {useDNT} from '@salesforce/commerce-sdk-react'
import {useLocation} from 'react-router-dom'

export const DntModal = ({isOpen, onOpen, onClose, ...props}) => {
    const {dntStatus, updateDNT} = useDNT()
    const {formatMessage} = useIntl()
    const location = useLocation()

    useEffect(() => {
        console.log("(JEREMY) on the useEffect for DNT modal")
        if (dntStatus === undefined) onOpen()
        else onClose()
    }, [location, dntStatus])

    const onCloseModal = () => {
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
                width="100%"
            >
                <FormattedMessage defaultMessage="Decline" id="dnt_modal.decline" />
            </Button>
            <Button
                onClick={() => {
                    updateDNT(false)
                    onClose()
                }}
                boxShadow="md"
                width="100%"
            >
                <FormattedMessage defaultMessage="Accept" id="dnt_modal.accept" />
            </Button>
        </>
    )

    const description = (
        <Text color={'gray.700'} fontWeight={500} marginTop={7}>
            <FormattedMessage
                defaultMessage="This website uses cookies to enhance user experience and to analyze performance and traffic on our website. We also share information about your use of our site with our social media, advertising and analytics partners.  By clicking “Accept,” you agree to our website’s cookie use as described in our Cookie Policy. "
                id="dnt_modal.description"
            />
        </Text>
    )

    return (
        isOpen && <Box
            position="fixed"
            bottom={0}
            left={0}
            right={0}
            margin="0"
            borderTopRadius="md"
            boxShadow="0 12px 48px rgba(0, 0, 0, 0.3)"
            width="100%"
            maxWidth="100%"
            backgroundColor="white"
        >
            <CloseButton
                position="absolute"
                aria-label={formatMessage({
                    id: 'dnt_modal.button.close.assistive_msg',
                    defaultMessage: 'Close dnt form'
                })}
                right={5}
                top={5}
                onClick={onCloseModal}
            />
            <Box
                paddingBottom={14} 
                paddingTop={10} 
                paddingLeft={10}
                paddingRight={10}
            >
                <Heading as="h3" fontSize={25} width="100%">
                    <FormattedMessage defaultMessage="Tracking Consent" id="dnt_modal.title" />
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
                            marginLeft={6}
                            align="flex-end"
                        >
                            {buttons}
                        </Stack>
                    </Flex>
                </HideOnMobile>
            </Box>
        </Box>
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
