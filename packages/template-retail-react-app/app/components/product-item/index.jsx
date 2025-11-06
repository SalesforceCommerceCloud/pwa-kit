/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'

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
import BonusProductQuantity from '@salesforce/retail-react-app/app/components/product-item/bonus-product-quantity'
import ProductQuantityPicker from '@salesforce/retail-react-app/app/components/product-item/product-quantity-picker'

// Utilities
import {noop} from '@salesforce/retail-react-app/app/utils/utils'

// Hooks
import {useCurrency, useDerivedProduct} from '@salesforce/retail-react-app/app/hooks'

/**
 * Component representing a product item usually in a list with details about the product - name, variant, pricing, etc.
 * @param {Object} product Product to be represented in the list item.
 * @param {node} primaryAction Child component representing the most prominent action to be performed by the user.
 * @param {node} secondaryActions Child component representing the other actions relevant to the product to be performed by the user.
 * @param {node} deliveryActions Child component representing the delivery actions relevant to the product to be performed by the user.
 * @param {func} onItemQuantityChange callback function to be invoked whenever item quantity changes.
 * @param {boolean} showLoading Renders a loading spinner with overlay if set to true.
 * @returns A JSX element representing product item in a list (eg: wishlist, cart, etc).
 */
const ProductItem = ({
    product,
    primaryAction,
    secondaryActions,
    deliveryActions,
    onItemQuantityChange = noop,
    showLoading = false,
    containerStyles = {},
    isRemoving = false,
    pickupInStore = false
}) => {
    const {stepQuantity, showInventoryMessage, inventoryMessage, quantity, setQuantity} =
        useDerivedProduct(product, false, false, pickupInStore)
    const {currency: activeCurrency} = useCurrency()
    return (
        <Box
            position="relative"
            data-testid={`sf-cart-item-${product.productId ? product.productId : product.id}`}
        >
            <ItemVariantProvider variant={product}>
                {showLoading && <LoadingSpinner />}
                <Stack layerStyle="cardBordered" align="flex-start" {...containerStyles}>
                    <Flex width="full" alignItems="flex-start" backgroundColor="white">
                        <CartItemVariantImage width={['88px', '136px']} mr={4} />
                        <Stack spacing={3} flex={1}>
                            <Flex align="flex-end" justify="space-between">
                                <Stack spacing={1}>
                                    <CartItemVariantName />
                                    <CartItemVariantAttributes excludeBonusLabel />
                                    <HideOnDesktop>
                                        <Box marginTop={2}>
                                            <CartItemVariantPrice
                                                align="left"
                                                currency={activeCurrency}
                                            />
                                        </Box>
                                    </HideOnDesktop>
                                </Stack>
                                {deliveryActions && !product.bonusProductLineItem && (
                                    <HideOnMobile>{deliveryActions}</HideOnMobile>
                                )}
                            </Flex>

                            {deliveryActions && !product.bonusProductLineItem && (
                                <HideOnDesktop>{deliveryActions}</HideOnDesktop>
                            )}

                            <Flex align="flex-end" justify="space-between">
                                <Stack spacing={1}>
                                    {!(isRemoving && product.bonusProductLineItem) &&
                                        (product.bonusProductLineItem ? (
                                            <BonusProductQuantity product={product} />
                                        ) : (
                                            <ProductQuantityPicker
                                                product={product}
                                                onItemQuantityChange={onItemQuantityChange}
                                                stepQuantity={stepQuantity}
                                                quantity={quantity}
                                                setQuantity={setQuantity}
                                            />
                                        ))}
                                </Stack>
                                <Stack>
                                    <HideOnMobile>
                                        <CartItemVariantPrice currency={activeCurrency} />
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
    secondaryActions: PropTypes.node,
    deliveryActions: PropTypes.node,
    containerStyles: PropTypes.object,
    isRemoving: PropTypes.bool,
    pickupInStore: PropTypes.bool
}

export default ProductItem
