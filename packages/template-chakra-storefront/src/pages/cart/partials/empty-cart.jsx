/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useMemo} from 'react'
import PropTypes from 'prop-types'
import {useIntl} from 'react-intl'
import {Box, Button, Stack, Center, Text} from '@chakra-ui/react'
import {AccountIcon, BasketIcon} from '../../../components/icons'
import Link from '../../../components/link'

const EmptyCart = ({isRegistered}) => {
    const intl = useIntl()
    const {formatMessage} = intl

    const messages = useMemo(
        () => ({
            title: formatMessage({
                id: 'empty_cart.description.empty_cart',
                defaultMessage: 'Your cart is empty.'
            }),
            description: {
                registered: formatMessage({
                    id: 'empty_cart.message.continue_shopping',
                    defaultMessage: 'Continue shopping to add items to your cart.'
                }),
                unregistered: formatMessage({
                    id: 'empty_cart.message.sign_in_or_continue_shopping',
                    defaultMessage: 'Sign in to retrieve your saved items or continue shopping.'
                })
            },
            buttons: {
                continueShopping: formatMessage({
                    id: 'empty_cart.link.continue_shopping',
                    defaultMessage: 'Continue Shopping'
                }),
                signIn: formatMessage({
                    id: 'empty_cart.link.sign_in',
                    defaultMessage: 'Sign In'
                })
            }
        }),
        [intl]
    )

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
                                    {messages.title}
                                </Text>
                            </Center>

                            <Text textAlign="center" fontSize="md" color="gray.700">
                                {isRegistered
                                    ? messages.description.registered
                                    : messages.description.unregistered}
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
                                <Link href={'/'}>{messages.buttons.continueShopping}</Link>
                            </Button>
                            {!isRegistered && (
                                <Button asChild variant="solid">
                                    <Link href="/account" width={['343px', '220px']}>
                                        {messages.buttons.signIn}
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
