import React, {useState} from 'react'
import {FormattedMessage, FormattedNumber} from 'react-intl'
import {Box, Button, Flex, Heading, Stack, Text} from '@chakra-ui/react'
import useBasket from '../../../commerce-api/hooks/useBasket'
import {BasketIcon, ChevronDownIcon, ChevronUpIcon} from '../../../components/icons'

const OrderSummary = () => {
    const basket = useBasket()
    const [cartItemsExpanded, setCartItemsExpanded] = useState(false)

    return (
        <Stack spacing={5}>
            <Heading fontSize="lg" lineHeight="30px">
                <FormattedMessage defaultMessage="Order Summary" />
            </Heading>

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
                                <Flex width="full" key={item.itemId}>
                                    <Box width="84px" height="84px" bg="gray.100" mr={4}></Box>
                                    <Stack spacing={0} flex={1}>
                                        <Text fontWeight="bold">{item.productName}</Text>
                                        <Text fontSize="sm">Size: XXL</Text>
                                        <Text fontSize="sm">
                                            <FormattedMessage defaultMessage="Quantity" />:{' '}
                                            {item.quantity}
                                        </Text>
                                    </Stack>
                                    <Text fontWeight="bold">
                                        <FormattedNumber
                                            value={item.price * item.quantity}
                                            style="currency"
                                            currency={basket.currency}
                                        />
                                    </Text>
                                </Flex>
                            ))}

                            <Button variant="link" width="full">
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
        </Stack>
    )
}

export default OrderSummary
