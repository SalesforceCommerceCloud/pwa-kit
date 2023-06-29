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
} from '@salesforce/retail-react-app/app/components/shared/ui'
import {defineMessage, FormattedMessage} from 'react-intl'
import {useItemVariant} from '@salesforce/retail-react-app/app/components/item-variant'
import ConfirmationModal from '@salesforce/retail-react-app/app/components/confirmation-modal/index'
import {noop} from '@salesforce/retail-react-app/app/utils/utils'
import {useCurrentCustomer} from '@salesforce/retail-react-app/app/hooks/use-current-customer'

export const REMOVE_CART_ITEM_CONFIRMATION_DIALOG_CONFIG = {
    dialogTitle: defineMessage({
        defaultMessage: 'Confirm Remove Item',
        id: 'confirmation_modal.remove_cart_item.title.confirm_remove'
    }),
    confirmationMessage: defineMessage({
        defaultMessage: 'Are you sure you want to remove this item from your cart?',
        id: 'confirmation_modal.remove_cart_item.message.sure_to_remove'
    }),
    primaryActionLabel: defineMessage({
        defaultMessage: 'Yes, remove item',
        id: 'confirmation_modal.remove_cart_item.action.yes'
    }),
    alternateActionLabel: defineMessage({
        defaultMessage: 'No, keep item',
        id: 'confirmation_modal.remove_cart_item.action.no'
    }),
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

    const {data: customer} = useCurrentCustomer()
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
                        <FormattedMessage
                            defaultMessage="Remove"
                            id="cart_secondary_button_group.action.remove"
                        />
                    </Button>
                    {customer.isRegistered && (
                        <Button
                            variant="link"
                            size="sm"
                            onClick={() => onAddToWishlistClick(variant)}
                        >
                            <FormattedMessage
                                defaultMessage="Add to Wishlist"
                                id="cart_secondary_button_group.action.added_to_wishlist"
                            />
                        </Button>
                    )}
                    <Button variant="link" size="sm" onClick={() => onEditClick(variant)}>
                        <FormattedMessage
                            defaultMessage="Edit"
                            id="cart_secondary_button_group.action.edit"
                        />
                    </Button>
                </ButtonGroup>
                <Flex alignItems="center">
                    <Checkbox spacing={2} isReadOnly={true}>
                        <FormattedMessage
                            defaultMessage="This is a gift."
                            id="cart_secondary_button_group.label.this_is_gift"
                        />
                    </Checkbox>
                    <Box marginLeft={1}>
                        <Button marginLeft={1} variant="link" size="sm">
                            <FormattedMessage
                                defaultMessage="Learn More"
                                id="cart_secondary_button_group.link_learn_more"
                            />
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
