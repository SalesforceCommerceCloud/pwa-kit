/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {FormattedMessage} from 'react-intl'
import {Badge, Box, Button, Flex, Center} from '@chakra-ui/react'
import useBasket from '../../../commerce-api/hooks/useBasket'
import Link from '../../../components/link'
import {BasketIcon, BrandLogo} from '../../../components/icons'
import {HOME_HREF} from '../../../constants'

const CheckoutHeader = () => {
    const basket = useBasket()
    return (
        <Box px={[4, 4, 8]} bg="white" borderBottom="1px" borderColor="gray.100">
            <Box maxWidth="container.xxxl" marginLeft="auto" marginRight="auto">
                <Flex h={{base: '52px', md: '80px'}} align="center" justify="space-between">
                    <Link href={HOME_HREF} title="Back to homepage">
                        <BrandLogo
                            width={{base: '35px', md: '45px'}}
                            height={{base: '24px', md: '32px'}}
                        />
                    </Link>

                    <Button
                        as={Link}
                        href="/cart"
                        display="inline-flex"
                        variant="unstyled"
                        color="gray.900"
                        rightIcon={
                            <Center position="relative" width={11} height={11}>
                                <BasketIcon position="absolute" left="0px" />
                                <Badge variant="notification">{basket.itemAccumulatedCount}</Badge>
                            </Center>
                        }
                    >
                        <FormattedMessage
                            defaultMessage="Back to cart"
                            id="checkout_header.link.cart"
                        />
                    </Button>
                </Flex>
            </Box>
        </Box>
    )
}

export default CheckoutHeader
