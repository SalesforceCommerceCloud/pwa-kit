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
    Portal,
    Text
} from '@chakra-ui/react'
import {InfoIcon} from '../icons'
import {FormattedMessage} from 'react-intl'

/**
 * This component renders a small info icon and displays a popover when hovered. It could be adapted
 * to handle any kind of popover if needed, but for now its been set up to be used/shared for displaying
 * promotions applied to products and/or orders on cart, checkout, order confirmation and order history.
 */
const PromoPopover = ({header, children, ...props}) => {
    return (
        <Box position="relative" {...props}>
            <Popover placement="top" boundary="scrollParent" trigger="hover" variant="small">
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
                    >
                        <FormattedMessage defaultMessage="Applied promotions info" />
                    </IconButton>
                </PopoverTrigger>
                <Portal>
                    <PopoverContent border="none" borderRadius="base">
                        <Box boxShadow="lg" zIndex="-1">
                            <PopoverArrow />
                            <PopoverCloseButton />
                            <PopoverHeader borderBottom="none">
                                {header || (
                                    <Text fontWeight="bold" fontSize="md">
                                        <FormattedMessage defaultMessage="Promotions Applied" />
                                    </Text>
                                )}
                            </PopoverHeader>
                            <PopoverBody pt={0}>{children}</PopoverBody>
                        </Box>
                    </PopoverContent>
                </Portal>
            </Popover>
        </Box>
    )
}

PromoPopover.propTypes = {
    header: PropTypes.any,
    children: PropTypes.any
}

export default PromoPopover
