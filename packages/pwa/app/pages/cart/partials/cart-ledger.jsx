import React from 'react'
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
    AccordionButton,
    AccordionIcon
} from '@chakra-ui/react'
import {AmexIcon, DiscoverIcon, LockIcon, MastercardIcon, VisaIcon} from '../../../components/icons'
import useBasket from '../../../commerce-api/hooks/useBasket'
import Link from '../../../components/link'

const CartLedger = () => {
    const basket = useBasket()
    return (
        <Stack spacing={5}>
            <Heading fontSize="lg" lineHeight="30px">
                <FormattedMessage defaultMessage="Order Summary" />
            </Heading>
            <Stack spacing={5} align="flex-start">
                <Stack width="full" py={4} borderY="1px" borderColor="gray.200" borderBottom="none">
                    <Flex justify="space-between">
                        <Text fontWeight="bold">
                            <FormattedMessage defaultMessage="Subtotal" />
                        </Text>
                        <FormattedNumber
                            style="currency"
                            currency={basket?.currency}
                            value={basket?.productSubTotal}
                        />
                    </Flex>
                    <Box>
                        <Accordion allowToggle color="blue.500">
                            <AccordionItem borderTop="none" borderBottom="none">
                                <h2>
                                    <AccordionButton variant="link">
                                        <Box flex="1" textAlign="left" fontSize="14px">
                                            <FormattedMessage defaultMessage="Want shipping & tax estimates?" />
                                        </Box>
                                        <AccordionIcon />
                                    </AccordionButton>
                                </h2>
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
                        <Text>
                            <FormattedMessage defaultMessage="Shipping" />
                        </Text>
                        <Text>TBD</Text>
                    </Flex>
                    <Flex justify="space-between">
                        <FormattedMessage defaultMessage="Tax" />
                        <Text>TBD</Text>
                    </Flex>
                    <Box>
                        <Accordion allowToggle color="blue.500">
                            <AccordionItem>
                                <h2>
                                    <AccordionButton variant="link">
                                        <Box flex="1" textAlign="left">
                                            <FormattedMessage defaultMessage="Do you have a promo code?" />
                                        </Box>
                                        <AccordionIcon />
                                    </AccordionButton>
                                </h2>
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
                    <FormattedNumber
                        style="currency"
                        currency={basket?.currency}
                        value={basket?.productSubTotal}
                    />
                </Flex>
                <Box w="100%" display={['none', 'none', 'none', 'block']} align="center">
                    <Button
                        as={Link}
                        to={'/checkout'}
                        w="100%"
                        mb={4}
                        rightIcon={<LockIcon />}
                        variant="solid"
                    >
                        <FormattedMessage defaultMessage="Proceed to Checkout" />
                    </Button>
                    <Flex m="auto" w="140px" justify="space-between">
                        <VisaIcon />
                        <MastercardIcon />
                        <AmexIcon />
                        <DiscoverIcon />
                    </Flex>
                </Box>
            </Stack>
        </Stack>
    )
}

export default CartLedger
