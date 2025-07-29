/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {
    Button,
    ButtonGroup,
    Checkbox,
    Separator,
    Flex,
    Stack,
    useDisclosure
} from '@chakra-ui/react'
import {defineMessage, useIntl} from 'react-intl'
import {useItemVariant} from '../../../components/item-variant'
import ConfirmationModal from '../../../components/confirmation-modal/index'
import {noop} from '../../../utils/utils'
import {useCurrentCustomer} from '../../../hooks/use-current-customer'

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
    primaryActionAriaLabel: defineMessage({
        defaultMessage: 'Yes, remove item',
        id: 'confirmation_modal.remove_cart_item.assistive_msg.yes'
    }),
    alternateActionLabel: defineMessage({
        defaultMessage: 'No, keep item',
        id: 'confirmation_modal.remove_cart_item.action.no'
    }),
    alternateActionAriaLabel: defineMessage({
        defaultMessage: 'No, keep item',
        id: 'confirmation_modal.remove_cart_item.assistive_msg.no'
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
    onRemoveItemClick = noop,
    onIsAGiftChange = noop,
    isAGift = false
}) => {
    const {formatMessage} = useIntl()
    const variant = useItemVariant()

    const {data: customer} = useCurrentCustomer()
    const modalProps = useDisclosure()

    const messages = {
        remove: formatMessage({
            id: "cart_secondary_button_group.action.remove",
            defaultMessage: "Remove"
        }),
        addToWishlist: formatMessage({
            id: "cart_secondary_button_group.action.added_to_wishlist",
            defaultMessage: "Add to Wishlist"
        }),
        edit: formatMessage({
            id: "cart_secondary_button_group.action.edit",
            defaultMessage: "Edit"
        }),
        thisIsGift: formatMessage({
            id: "cart_secondary_button_group.label.this_is_gift",
            defaultMessage: "This is a gift."
        })
    }

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
                separator={<Separator display={{base: 'block', lg: 'none'}} />}
            >
                <ButtonGroup gap="6">
                    <Button variant="link-blue" size="sm" onClick={showRemoveItemConfirmation}>
                        {messages.remove}
                    </Button>
                    {customer.isRegistered && (
                        <Button
                            variant="link-blue"
                            size="sm"
                            onClick={() => onAddToWishlistClick(variant)}
                        >
                            {messages.addToWishlist}
                        </Button>
                    )}
                    <Button variant="link-blue" size="sm" onClick={() => onEditClick(variant)}>
                        {messages.edit}
                    </Button>
                </ButtonGroup>
                <Flex alignItems="center">
                    <Checkbox.Root
                        name={`gift-checkbox-${variant.itemId}`}
                        gap={2}
                        defaultChecked={isAGift}
                        onChange={(e) => {
                            const checked = e.target.checked
                            onIsAGiftChange(variant, checked)
                        }}
                    >
                        <Checkbox.HiddenInput />
                        <Checkbox.Control />
                        <Checkbox.Label>
                            {messages.thisIsGift}
                        </Checkbox.Label>
                    </Checkbox.Root>
                    {/* if you want to provide a link to your gift site, uncomment this section and re-build your translation*/}
                    {/*<Box marginLeft={1}>*/}
                    {/*    <Button marginLeft={1} variant="ghost" size="sm" href="#">*/}
                    {/*        <FormattedMessage*/}
                    {/*            defaultMessage="Learn More"*/}
                    {/*            id="cart_secondary_button_group.link_learn_more"*/}
                    {/*        />*/}
                    {/*    </Button>*/}
                    {/*</Box>*/}
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
    onRemoveItemClick: PropTypes.func,
    onIsAGiftChange: PropTypes.func,
    isAGift: PropTypes.bool
}

export default CartSecondaryButtonGroup
