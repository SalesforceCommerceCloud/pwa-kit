import React from 'react'
import {FormattedMessage, FormattedNumber} from 'react-intl'
import {Box, Flex, Button, Stack, Text, Heading, Accordion, AccordionItem} from '@chakra-ui/react'
import {ChevronDownIcon} from '../../../components/icons'
import useBasket from '../../../commerce-api/hooks/useBasket'
import CartCta from './cart-cta'

const CartLedger = () => {
    const basket = useBasket()

    const discountTotal = basket?.orderPriceAdjustments?.reduce((sum, item) => {
        return sum + item.price
    }, 0)

    return (
        <Stack paddingTop={{base: 0, lg: 8}} spacing={5}>
            <Heading fontSize="lg" pt={1}>
                <FormattedMessage defaultMessage="Order Summary" />
            </Heading>
            <Stack spacing={4} align="flex-start">
                <Stack width="full">
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
                    {discountTotal && discountTotal !== 0 && (
                        <Flex justify="space-between">
                            <Text color="gray.700">
                                <FormattedMessage defaultMessage="Promotions" />
                            </Text>
                            <Text color="green.500">
                                <FormattedNumber
                                    style="currency"
                                    currency={basket?.currency}
                                    value={discountTotal}
                                />
                            </Text>
                        </Flex>
                    )}
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

                                {/* <AccordionPanel pb={4}>
                                    <Input
                                        marginTop={2}
                                        marginBottom={2}
                                        placeholder="Zip/Postal Code"
                                    />
                                </AccordionPanel> */}
                            </AccordionItem>
                        </Accordion>
                    </Box>
                    <Flex justify="space-between">
                        <Text color="gray.700">
                            <FormattedMessage defaultMessage="Shipping" />
                        </Text>
                        <Text color="gray.700">TBD</Text>
                    </Flex>
                    <Flex justify="space-between">
                        <Text color="gray.700">
                            <FormattedMessage defaultMessage="Tax" />
                        </Text>
                        <Text color="gray.700">TBD</Text>
                    </Flex>
                    <Box>
                        <Accordion allowToggle color="blue.500">
                            <AccordionItem>
                                <Button
                                    py={2}
                                    px={2}
                                    fontSize="sm"
                                    variant="link"
                                    rightIcon={<ChevronDownIcon />}
                                >
                                    <FormattedMessage defaultMessage="Do you have a promo code?" />
                                </Button>

                                {/* <AccordionPanel pb={4}>
                                    <Input
                                        marginTop={2}
                                        marginBottom={2}
                                        placeholder="Promo Code"
                                    />
                                </AccordionPanel> */}
                            </AccordionItem>
                        </Accordion>
                    </Box>
                </Stack>
                <Flex w="full" justify="space-between">
                    <Text fontWeight="bold">
                        <FormattedMessage defaultMessage="Estimated Total" />
                    </Text>
                    <Text fontWeight="bold">
                        <FormattedNumber
                            style="currency"
                            currency={basket?.currency}
                            value={basket?.productTotal}
                        />
                    </Text>
                </Flex>
                <Box w="100%" display={['none', 'none', 'none', 'block']} align="center">
                    <CartCta />
                </Box>
            </Stack>
        </Stack>
    )
}

export default CartLedger
