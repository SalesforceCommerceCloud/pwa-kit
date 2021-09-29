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
    Button,
    ButtonGroup,
    Checkbox,
    Divider,
    Flex,
    Stack,
    useDisclosure
} from '@chakra-ui/react'
import {defineMessage, FormattedMessage} from 'react-intl'
import {useItemVariant} from '../../../components/item-variant'
import ConfirmationModal from '../../../components/confirmation-modal/index'
import {noop} from '../../../utils/utils'
import useCustomer from '../../../commerce-api/hooks/useCustomer'

export const REMOVE_CART_ITEM_CONFIRMATION_DIALOG_CONFIG = {
    dialogTitle: defineMessage({defaultMessage: 'Remove Item?'}),
    confirmationMessage: defineMessage({
        defaultMessage: 'Are you sure you want to remove this item from your cart?'
    }),
    primaryActionLabel: defineMessage({defaultMessage: 'Yes, remove item'}),
    alternateActionLabel: defineMessage({defaultMessage: 'No, keep item'}),
    onPrimaryAction: noop
}

/**
 * Renders secondary actions on a product-item card in the form of a button group.
 * Represents other actions you want the user to perform with the product-item
 * (eg.: Remove or Edit or Add to wishlist for cart items)
 */
const CartSecondaryButtonGroup = ({
    onAddToWishlistClick = noop,
    onEditClick = noop,
    onRemoveItemClick = noop
}) => {
    const variant = useItemVariant()

    const customer = useCustomer()
    const modalProps = useDisclosure()

    const showRemoveItemConfirmation = () => {
        modalProps.onOpen()
    }

    const handleRemoveItem = async () => {
        onRemoveItemClick(variant)
    }

    return (
        <>
            <Stack
                direction={{base: 'column', lg: 'row'}}
                alignItems={{base: 'flex-start', lg: 'center'}}
                justifyContent={{base: 'flex-start', lg: 'space-between'}}
                divider={<Divider display={{base: 'block', lg: 'none'}} />}
            >
                <ButtonGroup spacing="6">
                    <Button variant="link" size="sm" onClick={showRemoveItemConfirmation}>
                        <FormattedMessage defaultMessage="Remove" />
                    </Button>
                    {customer.isRegistered && (
                        <Button
                            variant="link"
                            size="sm"
                            onClick={() => onAddToWishlistClick(variant)}
                        >
                            <FormattedMessage defaultMessage="Add to wishlist" />
                        </Button>
                    )}
                    <Button variant="link" size="sm" onClick={() => onEditClick(variant)}>
                        <FormattedMessage defaultMessage="Edit" />
                    </Button>
                </ButtonGroup>
                <Flex alignItems="center">
                    <Checkbox spacing={2} isReadOnly={true}>
                        <FormattedMessage defaultMessage="This is a gift." />
                    </Checkbox>
                    <Box marginLeft={1}>
                        <Button marginLeft={1} variant="link" size="sm">
                            <FormattedMessage defaultMessage="Learn more" />
                        </Button>
                    </Box>
                </Flex>
            </Stack>
            <ConfirmationModal
                {...REMOVE_CART_ITEM_CONFIRMATION_DIALOG_CONFIG}
                onPrimaryAction={handleRemoveItem}
                {...modalProps}
            />
        </>
    )
}

CartSecondaryButtonGroup.propTypes = {
    onClick: PropTypes.func,
    onEditClick: PropTypes.func,
    onAddToWishlistClick: PropTypes.func,
    onRemoveItemClick: PropTypes.func
}

export default CartSecondaryButtonGroup
