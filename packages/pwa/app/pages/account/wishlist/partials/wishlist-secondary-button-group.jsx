/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {Button, ButtonGroup, useDisclosure} from '@chakra-ui/react'
import {useIntl, defineMessage, FormattedMessage} from 'react-intl'

import useWishlist from '../../../../hooks/use-wishlist'
import {useToast} from '../../../../hooks/use-toast'

import ConfirmationModal from '../../../../components/confirmation-modal/index'
import {useItemVariant} from '../../../../components/item-variant'
import {noop} from '../../../../utils/utils'
import {API_ERROR_MESSAGE} from '../../../../constants'

export const REMOVE_WISHLIST_ITEM_CONFIRMATION_DIALOG_CONFIG = {
    dialogTitle: defineMessage({
        defaultMessage: 'Confirm Remove Item',
        id: 'confirmation_modal.remove_wishlist_item.title.confirm_remove'
    }),
    confirmationMessage: defineMessage({
        defaultMessage: 'Are you sure you want to remove this item from your wishlist?',
        id: 'confirmation_modal.remove_wishlist_item.message.sure_to_remove'
    }),
    primaryActionLabel: defineMessage({
        defaultMessage: 'Yes, remove item',
        id: 'confirmation_modal.remove_wishlist_item.action.yes'
    }),
    alternateActionLabel: defineMessage({
        defaultMessage: 'No, keep item',
        id: 'confirmation_modal.remove_wishlist_item.action.no'
    }),
    onPrimaryAction: noop
}

/**
 * Renders secondary actions on a product-item card in the form of a button group.
 * Represents other actions you want the user to perform with the product-item (eg.: Remove or Edit)
 */
const WishlistSecondaryButtonGroup = ({productListItemId, onClick = noop}) => {
    const variant = useItemVariant()
    const wishlist = useWishlist()
    const modalProps = useDisclosure()
    const toast = useToast()
    const {formatMessage} = useIntl()

    const showRemoveItemConfirmation = () => {
        modalProps.onOpen()
    }

    const handleItemRemove = async () => {
        onClick(variant.id)
        try {
            await wishlist.removeListItem(productListItemId)
            toast({
                title: formatMessage({
                    defaultMessage: 'Item removed from wishlist',
                    id: 'wishlist_secondary_button_group.info.item_removed'
                }),
                status: 'success'
            })
        } catch {
            toast({
                title: formatMessage(API_ERROR_MESSAGE),
                status: 'error'
            })
        }
        onClick('')
    }

    return (
        <>
            <ButtonGroup spacing="6">
                <Button
                    variant="link"
                    size="sm"
                    onClick={showRemoveItemConfirmation}
                    data-testid={`sf-wishlist-remove-${productListItemId}`}
                >
                    <FormattedMessage
                        defaultMessage="Remove"
                        id="wishlist_secondary_button_group.action.remove"
                    />
                </Button>
                {/* <Button variant="link" size="sm" onClick={onItemEdit}>
            <FormattedMessage defaultMessage="Edit" />
        </Button> */}
            </ButtonGroup>

            <ConfirmationModal
                {...REMOVE_WISHLIST_ITEM_CONFIRMATION_DIALOG_CONFIG}
                onPrimaryAction={handleItemRemove}
                {...modalProps}
            />
        </>
    )
}

WishlistSecondaryButtonGroup.propTypes = {
    productListItemId: PropTypes.string,
    onClick: PropTypes.func
}

export default WishlistSecondaryButtonGroup
