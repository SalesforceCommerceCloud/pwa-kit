/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {Button, ButtonGroup, useDisclosure} from '@chakra-ui/react'
import useWishlist from '../../../../commerce-api/hooks/useWishlist'
import ConfirmationModal from '../../../../components/confirmation-modal/index'
import {defineMessage, FormattedMessage, useIntl} from 'react-intl'
import PropTypes from 'prop-types'
import {useCartItemVariant} from '../../../../components/cart-item-variant'
import {noop} from '../../../../utils/utils'
import {useToast} from '../../../../hooks/use-toast'
import {API_ERROR_MESSAGE} from '../../../../constants'

export const REMOVE_WISHLIST_ITEM_CONFIRMATION_DIALOG_CONFIG = {
    dialogTitle: defineMessage({defaultMessage: 'Confirm Remove Item'}),
    confirmationMessage: defineMessage({
        defaultMessage: 'Are you sure you want to remove this item from your wishlist?'
    }),
    primaryActionLabel: defineMessage({defaultMessage: 'Yes, remove item'}),
    alternateActionLabel: defineMessage({defaultMessage: 'No, keep item'}),
    onPrimaryAction: noop
}

/**
 * Renders secondary actions on a product-item card in the form of a button group.
 * Represents other actions you want the user to perform with the product-item (eg.: Remove or Edit)
 */
const WishlistSecondaryButtonGroup = ({productListItemId, list, onClick = noop}) => {
    const {formatMessage} = useIntl()
    const variant = useCartItemVariant()
    const customerProductLists = useWishlist()
    const modalProps = useDisclosure()
    const showToast = useToast()

    const showRemoveItemConfirmation = () => {
        modalProps.onOpen()
    }

    const handleItemRemove = async () => {
        onClick(variant.id)
        try {
            await customerProductLists.deleteCustomerProductListItem(list, {id: productListItemId})
            showToast({
                title: formatMessage({defaultMessage: 'Item removed from wishlist'}),
                status: 'success'
            })
        } catch (err) {
            console.error(err)
            showToast({
                title: formatMessage(
                    {defaultMessage: '{errorMessage}'},
                    {errorMessage: API_ERROR_MESSAGE}
                ),
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
                    <FormattedMessage defaultMessage="Remove" />
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
    list: PropTypes.object,
    productListItemId: PropTypes.string,
    onClick: PropTypes.func
}

export default WishlistSecondaryButtonGroup
