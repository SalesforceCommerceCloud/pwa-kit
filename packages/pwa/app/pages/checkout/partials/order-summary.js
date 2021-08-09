import React, {useState} from 'react'
import PropTypes from 'prop-types'
import {FormattedMessage, FormattedNumber} from 'react-intl'
import {useCheckout} from '../util/checkout-context'
import {Box, Button, Flex, Heading, Stack, Text} from '@chakra-ui/react'
import {BasketIcon, ChevronDownIcon, ChevronUpIcon} from '../../../components/icons'
import CartProductVariant from './cart-product-variant'
import link from '../../../components/link'

const OrderSummary = ({isLoading, onPlaceOrderClick = () => null}) => {
    const {basket, step} = useCheckout()
    const [cartItemsExpanded, setCartItemsExpanded] = useState(false)

    return (
        <Stack spacing={5}>
            <Heading fontSize="lg">
                <FormattedMessage defaultMessage="Order Summary" />
            </Heading>

            {/* This is just for testing/dev purposes. Will remove later. */}
            {/* <Button
                onClick={() => basket.addItemToBasket([{productId: '701642811398M', quantity: 2}])}
            >
                Add item
            </Button> */}

            <Stack spacing={5} align="flex-start">
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
                        <Stack spacing={5} align="flex-start">
                            {basket.productItems?.map((item) => (
                                <CartProductVariant key={item.itemId} item={item} />
                            ))}

                            <Button as={link} to="/cart" variant="link" width="full">
                                <FormattedMessage defaultMessage="Edit cart" />
                            </Button>
                        </Stack>
                    )}
                </Stack>

                <Stack w="full" py={4} borderY="1px" borderColor="gray.200">
                    <Flex justify="space-between">
                        <Text fontWeight="bold">
                            <FormattedMessage defaultMessage="Subtotal" />
                        </Text>
                        <Text fontWeight="bold">
                            <FormattedNumber
                                value={basket.productSubTotal}
                                style="currency"
                                currency={basket.currency}
                            />
                        </Text>
                    </Flex>
                    <Flex justify="space-between">
                        <Text>
                            <FormattedMessage defaultMessage="Shipping" />
                        </Text>
                        <Text>
                            {basket.shippingTotal != null ? (
                                <FormattedNumber
                                    value={basket.shippingTotal}
                                    style="currency"
                                    currency={basket.currency}
                                />
                            ) : (
                                'TBD'
                            )}
                        </Text>
                    </Flex>
                    <Flex justify="space-between">
                        <Text>
                            <FormattedMessage defaultMessage="Tax" />
                        </Text>
                        <Text>
                            <FormattedNumber
                                value={basket.taxTotal || basket.merchandizeTotalTax}
                                style="currency"
                                currency={basket.currency}
                            />
                        </Text>
                    </Flex>
                </Stack>

                <Flex w="full" justify="space-between">
                    <Text fontWeight="bold">
                        <FormattedMessage defaultMessage="Estimated Total" />
                    </Text>
                    <Text fontWeight="bold">
                        <FormattedNumber
                            value={basket.orderTotal || basket.productTotal}
                            style="currency"
                            currency={basket.currency}
                        />
                    </Text>
                </Flex>
            </Stack>

            {step === 4 && (
                <Box display={{base: 'none', lg: 'block'}} pt={2}>
                    <Button w="full" onClick={onPlaceOrderClick} isLoading={isLoading}>
                        <FormattedMessage defaultMessage="Place Order" />
                    </Button>
                </Box>
            )}
        </Stack>
    )
}

OrderSummary.propTypes = {
    isLoading: PropTypes.bool,
    onPlaceOrderClick: PropTypes.func
}

export default OrderSummary
