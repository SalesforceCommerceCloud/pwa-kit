/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useState} from 'react'
import PropTypes from 'prop-types'
import {FormattedMessage, FormattedNumber} from 'react-intl'
import {Box, Flex, Button, Stack, Text, Heading, Divider} from '@chakra-ui/react'
import useBasket from '../../commerce-api/hooks/useBasket'
import {BasketIcon, ChevronDownIcon, ChevronUpIcon} from '../icons'
import Link from '../link'
import {PromoCode, usePromoCode} from '../promo-code'
import ItemVariantProvider from '../item-variant'
import CartItemVariantImage from '../item-variant/item-image'
import CartItemVariantName from '../item-variant/item-name'
import CartItemVariantAttributes from '../item-variant/item-attributes'
import CartItemVariantPrice from '../item-variant/item-price'
import PromoPopover from '../promo-popover'

const CartItems = ({basket}) => {
    basket = basket || useBasket()
    const [cartItemsExpanded, setCartItemsExpanded] = useState(false)

    return (
        <Stack spacing={5} width="full">
            <Box>
                <Button
                    variant="link"
                    leftIcon={<BasketIcon boxSize="22px" />}
                    rightIcon={cartItemsExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
                    onClick={() => setCartItemsExpanded(!cartItemsExpanded)}
                >
                    <FormattedMessage
                        id="order_summary.cart_items.action.num_of_items_in_cart"
                        description="clicking it would expand/show the items in cart"
                        defaultMessage="{itemCount, plural, =0 {0 items} one {# item} other {# items}} in cart"
                        values={{itemCount: basket.itemAccumulatedCount}}
                    />
                </Button>
            </Box>

            {cartItemsExpanded && (
                <Stack spacing={5} align="flex-start" divider={<Divider />}>
                    {basket.productItems?.map((product, idx) => {
                        const variant = {
                            ...product,
                            ...(basket._productItemsDetail &&
                                basket._productItemsDetail[product.productId]),
                            price: product.price
                        }
                        return (
                            <ItemVariantProvider
                                key={product.productId}
                                index={idx}
                                variant={variant}
                            >
                                <Flex width="full" alignItems="flex-start">
                                    <CartItemVariantImage width="80px" mr={2} />
                                    <Stack width="full" spacing={1} marginTop="-3px">
                                        <CartItemVariantName />
                                        <CartItemVariantAttributes includeQuantity />
                                        <CartItemVariantPrice baseDirection="row" />
                                    </Stack>
                                </Flex>
                            </ItemVariantProvider>
                        )
                    })}

                    <Button as={Link} to="/cart" variant="link" width="full">
                        <FormattedMessage
                            defaultMessage="Edit cart"
                            id="order_summary.cart_items.link.edit_cart"
                        />
                    </Button>
                </Stack>
            )}
        </Stack>
    )
}

CartItems.propTypes = {
    basket: PropTypes.object
}

const OrderSummary = ({
    basket,
    showPromoCodeForm = false,
    showCartItems = false,
    isEstimate = false,
    fontSize = 'md'
}) => {
    basket = basket || useBasket()

    const {removePromoCode, ...promoCodeProps} = usePromoCode()
    const shippingItem = basket.shippingItems?.[0]
    const hasShippingPromos = shippingItem?.priceAdjustments?.length > 0

    if (!basket.basketId && !basket.orderNo) {
        return null
    }

    return (
        <Stack data-testid="sf-order-summary" spacing={5}>
            <Heading fontSize={fontSize} pt={1}>
                <FormattedMessage
                    defaultMessage="Order Summary"
                    id="order_summary.heading.order_summary"
                />
            </Heading>

            <Stack spacing={4} align="flex-start">
                {showCartItems && <CartItems basket={basket} />}

                <Stack w="full">
                    <Flex justify="space-between">
                        <Text fontWeight="bold" fontSize={fontSize}>
                            <FormattedMessage
                                defaultMessage="Subtotal"
                                id="order_summary.label.subtotal"
                            />
                        </Text>
                        <Text fontWeight="bold" fontSize={fontSize}>
                            <FormattedNumber
                                style="currency"
                                currency={basket?.currency}
                                value={basket?.productSubTotal}
                            />
                        </Text>
                    </Flex>

                    {basket.orderPriceAdjustments?.map((adjustment) => (
                        <Flex justify="space-between" key={adjustment.priceAdjustmentId}>
                            <Text fontSize={fontSize}>{adjustment.itemText}</Text>
                            <Text color="green.500" fontSize={fontSize}>
                                <FormattedNumber
                                    style="currency"
                                    currency={basket?.currency}
                                    value={adjustment.price}
                                />
                            </Text>
                        </Flex>
                    ))}

                    <Flex justify="space-between">
                        <Flex alignItems="center">
                            <Text lineHeight={1} fontSize={fontSize}>
                                <FormattedMessage
                                    defaultMessage="Shipping"
                                    id="order_summary.label.shipping"
                                />
                                {hasShippingPromos && (
                                    <Text as="span" ml={1}>
                                        (
                                        <FormattedMessage
                                            defaultMessage="Promotion applied"
                                            id="order_summary.label.promo_applied"
                                        />
                                        )
                                    </Text>
                                )}
                            </Text>
                            {hasShippingPromos && (
                                <PromoPopover ml={1}>
                                    <Stack>
                                        {shippingItem?.priceAdjustments?.map((adjustment) => (
                                            <Text key={adjustment.priceAdjustmentId} fontSize="sm">
                                                {adjustment.itemText}
                                            </Text>
                                        ))}
                                    </Stack>
                                </PromoPopover>
                            )}
                        </Flex>

                        {shippingItem?.priceAdjustments?.some(
                            ({appliedDiscount}) => appliedDiscount?.type === 'free'
                        ) ? (
                            <Text
                                as="span"
                                color="green.500"
                                textTransform="uppercase"
                                fontSize={fontSize}
                            >
                                <FormattedMessage
                                    defaultMessage="Free"
                                    id="order_summary.label.free"
                                />
                            </Text>
                        ) : (
                            <Text fontSize={fontSize}>
                                <FormattedNumber
                                    value={basket.shippingTotal}
                                    style="currency"
                                    currency={basket.currency}
                                />
                            </Text>
                        )}
                    </Flex>

                    <Flex justify="space-between">
                        <Text fontSize={fontSize}>
                            <FormattedMessage defaultMessage="Tax" id="order_summary.label.tax" />
                        </Text>
                        {basket.taxTotal != null ? (
                            <Text fontSize={fontSize}>
                                <FormattedNumber
                                    value={basket.taxTotal}
                                    style="currency"
                                    currency={basket.currency}
                                />
                            </Text>
                        ) : (
                            <Text fontSize={fontSize} color="gray.700">
                                TBD
                            </Text>
                        )}
                    </Flex>
                </Stack>

                {showPromoCodeForm ? (
                    <Box w="full">
                        <PromoCode {...promoCodeProps} />
                    </Box>
                ) : (
                    <Divider />
                )}

                <Stack spacing={4} w="full">
                    <Flex w="full" justify="space-between">
                        {isEstimate ? (
                            <Text fontWeight="bold" fontSize={fontSize}>
                                <FormattedMessage
                                    defaultMessage="Estimated Total"
                                    id="order_summary.label.estimated_total"
                                />
                            </Text>
                        ) : (
                            <Text fontWeight="bold" fontSize={fontSize}>
                                <FormattedMessage
                                    defaultMessage="Order Total"
                                    id="order_summary.label.order_total"
                                />
                            </Text>
                        )}
                        <Text fontWeight="bold" fontSize={fontSize}>
                            <FormattedNumber
                                style="currency"
                                currency={basket?.currency}
                                value={basket?.orderTotal || basket?.productTotal}
                            />
                        </Text>
                    </Flex>

                    {basket.couponItems?.length > 0 && (
                        <Stack
                            p={4}
                            border="1px solid"
                            borderColor="gray.100"
                            borderRadius="base"
                            bg="white"
                        >
                            <Text fontWeight="medium" fontSize={fontSize}>
                                <FormattedMessage
                                    defaultMessage="Promotions applied"
                                    id="order_summary.label.promotions_applied"
                                />
                                :
                            </Text>
                            <Stack>
                                {basket.couponItems.map((item) => (
                                    <Flex key={item.couponItemId} alignItems="center">
                                        <Text flex="1" fontSize="sm" color="gray.800">
                                            {item.code}
                                        </Text>
                                        {!basket.orderNo && (
                                            <Button
                                                variant="link"
                                                size="sm"
                                                colorScheme="red"
                                                onClick={() => removePromoCode(item.couponItemId)}
                                            >
                                                <FormattedMessage
                                                    defaultMessage="Remove"
                                                    id="order_summary.action.remove_promo"
                                                />
                                            </Button>
                                        )}
                                    </Flex>
                                ))}
                            </Stack>
                        </Stack>
                    )}
                </Stack>
            </Stack>
        </Stack>
    )
}

OrderSummary.propTypes = {
    basket: PropTypes.object,
    showPromoCodeForm: PropTypes.bool,
    showCartItems: PropTypes.bool,
    isEstimate: PropTypes.bool,
    fontSize: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl'])
}

export default OrderSummary
