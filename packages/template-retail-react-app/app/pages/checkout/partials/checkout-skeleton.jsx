/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {Box, Container, Grid, GridItem, Skeleton, Stack} from '@chakra-ui/react'

const CheckoutSkeleton = () => {
    return (
        <Box background="gray.50" flex="1">
            <Container
                data-testid="sf-checkout-skeleton"
                maxWidth="container.xl"
                py={{base: 7, lg: 16}}
                px={{base: 0, lg: 4}}
            >
                <Grid templateColumns={{base: '1fr', lg: '66% 1fr'}} gap={{base: 10, lg: 20}}>
                    <GridItem>
                        <Stack spacing={4}>
                            <Skeleton height="78px" />
                            <Skeleton height="78px" />
                            <Skeleton height="78px" />
                            <Skeleton height="78px" />
                        </Stack>
                    </GridItem>

                    <GridItem py={6} px={[4, 4, 0]}>
                        <Stack spacing={5}>
                            <Skeleton height="30px" width="50%" />

                            <Stack spacing={5}>
                                <Skeleton height="30px" width="65%" />

                                <Stack w="full" py={4} borderY="1px" borderColor="gray.200">
                                    <Skeleton height={6} />
                                    <Skeleton height={6} />
                                    <Skeleton height={6} />
                                </Stack>

                                <Skeleton height={6} />
                            </Stack>
                        </Stack>
                    </GridItem>
                </Grid>
            </Container>
        </Box>
    )
}

export default CheckoutSkeleton
