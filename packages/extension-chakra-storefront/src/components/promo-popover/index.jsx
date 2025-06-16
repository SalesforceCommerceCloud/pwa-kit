/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {Box, IconButton, Popover, CloseButton, Text} from '@chakra-ui/react'
import {InfoIcon} from '../../components/icons'
import {FormattedMessage, useIntl} from 'react-intl'

/**
 * This component renders a small info icon and displays a popoverPopover. when hovered. It could be adapted
 * to handle any kind of popoverPopover. if needed, but for now its been set up to be used/shared for displaying
 * promotions applied to products and/or orders on cart, checkout, order confirmation and order history.
 */
const PromoPopover = ({header, children, ...props}) => {
    const intl = useIntl()
    return (
        <Box position="relative" {...props}>
            <Popover.Root
                isLazy
                placement="top"
                boundary="scrollParent"
                trigger="hover"
                variant="small"
            >
                <Popover.Trigger>
                    <IconButton
                        icon={
                            <InfoIcon
                                display="block"
                                boxSize="18px"
                                mt="-2px"
                                ml="-1px"
                                color="gray.600"
                            />
                        }
                        display="block"
                        size="xs"
                        height="14px"
                        width="14px"
                        minWidth="auto"
                        position="relative"
                        variant="unstyled"
                        aria-label={intl.formatMessage({
                            id: 'promo_popoverPopover..assistive_msg.info',
                            defaultMessage: 'Info'
                        })}
                    />
                </Popover.Trigger>
                <Popover.Content border="none" borderRadius="base">
                    <Box boxShadow="lg">
                        <Popover.Arrow />
                        <CloseButton />
                        <Popover.Header borderBottom="none">
                            {header || (
                                <Text fontWeight="bold" fontSize="md">
                                    <FormattedMessage
                                        defaultMessage="Promotions Applied"
                                        id="promo_popoverPopover..heading.promo_applied"
                                    />
                                </Text>
                            )}
                        </Popover.Header>
                        <Popover.Body pt={0}>{children}</Popover.Body>
                    </Box>
                </Popover.Content>
            </Popover.Root>
        </Box>
    )
}

PromoPopover.propTypes = {
    header: PropTypes.any,
    children: PropTypes.any
}

export default PromoPopover
