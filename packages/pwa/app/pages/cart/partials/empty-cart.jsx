/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {FormattedMessage} from 'react-intl'
import {Box, Button, Stack, Center, Text} from '@chakra-ui/react'
import {AccountIcon, BasketIcon} from '../../../components/icons'
import Link from '../../../components/link'

const EmptyCart = () => {
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
                                <FormattedMessage defaultMessage="Your Cart is Empty" />
                            </Text>

                            <Text align="center" fontSize="md" color="gray.700">
                                <FormattedMessage defaultMessage="Sign in to retrieve your saved items or continue shopping" />
                            </Text>
                        </Stack>
                        <Stack direction={['column', 'row']} spacing={4}>
                            <Button
                                as={Link}
                                href={'/'}
                                width={['343px', '220px']}
                                variant="outline"
                                color="blue.600"
                            >
                                <FormattedMessage defaultMessage="Continue Shopping" />
                            </Button>
                            <Button
                                as={Link}
                                href="/account"
                                width={['343px', '220px']}
                                rightIcon={<AccountIcon />}
                                variant="solid"
                            >
                                <FormattedMessage defaultMessage="Sign In" />
                            </Button>
                        </Stack>
                    </Stack>
                </Stack>
            </Center>
        </Box>
    )
}

export default EmptyCart
