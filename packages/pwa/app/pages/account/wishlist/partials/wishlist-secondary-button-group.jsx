import React from 'react'
import {Button, ButtonGroup, useDisclosure} from '@chakra-ui/react'
import useCustomerProductLists from '../../../../commerce-api/hooks/useCustomerProductLists'
import ConfirmationModal from '../../../../components/confirmation-modal/index'
import {defineMessage, FormattedMessage, useIntl} from 'react-intl'
import PropTypes from 'prop-types'
import {useCartItemVariant} from '../../../../components/cart-item-variant'
import {noop} from '../../../../utils/utils'
import {useToast} from '../../../../hooks/use-toast'
import {API_ERROR_MESSAGE} from '../../constant'

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
const WishlistSecondaryButtonGroup = ({productListItemId, listId, onClick = noop}) => {
    const {formatMessage} = useIntl()
    const variant = useCartItemVariant()
    const customerProductLists = useCustomerProductLists()
    const modalProps = useDisclosure()
    const showToast = useToast()

    const showRemoveItemConfirmation = () => {
        modalProps.onOpen()
    }

    const handleItemRemove = async () => {
        onClick(variant.id)
        try {
            await customerProductLists.deleteCustomerProductListItem(
                {id: productListItemId},
                listId
            )
            showToast({
                title: formatMessage({defaultMessage: '1 item removed from wishlist'}),
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
                <Button variant="link" size="sm" onClick={showRemoveItemConfirmation}>
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
    listId: PropTypes.string,
    productListItemId: PropTypes.string,
    onClick: PropTypes.func
}

export default WishlistSecondaryButtonGroup
