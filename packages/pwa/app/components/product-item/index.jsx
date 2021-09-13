/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useMemo, useState} from 'react'
import PropTypes from 'prop-types'
import {FormattedMessage} from 'react-intl'
import {Box, Flex, Stack, Text, useDisclosure} from '@chakra-ui/react'
import CartItemVariant from '../cart-item-variant'
import CartItemVariantImage from '../cart-item-variant/item-image'
import CartItemVariantName from '../cart-item-variant/item-name'
import CartItemVariantAttributes from '../cart-item-variant/item-attributes'
import CartItemVariantPrice from '../cart-item-variant/item-price'
import LoadingSpinner from '../loading-spinner'
import {noop} from '../../utils/utils'
import {HideOnDesktop, HideOnMobile} from '../responsive'
// import CartQuantityPicker from '../cart-quantity-picker'
import QuantityPicker from '../quantity-picker'
import debounce from 'lodash.debounce'

import {useProduct} from '../../hooks'
import ConfirmationModal from '../confirmation-modal'

import {REMOVE_CART_ITEM_CONFIRMATION_DIALOG_CONFIG} from '../../pages/cart/partials/cart-secondary-button-group'

/**
 * Component representing a product item usually in a list with details about the product - name, variant, pricing, etc.
 * @param {Object} product Product to be represented in the list item.
 * @param {node} primaryAction Child component representing the most prominent action to be performed by the user.
 * @param {node} secondaryActions Child component representing the other actions relevant to the product to be performed by the user.
 * @param {func} onItemQuantityChange callback function to be invoked whenever item quantity changes.
 * @param {boolean} showLoading Renders a loading spinner with overlay if set to true.
 * @param {boolean} handleRemoveItem Handles removal of items from cart
 * @returns A JSX element representing product item in a list (eg: wishlist, cart, etc).
 */
const ProductItem = ({
    product,
    primaryAction,
    secondaryActions,
    onItemQuantityChange = noop,
    showLoading = false,
    handleRemoveItem
}) => {
    const {stepQuantity, stockLevel} = useProduct(product)
    const [quantity, setQuantity] = useState(product.quantity)
    const modalProps = useDisclosure()

    const showRemoveItemConfirmation = () => {
        modalProps.onOpen()
    }

    onItemQuantityChange = useMemo(() => debounce(onItemQuantityChange, 1000), [])

    return (
        <Box position="relative" data-testid={`sf-cart-item-${product.productId}`}>
            <CartItemVariant variant={product}>
                {showLoading && <LoadingSpinner />}
                <Stack layerStyle="cardBordered" align="flex-start">
                    <Flex width="full" alignItems="flex-start" backgroundColor="white">
                        <CartItemVariantImage width={['88px', '136px']} mr={4} />
                        <Stack spacing={3} flex={1}>
                            <Stack spacing={1}>
                                <CartItemVariantName />
                                <CartItemVariantAttributes />
                                <HideOnDesktop>
                                    <Box marginTop={2}>
                                        <CartItemVariantPrice align="left" />
                                    </Box>
                                </HideOnDesktop>
                            </Stack>

                            <Flex align="flex-end" justify="space-between">
                                <Stack spacing={1}>
                                    <Text fontSize="sm" color="gray.700">
                                        <FormattedMessage defaultMessage="Quantity:" />
                                    </Text>
                                    <QuantityPicker
                                        // NOTE: The 'product' property isn't a real product, it's a cart item, so be weary or using
                                        // it directly.
                                        step={stepQuantity}
                                        value={quantity}
                                        min={0}
                                        max={stockLevel}
                                        onBlur={(e) => {
                                            const {value} = e.target

                                            if (!value) {
                                                setQuantity(product.quantity)
                                            }
                                        }}
                                        onFocus={(e) => {
                                            // This is useful for mobile devices, this allows the user to pop open the keyboard and set the
                                            // new quantity with one click. NOTE: This is something that can be refactored into the parent
                                            // component, potentially as a prop called `selectInputOnFocus`.
                                            e.target.select()
                                        }}
                                        onChange={(stringValue, numberValue) => {
                                            // Prevents any previous updates from being made.
                                            onItemQuantityChange.cancel()

                                            // Do nothing if the user enters the current value.
                                            if (product.quantity === numberValue) {
                                                return
                                            }

                                            // Remove the item if the users selects `0`.
                                            if (numberValue === 0) {
                                                showRemoveItemConfirmation()
                                                return
                                            }

                                            // Set the Quantity of product to value of input if value number
                                            if (numberValue >= 0) {
                                                setQuantity(numberValue)

                                                // Call debounced handler.
                                                onItemQuantityChange(numberValue)
                                            } else if (stringValue === '') {
                                                // We want to allow the use to clear the input to start a new input so here we set the quantity to '' so NAN is not displayed
                                                // User will not be able to add '' qauntity to the cart due to the add to cart button enablement rules
                                                setQuantity(stringValue)
                                            }
                                        }}
                                    />
                                </Stack>
                                <Stack>
                                    <HideOnMobile>
                                        <CartItemVariantPrice />
                                    </HideOnMobile>
                                    <Box display={['none', 'block', 'block', 'block']}>
                                        {primaryAction}
                                    </Box>
                                </Stack>
                            </Flex>

                            {secondaryActions}
                        </Stack>
                    </Flex>

                    <Box display={['block', 'none', 'none', 'none']} w={'full'}>
                        {primaryAction}
                    </Box>
                </Stack>
            </CartItemVariant>
            {/* NOTE: I'm note certain if the modal should belong here, or go up even one more level. */}
            <ConfirmationModal
                {...REMOVE_CART_ITEM_CONFIRMATION_DIALOG_CONFIG}
                onPrimaryAction={() => handleRemoveItem(product)}
                onAlternateAction={() => setQuantity(product.quantity)}
                {...modalProps}
            />
        </Box>
    )
}

ProductItem.propTypes = {
    product: PropTypes.object,
    onItemQuantityChange: PropTypes.func,
    onAddItemToCart: PropTypes.func,
    showLoading: PropTypes.bool,
    isWishlistItem: PropTypes.bool,
    primaryAction: PropTypes.node,
    secondaryActions: PropTypes.node,
    handleRemoveItem: PropTypes.func
}

export default ProductItem
