/*
 * Copyright (c) 2025, salesforce.com, inc.
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
import BonusProductQuantity from '@salesforce/retail-react-app/app/components/product-item/bonus-product-quantity'
import PickupOrDelivery from '@salesforce/retail-react-app/app/components/pickup-or-delivery'

// Utilities
import {noop} from '@salesforce/retail-react-app/app/utils/utils'

// Hooks
import {useCurrency, useDerivedProduct} from '@salesforce/retail-react-app/app/hooks'

const CheckoutProductItem = ({
    product,
    primaryAction,
    secondaryActions,
    onItemQuantityChange = noop,
    showLoading = false,
    deliveryActions
}) => {
    const {stepQuantity, showInventoryMessage, inventoryMessage, quantity, setQuantity} =
        useDerivedProduct(product)
    const {currency: activeCurrency} = useCurrency()
    return (
        <Box
            position="relative"
            data-testid={`sf-checkout-item-${product.productId ? product.productId : product.id}`}
        >
            <ItemVariantProvider variant={product}>
                {showLoading && <LoadingSpinner />}
                <Stack layerStyle="cardBordered" align="flex-start">
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
                                {deliveryActions?.showDeliveryOptions && (
                                    <HideOnMobile>
                                        <PickupOrDelivery
                                            isPickupDisabled={deliveryActions.isPickupDisabled}
                                            value={deliveryActions.deliveryOption}
                                            onChange={(selectedValue) =>
                                                deliveryActions.onDeliveryOptionChange(
                                                    product,
                                                    selectedValue
                                                )
                                            }
                                        />
                                    </HideOnMobile>
                                )}
                            </Flex>

                            {deliveryActions?.showDeliveryOptions && (
                                <HideOnDesktop>
                                    <PickupOrDelivery
                                        isPickupDisabled={deliveryActions.isPickupDisabled}
                                        value={deliveryActions.deliveryOption}
                                        onChange={(selectedValue) =>
                                            deliveryActions.onDeliveryOptionChange(
                                                product,
                                                selectedValue
                                            )
                                        }
                                    />
                                </HideOnDesktop>
                            )}

                            <Flex align="flex-end" justify="space-between">
                                <Stack spacing={1}>
                                    {product.bonusProductLineItem ? (
                                        <BonusProductQuantity product={product} />
                                    ) : (
                                        <Text fontSize="sm" color="gray.700">
                                            <FormattedMessage
                                                defaultMessage="Qty: {quantity}"
                                                values={{quantity: product.quantity}}
                                                id="checkout_product_item.label.quantity_static"
                                            />
                                        </Text>
                                    )}
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

CheckoutProductItem.propTypes = {
    product: PropTypes.object,
    onItemQuantityChange: PropTypes.func,
    onAddItemToCart: PropTypes.func,
    showLoading: PropTypes.bool,
    isWishlistItem: PropTypes.bool,
    primaryAction: PropTypes.node,
    secondaryActions: PropTypes.node,
    deliveryActions: PropTypes.shape({
        showDeliveryOptions: PropTypes.bool,
        isPickupDisabled: PropTypes.bool,
        deliveryOption: PropTypes.string,
        onDeliveryOptionChange: PropTypes.func
    })
}

export default CheckoutProductItem 