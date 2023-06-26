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
    useDisclosure
} from '@salesforce/retail-react-app/app/components/shared/ui'
import {useIntl, defineMessage, FormattedMessage} from 'react-intl'
import {useShopperCustomersMutation} from '@salesforce/commerce-sdk-react'

import {useToast} from '@salesforce/retail-react-app/app/hooks/use-toast'
import {useCurrentCustomer} from '@salesforce/retail-react-app/app/hooks/use-current-customer'
import {useWishList} from '@salesforce/retail-react-app/app/hooks/use-wish-list'

import ConfirmationModal from '@salesforce/retail-react-app/app/components/confirmation-modal/index'
import {useItemVariant} from '@salesforce/retail-react-app/app/components/item-variant'
import {noop} from '@salesforce/retail-react-app/app/utils/utils'
import {API_ERROR_MESSAGE} from '@salesforce/retail-react-app/app/constants'

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
    const {data: customer} = useCurrentCustomer()
    const {data: wishList} = useWishList()
    const modalProps = useDisclosure()
    const toast = useToast()
    const {formatMessage} = useIntl()

    const showRemoveItemConfirmation = () => {
        modalProps.onOpen()
    }

    const deleteCustomerProductListItem = useShopperCustomersMutation(
        'deleteCustomerProductListItem'
    )

    const handleItemRemove = async () => {
        try {
            const promise = deleteCustomerProductListItem.mutateAsync({
                parameters: {
                    customerId: customer.customerId,
                    listId: wishList?.id,
                    itemId: productListItemId
                }
            })
            onClick(variant.id, promise)

            await promise

            toast({
                title: formatMessage({
                    defaultMessage: 'Item removed from wishlist',
                    id: 'wishlist_secondary_button_group.info.item_removed'
                }),
                status: 'success'
            })
        } catch {
            toast({title: formatMessage(API_ERROR_MESSAGE), status: 'error'})
        }
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
