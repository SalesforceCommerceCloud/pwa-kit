/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {FormattedMessage} from 'react-intl'

// Chakra Components
import {Box, Fade, Flex, Stack, Text} from '@salesforce/retail-react-app/app/components/shared/ui'

// Project Components
import {HideOnDesktop, HideOnMobile} from '@salesforce/retail-react-app/app/components/responsive'
import ItemVariantProvider from '@salesforce/retail-react-app/app/components/item-variant'
import CartItemVariantImage from '@salesforce/retail-react-app/app/components/item-variant/item-image'
import CartItemVariantName from '@salesforce/retail-react-app/app/components/item-variant/item-name'
import CartItemVariantAttributes from '@salesforce/retail-react-app/app/components/item-variant/item-attributes'
import CartItemVariantPrice from '@salesforce/retail-react-app/app/components/item-variant/item-price'
import LoadingSpinner from '@salesforce/retail-react-app/app/components/loading-spinner'
import QuantityPicker from '@salesforce/retail-react-app/app/components/quantity-picker'

// Utilities
import {noop} from '@salesforce/retail-react-app/app/utils/utils'

// Hooks
import {useDerivedProduct} from '@salesforce/retail-react-app/app/hooks'

/**
 * Component representing a product item usually in a list with details about the product - name, variant, pricing, etc.
 * @param {Object} product Product to be represented in the list item.
 * @param {node} primaryAction Child component representing the most prominent action to be performed by the user.
 * @param {node} secondaryActions Child component representing the other actions relevant to the product to be performed by the user.
 * @param {func} onItemQuantityChange callback function to be invoked whenever item quantity changes.
 * @param {boolean} showLoading Renders a loading spinner with overlay if set to true.
 * @returns A JSX element representing product item in a list (eg: wishlist, cart, etc).
 */
const ProductItem = ({
    product,
    primaryAction,
    secondaryActions,
    onItemQuantityChange = noop,
    showLoading = false
}) => {
    const {stepQuantity, showInventoryMessage, inventoryMessage, quantity, setQuantity} =
        useDerivedProduct(product)
    return (
        <Box position="relative" data-testid={`sf-cart-item-${product.productId}`}>
            <ItemVariantProvider variant={product}>
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
                                        <FormattedMessage
                                            defaultMessage="Quantity:"
                                            id="product_item.label.quantity"
                                        />
                                    </Text>
                                    <QuantityPicker
                                        step={stepQuantity}
                                        value={quantity}
                                        min={0}
                                        clampValueOnBlur={false}
                                        onBlur={(e) => {
                                            // Default to last known quantity if a user leaves the box with an invalid value
                                            const {value} = e.target

                                            if (!value) {
                                                setQuantity(product.quantity)
                                            }
                                        }}
                                        onChange={(stringValue, numberValue) => {
                                            // Set the Quantity of product to value of input if value number
                                            if (numberValue >= 0) {
                                                // Call handler
                                                onItemQuantityChange(numberValue).then(
                                                    (isValidChange) =>
                                                        isValidChange && setQuantity(numberValue)
                                                )
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

                            <Box>
                                {product && showInventoryMessage && (
                                    <Fade in={true}>
                                        <Text color="orange.600" fontWeight={600}>
                                            {inventoryMessage}
                                        </Text>
                                    </Fade>
                                )}
                            </Box>

                            {secondaryActions}
                        </Stack>
                    </Flex>

                    <Box display={['block', 'none', 'none', 'none']} w={'full'}>
                        {primaryAction}
                    </Box>
                </Stack>
            </ItemVariantProvider>
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
    secondaryActions: PropTypes.node
}

export default ProductItem
