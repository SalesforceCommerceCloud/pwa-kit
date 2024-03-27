/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {
    Box,
    IconButton,
    Popover,
    PopoverArrow,
    PopoverBody,
    PopoverCloseButton,
    PopoverContent,
    PopoverHeader,
    PopoverTrigger,
    Text
} from '@salesforce/retail-react-app/app/components/shared/ui'
import {InfoIcon} from '@salesforce/retail-react-app/app/components/icons'
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
            <Popover isLazy placement="top" boundary="scrollParent" trigger="hover" variant="small">
                <PopoverTrigger>
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
                            id: 'promo_popover.assistive_msg.info',
                            defaultMessage: 'Info'
                        })}
                    />
                </PopoverTrigger>
                <PopoverContent border="none" borderRadius="base">
                    <Box boxShadow="lg">
                        <PopoverArrow />
                        <PopoverCloseButton />
                        <PopoverHeader borderBottom="none">
                            {header || (
                                <Text fontWeight="bold" fontSize="md">
                                    <FormattedMessage
                                        defaultMessage="Promotions Applied"
                                        id="promo_popover.heading.promo_applied"
                                    />
                                </Text>
                            )}
                        </PopoverHeader>
                        <PopoverBody pt={0}>{children}</PopoverBody>
                    </Box>
                </PopoverContent>
            </Popover>
        </Box>
    )
}

PromoPopover.propTypes = {
    header: PropTypes.any,
    children: PropTypes.any
}

export default PromoPopover
