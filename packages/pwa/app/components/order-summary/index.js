import React, {useState} from 'react'
import PropTypes from 'prop-types'
import {FormattedMessage, FormattedNumber} from 'react-intl'
import {
    Box,
    Flex,
    Button,
    Stack,
    Text,
    Heading,
    Accordion,
    AccordionItem,
    Divider
} from '@chakra-ui/react'
import useBasket from '../../commerce-api/hooks/useBasket'
import {BasketIcon, ChevronDownIcon, ChevronUpIcon} from '../icons'
import Link from '../link'
import {PromoCode, usePromoCode} from '../promo-code'
import CartItemVariant from '../cart-item-variant'
import CartItemVariantImage from '../cart-item-variant/item-image'
import CartItemVariantName from '../cart-item-variant/item-name'
import CartItemVariantAttributes from '../cart-item-variant/item-attributes'
import CartItemVariantPrice from '../cart-item-variant/item-price'

const CartItems = () => {
    const basket = useBasket()
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
                        description="# item(s) in cart"
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
                            <CartItemVariant key={product.productId} index={idx} variant={variant}>
                                <Flex width="full" alignItems="flex-start">
                                    <CartItemVariantImage width="80px" mr={2} />
                                    <Stack spacing={1} marginTop="-3px">
                                        <CartItemVariantName />
                                        <CartItemVariantAttributes includeQuantity />
                                        <CartItemVariantPrice textAlign="left" lineHeight={7} />
                                    </Stack>
                                </Flex>
                            </CartItemVariant>
                        )
                    })}

                    <Button as={Link} to="/cart" variant="link" width="full">
                        <FormattedMessage defaultMessage="Edit cart" />
                    </Button>
                </Stack>
            )}
        </Stack>
    )
}

const OrderSummary = ({
    showPromoCodeForm = true,
    showTaxEstimationForm = true,
    showCartItems = false
}) => {
    const basket = useBasket()
    const {removePromoCode, ...promoCodeProps} = usePromoCode()

    return (
        <Stack data-testid="sf-order-summary" spacing={5}>
            <Heading fontSize="lg" pt={1}>
                <FormattedMessage defaultMessage="Order Summary" />
            </Heading>

            <Stack spacing={4} align="flex-start">
                {showCartItems && <CartItems />}

                <Stack w="full">
                    <Flex justify="space-between">
                        <Text fontWeight="bold">
                            <FormattedMessage defaultMessage="Subtotal" />
                        </Text>
                        <Text fontWeight="bold">
                            <FormattedNumber
                                style="currency"
                                currency={basket?.currency}
                                value={basket?.productSubTotal}
                            />
                        </Text>
                    </Flex>

                    {basket.orderPriceAdjustments?.map((adjustment) => (
                        <Flex justify="space-between" key={adjustment.priceAdjustmentId}>
                            <Text>{adjustment.itemText}</Text>
                            <Text color="green.500">
                                <FormattedNumber
                                    style="currency"
                                    currency={basket?.currency}
                                    value={adjustment.price}
                                />
                            </Text>
                        </Flex>
                    ))}

                    {showTaxEstimationForm && (
                        <Box>
                            <Accordion allowToggle color="blue.500">
                                <AccordionItem borderTop="none" borderBottom="none">
                                    <Button
                                        fontSize="sm"
                                        variant="link"
                                        rightIcon={<ChevronDownIcon />}
                                    >
                                        <FormattedMessage defaultMessage="Want shipping & tax estimates?" />
                                    </Button>
                                </AccordionItem>
                            </Accordion>
                        </Box>
                    )}

                    <Flex justify="space-between">
                        <Text>
                            <FormattedMessage defaultMessage="Shipping" />
                        </Text>
                        {basket.shippingTotal != null ? (
                            <Text>
                                <FormattedNumber
                                    value={basket.shippingTotal}
                                    style="currency"
                                    currency={basket.currency}
                                />
                            </Text>
                        ) : (
                            <Text color="gray.700">TBD</Text>
                        )}
                    </Flex>

                    <Flex justify="space-between">
                        <Text>
                            <FormattedMessage defaultMessage="Tax" />
                        </Text>
                        {basket.taxTotal != null ? (
                            <Text>
                                <FormattedNumber
                                    value={basket.taxTotal}
                                    style="currency"
                                    currency={basket.currency}
                                />
                            </Text>
                        ) : (
                            <Text color="gray.700">TBD</Text>
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
                    {/* {basket.totalOrderDiscount !== 0 && (
                        <Flex justify="space-between">
                            <Text color="gray.700">
                                <FormattedMessage defaultMessage="Promotions" />
                            </Text>
                            <Text color="green.500">
                                <FormattedNumber
                                    style="currency"
                                    currency={basket?.currency}
                                    value={basket.totalOrderDiscount}
                                />
                            </Text>
                        </Flex>
                    )} */}

                    <Flex w="full" justify="space-between">
                        <Text fontWeight="bold">
                            <FormattedMessage defaultMessage="Estimated Total" />
                        </Text>
                        <Text fontWeight="bold">
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
                            <Text fontWeight="medium">
                                <FormattedMessage defaultMessage="Promotions applied" />:
                            </Text>
                            <Stack>
                                {basket.couponItems.map((item) => (
                                    <Flex key={item.couponItemId} alignItems="center">
                                        <Text
                                            flex="1"
                                            fontSize="sm"
                                            textTransform="uppercase"
                                            color="gray.800"
                                        >
                                            {item.code}
                                        </Text>
                                        <Button
                                            variant="link"
                                            size="sm"
                                            colorScheme="red"
                                            onClick={() => removePromoCode(item.couponItemId)}
                                        >
                                            <FormattedMessage defaultMessage="Remove" />
                                        </Button>
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
    showPromoCodeForm: PropTypes.bool,
    showTaxEstimationForm: PropTypes.bool,
    showCartItems: PropTypes.bool
}

export default OrderSummary
