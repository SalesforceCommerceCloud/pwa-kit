/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {Box, CloseButton, Flex, IconButton, Popover, Text} from '@chakra-ui/react'
import {InfoIcon} from '../icons'
import {FormattedMessage, useIntl} from 'react-intl'

/**
 * This component renders a small info icon and displays a popover when hovered. It could be adapted
 * to handle any kind of popover if needed, but for now its been set up to be used/shared for displaying
 * promotions applied to products and/or orders on cart, checkout, order confirmation and order history.
 */
const PromoPopover = ({header, children, ...props}) => {
    const intl = useIntl()
    return (
        <Box position="relative" {...props}>
            <Popover.Root size="xs" lazyMount trigger="hover" positioning={{placement: 'top'}}>
                <Popover.Trigger asChild>
                    <IconButton
                        display="block"
                        size="xs"
                        height="14px"
                        width="14px"
                        minWidth="auto"
                        position="relative"
                        variant="unstyled"
                        aria-label={intl.formatMessage({
                            id: 'promo_popover.assistive_msg.info',
                            defaultMessage: 'Info'
                        })}
                    >
                        <InfoIcon
                            display="block"
                            boxSize="18px"
                            mt="-2px"
                            ml="-1px"
                            color="gray.600"
                        />
                    </IconButton>
                </Popover.Trigger>
                <Popover.Positioner>
                    <Popover.Content border="none" borderRadius="sm" boxShadow="lg">
                        <Popover.Arrow />

                        <Popover.Header borderBottom="none" pb={3}>
                            <Flex justifyContent="space-between" alignItems="baseline">
                                {header || (
                                    <Text fontWeight="bold" fontSize="md">
                                        <FormattedMessage
                                            defaultMessage="Promotions Applied"
                                            id="promo_popover.heading.promo_applied"
                                        />
                                    </Text>
                                )}
                                <Popover.CloseTrigger asChild>
                                    <CloseButton size="2xs" />
                                </Popover.CloseTrigger>
                            </Flex>
                        </Popover.Header>
                        <Popover.Body pt={0}>{children}</Popover.Body>
                    </Popover.Content>
                </Popover.Positioner>
            </Popover.Root>
        </Box>
    )
}

PromoPopover.propTypes = {
    header: PropTypes.any,
    children: PropTypes.any
}

export default PromoPopover
