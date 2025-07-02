/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {FormattedMessage} from 'react-intl'
import {Box, Button, Stack, Center, Text} from '@chakra-ui/react'
import {AccountIcon, BasketIcon} from '../../../components/icons'
import Link from '../../../components/link'

const EmptyCart = ({isRegistered}) => {
    return (
        <Box data-testid="sf-cart-empty" flex="1" minWidth="100%" width="full" background="gray.50">
            <Center>
                <Stack gap={6} width={['343px', '444px']} marginTop="20%" marginBottom="20%">
                    <Center>
                        <BasketIcon boxSize={[8, 10]} />
                    </Center>
                    <Stack gap={8}>
                        <Stack gap={2}>
                            <Center>
                                <Text lineHeight={1} fontSize={['18px', '2xl']} fontWeight="bold">
                                    <FormattedMessage
                                        defaultMessage="Your cart is empty."
                                        id="empty_cart.description.empty_cart"
                                    />
                                </Text>
                            </Center>

                            <Text textAlign="center" fontSize="md" color="gray.700">
                                {isRegistered ? (
                                    <FormattedMessage
                                        defaultMessage="Continue shopping to add items to your cart."
                                        id="empty_cart.message.continue_shopping"
                                    />
                                ) : (
                                    <FormattedMessage
                                        defaultMessage="Sign in to retrieve your saved items or continue shopping."
                                        id="empty_cart.message.sign_in_or_continue_shopping"
                                    />
                                )}
                            </Text>
                        </Stack>
                        <Stack justify="center" direction={['column', 'row']} gap={4}>
                            <Button
                                color={isRegistered ? 'white' : 'blue.600'}
                                variant={isRegistered ? 'solid' : 'outline'}
                                borderColor="blue.600"
                                width={['343px', '220px']}
                                asChild
                            >
                                <Link href={'/'}>
                                    <FormattedMessage
                                        defaultMessage="Continue Shopping"
                                        id="empty_cart.link.continue_shopping"
                                    />
                                </Link>
                            </Button>
                            {!isRegistered && (
                                <Button asChild variant="solid">
                                    <Link href="/account" width={['343px', '220px']}>
                                        <FormattedMessage
                                            defaultMessage="Sign In"
                                            id="empty_cart.link.sign_in"
                                        />
                                        <AccountIcon />
                                    </Link>
                                </Button>
                            )}
                        </Stack>
                    </Stack>
                </Stack>
            </Center>
        </Box>
    )
}
EmptyCart.propTypes = {isRegistered: PropTypes.bool}

export default EmptyCart
