/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {FormattedMessage} from 'react-intl'
import {
    Box,
    Button,
    Stack,
    Center,
    Text
} from '@salesforce/retail-react-app/app/components/shared/ui'
import {AccountIcon, BasketIcon} from '@salesforce/retail-react-app/app/components/icons'
import Link from '@salesforce/retail-react-app/app/components/link'

const EmptyCart = ({isRegistered}) => {
    return (
        <Box data-testid="sf-cart-empty" flex="1" minWidth="100%" width="full" background="gray.50">
            <Center>
                <Stack spacing={6} width={['343px', '444px']} marginTop="20%" marginBottom="20%">
                    <Box align="center">
                        <BasketIcon boxSize={[8, 10]} />
                    </Box>
                    <Stack spacing={8}>
                        <Stack spacing={2}>
                            <Text
                                lineHeight={1}
                                align="center"
                                fontSize={['18px', '2xl']}
                                fontWeight="bold"
                            >
                                <FormattedMessage
                                    defaultMessage="Your cart is empty."
                                    id="empty_cart.description.empty_cart"
                                />
                            </Text>

                            <Text align="center" fontSize="md" color="gray.700">
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
                        <Stack justify="center" direction={['column', 'row']} spacing={4}>
                            <Button
                                as={Link}
                                href={'/'}
                                width={['343px', '220px']}
                                variant={isRegistered ? 'solid' : 'outline'}
                                color={isRegistered ? 'white' : 'blue.600'}
                            >
                                <FormattedMessage
                                    defaultMessage="Continue Shopping"
                                    id="empty_cart.link.continue_shopping"
                                />
                            </Button>
                            {!isRegistered && (
                                <Button
                                    as={Link}
                                    href="/account"
                                    width={['343px', '220px']}
                                    rightIcon={<AccountIcon />}
                                    variant="solid"
                                >
                                    <FormattedMessage
                                        defaultMessage="Sign In"
                                        id="empty_cart.link.sign_in"
                                    />
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
