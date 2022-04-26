/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {
    Flex,
    Stack,
    Grid,
    GridItem,
    Container,
    Skeleton,
    Text,
    Heading,
    Box
} from '@chakra-ui/react'
import {FormattedMessage} from 'react-intl'

const CartItemSkeleton = () => {
    return (
        <Stack spacing={4} layerStyle="card" boxShadow="none">
            <Flex width="full" bg="white" marginBottom={[4, 3]}>
                <Skeleton width={['88px', '136px']} height={['88px', '136px']} />
                <Stack marginLeft={[4, 6]} spacing={2} flex={1}>
                    <Skeleton width="80px" height="20px" />
                    <Skeleton
                        width={{base: '180px', sm: '180px', md: '280px', lg: '280px'}}
                        height={3}
                    />
                    <Skeleton
                        width={{base: '120px', sm: '120px', md: '140px', lg: '140px'}}
                        height={3}
                    />
                </Stack>
            </Flex>
        </Stack>
    )
}

const CartSkeleton = () => {
    return (
        <Box background="gray.50" flex="1" paddingBottom={{base: 20, lg: 55}}>
            <Container
                background="gray.50"
                data-testid="sf-cart-skeleton"
                maxWidth="container.xl"
                p={[4, 6, 6, 4]}
                paddingTop={[null, null, null, 6]}
            >
                <Grid templateColumns={{base: '1fr', lg: '66% 1fr'}} gap={{base: 10, xl: 20}}>
                    <GridItem>
                        <Stack paddingTop={4} spacing={4}>
                            <Text fontWeight="bold" fontSize={['xl', 'xl', 'xl', '2xl']}>
                                <FormattedMessage
                                    defaultMessage="Cart"
                                    id="cart_skeleton.title.cart"
                                />
                            </Text>
                            <CartItemSkeleton />
                            <CartItemSkeleton />
                        </Stack>
                    </GridItem>
                    <GridItem py={7}>
                        <Stack paddingTop={{base: 0, lg: 8}} spacing={3} px={[6, 6, 6, 0]}>
                            <Heading fontSize="lg" pt={1}>
                                <FormattedMessage
                                    defaultMessage="Order Summary"
                                    id="cart_skeleton.heading.order_summary"
                                />
                            </Heading>
                            <Stack spacing={3} align="flex-start">
                                <Skeleton
                                    width={{base: '180px', sm: '180px', md: '280px', lg: '280px'}}
                                    height={4}
                                />
                                <Skeleton width="120px" height={4} />
                                <Skeleton
                                    width={{base: '180px', sm: '180px', md: '280px', lg: '280px'}}
                                    height={4}
                                />
                                <Skeleton width="120px" height={4} />
                            </Stack>
                        </Stack>
                    </GridItem>
                </Grid>
            </Container>
        </Box>
    )
}

export default CartSkeleton
