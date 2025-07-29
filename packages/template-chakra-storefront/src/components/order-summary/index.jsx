/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {FormattedNumber, useIntl} from 'react-intl'
import {Box, Flex, Button, Stack, Text, Heading, Separator, Accordion} from '@chakra-ui/react'
import Link from '../../components/link'
import {PromoCode, usePromoCode} from '../promo-code'
import ItemVariantProvider from '../../components/item-variant'
import CartItemVariantImage from '../../components/item-variant/item-image'
import CartItemVariantName from '../../components/item-variant/item-name'
import CartItemVariantAttributes from '../../components/item-variant/item-attributes'
import CartItemVariantPrice from '../../components/item-variant/item-price'
import PromoPopover from '../../components/promo-popover'
import {useProducts} from '@salesforce/commerce-sdk-react'
import {BasketIcon} from '../icons'

const CartItems = ({basket}) => {
    const intl = useIntl()
    const totalItems = basket?.productItems?.reduce((acc, item) => acc + item.quantity, 0) || 0
    const productIds = basket?.productItems?.map(({productId}) => productId).join(',') ?? ''
    const {data: products} = useProducts(
        {
            parameters: {
                ids: productIds,
                allImages: true
            }
        },
        {
            enabled: Boolean(productIds),
            select: (result) => {
                // Convert array into key/value object with key is the product id
                return result?.data?.reduce((result, item) => {
                    const key = item.id
                    result[key] = item
                    return result
                }, {})
            }
        }
    )

    const messages = {
        itemsInCart: intl.formatMessage({
            id: "order_summary.cart_items.action.num_of_items_in_cart",
            defaultMessage: "{itemCount, plural, =0 {0 items} one {# item} other {# items}} in cart"
        }, {itemCount: totalItems}),
        editCart: intl.formatMessage({
            id: "order_summary.cart_items.link.edit_cart",
            defaultMessage: "Edit cart"
        })
    }

    return (
        <Accordion.Root w="full" collapsible>
            <Accordion.Item>
                <Accordion.ItemTrigger>
                    <Box as="span" flex="1" textAlign="left" fontSize="md" color="blue.600">
                        <BasketIcon display="inline" mr={2} />
                        {messages.itemsInCart}
                    </Box>
                    <Accordion.ItemIndicator />
                </Accordion.ItemTrigger>
                <Accordion.ItemContent px="0" py="4">
                    <Stack gap="5" alignItems="flex-start" separator={<Separator w="full" />}>
                        {basket.productItems?.map((product, idx) => {
                            const variant = {
                                ...product,
                                ...(products && products[product.productId]),
                                price: product.price
                            }
                            return (
                                <ItemVariantProvider
                                    key={product.productId}
                                    index={idx}
                                    variant={variant}
                                >
                                    <Flex width="full" alignItems="flex-start">
                                        <CartItemVariantImage width="80px" mr="2" />
                                        <Stack width="full" gap="1" marginTop="-3px">
                                            <CartItemVariantName />
                                            <CartItemVariantAttributes includeQuantity />
                                            <CartItemVariantPrice
                                                baseDirection="row"
                                                currency={basket?.currency}
                                            />
                                        </Stack>
                                    </Flex>
                                </ItemVariantProvider>
                            )
                        })}

                        <Button asChild to="/cart" variant="link-blue" width="full">
                            <Link>
                                {messages.editCart}
                            </Link>
                        </Button>
                    </Stack>
                </Accordion.ItemContent>
            </Accordion.Item>
        </Accordion.Root>
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
    const intl = useIntl()
    const {removePromoCode, ...promoCodeProps} = usePromoCode()

    if (!basket?.basketId && !basket?.orderNo) {
        return null
    }
    const shippingItem = basket.shippingItems?.[0]
    const hasShippingPromos = shippingItem?.priceAdjustments?.length > 0

    const messages = {
        orderSummary: intl.formatMessage({
            id: "order_summary.heading.order_summary",
            defaultMessage: "Order Summary"
        }),
        subtotal: intl.formatMessage({
            id: "order_summary.label.subtotal",
            defaultMessage: "Subtotal"
        }),
        shipping: intl.formatMessage({
            id: "order_summary.label.shipping",
            defaultMessage: "Shipping"
        }),
        promoApplied: intl.formatMessage({
            id: "order_summary.label.promo_applied",
            defaultMessage: "Promotion applied"
        }),
        free: intl.formatMessage({
            id: "order_summary.label.free",
            defaultMessage: "Free"
        }),
        tax: intl.formatMessage({
            id: "order_summary.label.tax",
            defaultMessage: "Tax"
        }),
        estimatedTotal: intl.formatMessage({
            id: "order_summary.label.estimated_total",
            defaultMessage: "Estimated Total"
        }),
        orderTotal: intl.formatMessage({
            id: "order_summary.label.order_total",
            defaultMessage: "Order Total"
        }),
        promotionsApplied: intl.formatMessage({
            id: "order_summary.label.promotions_applied",
            defaultMessage: "Promotions applied"
        }),
        removePromo: intl.formatMessage({
            id: "order_summary.action.remove_promo",
            defaultMessage: "Remove"
        })
    }

    return (
        <Stack data-testid="sf-order-summary" gap="5">
            <Heading fontSize={fontSize} pt="1" id="order-summary-heading">
                {messages.orderSummary}
            </Heading>
            <Stack gap="4" align="flex-start" role="region" aria-labelledby="order-summary-heading">
                {showCartItems && <CartItems basket={basket} />}
                <Stack w="full">
                    <Flex justifyContent="space-between" aria-live="polite" aria-atomic="true">
                        <Text fontWeight="bold" fontSize={fontSize}>
                            {messages.subtotal}
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
                        <Flex
                            justifyContent="space-between"
                            key={adjustment.priceAdjustmentId}
                            aria-live="polite"
                            aria-atomic="true"
                        >
                            <Text fontSize={fontSize}>{adjustment.itemText}</Text>
                            <Text color="green.600" fontSize={fontSize}>
                                <FormattedNumber
                                    style="currency"
                                    currency={basket?.currency}
                                    value={adjustment.price}
                                />
                            </Text>
                        </Flex>
                    ))}

                    <Flex justifyContent="space-between" aria-live="polite" aria-atomic="true">
                        <Flex alignItems="center">
                            <Text lineHeight={1} fontSize={fontSize}>
                                {messages.shipping}
                                {hasShippingPromos && (
                                    <Text as="span" ml={1}>
                                        ({messages.promoApplied})
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
                                color="green.700"
                                textTransform="uppercase"
                                fontSize={fontSize}
                            >
                                {messages.free}
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

                    <Flex justifyContent="space-between" aria-live="polite" aria-atomic="true">
                        <Text fontSize={fontSize}>
                            {messages.tax}
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
                    <Separator w="full" />
                )}
                <Stack gap="4" w="full">
                    <Flex
                        w="full"
                        justifyContent="space-between"
                        aria-live="polite"
                        aria-atomic="true"
                    >
                        {isEstimate ? (
                            <Text fontWeight="bold" fontSize={fontSize}>
                                {messages.estimatedTotal}
                            </Text>
                        ) : (
                            <Text fontWeight="bold" fontSize={fontSize}>
                                {messages.orderTotal}
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
                            p="4"
                            border="1px solid"
                            borderColor="gray.100"
                            borderRadius="base"
                            bg="white"
                        >
                            <Text fontWeight="medium" fontSize={fontSize}>
                                {messages.promotionsApplied}:
                            </Text>
                            <Stack>
                                {basket.couponItems.map((item) => (
                                    <Flex key={item.couponItemId} alignItems="center">
                                        <Text flex="1" fontSize="sm" color="gray.800">
                                            {item.code}
                                        </Text>
                                        {!basket.orderNo && (
                                            <Button
                                                variant="link-red"
                                                size="sm"
                                                colorPalete="red"
                                                onClick={() => removePromoCode(item.couponItemId)}
                                            >
                                                {messages.removePromo}
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
