import React from 'react'
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
import {defineMessage, FormattedMessage, useIntl} from 'react-intl'
import useBasket from '../../../commerce-api/hooks/useBasket'
import useCustomerProductLists, {
    eventActions
} from '../../../commerce-api/hooks/useCustomerProductLists'
import {customerProductListTypes} from '../../../constants'
import {useCartItemVariant} from '../../../components/cart-item-variant'
import ConfirmationModal from '../../../components/confirmation-modal/index'
import PropTypes from 'prop-types'
import {noop} from '@chakra-ui/utils'
import useCustomer from '../../../commerce-api/hooks/useCustomer'
import useNavigation from '../../../hooks/use-navigation'
import {useToast} from '../../../hooks/use-toast'
import {API_ERROR_MESSAGE} from '../../account/constant'

export const REMOVE_CART_ITEM_CONFIRMATION_DIALOG_CONFIG = {
    dialogTitle: defineMessage({defaultMessage: 'Confirm Remove Item'}),
    confirmationMessage: defineMessage({
        defaultMessage: 'Are you sure you want to remove this item from your cart?'
    }),
    primaryActionLabel: defineMessage({defaultMessage: 'Yes, remove item'}),
    alternateActionLabel: defineMessage({defaultMessage: 'No, keep item'}),
    onPrimaryAction: noop
}

/**
 * Renders secondary actions on a product-item card in the form of a button group.
 * Represents other actions you want the user to perform with the product-item (eg.: Remove or Edit or Add to wishlist for cart items)
 */
const CartSecondaryButtonGroup = ({onClick = noop}) => {
    const variant = useCartItemVariant()
    const basket = useBasket()
    const customer = useCustomer()
    const intl = useIntl()
    const customerProductLists = useCustomerProductLists()
    const modalProps = useDisclosure()
    const navigate = useNavigation()
    const showToast = useToast()

    const onViewWishlistClick = () => {
        navigate('/account/wishlist')
    }

    const showRemoveItemConfirmation = () => {
        modalProps.onOpen()
    }

    const handleRemoveItem = async () => {
        onClick(variant.itemId)
        try {
            await basket.removeItemFromBasket(variant.itemId)
            showToast({
                title: intl.formatMessage({defaultMessage: 'Item removed from cart'}),
                status: 'success'
            })
        } catch (err) {
            showToast({
                title: intl.formatMessage(
                    {defaultMessage: '{errorMessage}'},
                    {errorMessage: API_ERROR_MESSAGE}
                ),
                status: 'error'
            })
        }
        onClick('')
    }

    const handleAddItemToWishlist = async () => {
        onClick(variant.itemId)
        try {
            // If product-lists have not loaded we push "Add to wishlist" event to eventQueue to be
            // processed once the product-lists have loaded.
            if (!customerProductLists?.loaded) {
                const event = {
                    item: variant,
                    action: eventActions.ADD,
                    listType: customerProductListTypes.WISHLIST
                }

                customerProductLists.addActionToEventQueue(event)
            } else {
                const wishlist = customerProductLists.data.find(
                    (list) => list.type === customerProductListTypes.WISHLIST
                )
                const requestBody = {
                    productId: variant.productId,
                    priority: 1,
                    quantity: variant.quantity,
                    public: false,
                    type: 'product'
                }

                const wishlistItem = await customerProductLists.createCustomerProductListItem(
                    requestBody,
                    wishlist.id
                )

                if (wishlistItem?.id) {
                    const toastAction = (
                        <Button variant="link" onClick={onViewWishlistClick}>
                            View
                        </Button>
                    )
                    showToast({
                        title: intl.formatMessage({defaultMessage: '1 item added to wishlist'}),
                        status: 'success',
                        action: toastAction
                    })
                }
            }
        } catch (error) {
            showToast({
                title: intl.formatMessage(
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
                    {customer.authType === 'registered' && (
                        <Button variant="link" size="sm" onClick={handleAddItemToWishlist}>
                            <FormattedMessage defaultMessage="Add to wishlist" />
                        </Button>
                    )}
                    {/* <Button variant="link" size="sm" onClick={onItemEdit}>
                    <FormattedMessage defaultMessage="Edit" />
                </Button> */}
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
    onClick: PropTypes.func
}

export default CartSecondaryButtonGroup
