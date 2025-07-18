/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {Box, Heading, Grid, Container, Button, Text, Stack} from '@chakra-ui/react'
import {BrandLogo} from '@salesforce/retail-react-app/app/components/icons'
import useNavigation from '@salesforce/retail-react-app/app/hooks/use-navigation'
import {useCurrentCustomer} from '@salesforce/retail-react-app/app/hooks/use-current-customer'

const OrderStatusPage = () => {
    const navigate = useNavigation()
    const {data: customer} = useCurrentCustomer()
    const {isRegistered, customerType} = customer

    const handleSignInClick = () => {
        navigate('/login')
    }

    // Check if user is not registered and customer data has loaded
    const shouldShowSignInForm = customerType !== null && !isRegistered

    return (
        <Box data-testid="order-status-page" minH="100vh" bg="gray.50">
            <Container py={{base: 8, md: 16}} pt={{base: 12, md: 24}}>
                <Heading as="h1" size="lg" textAlign="left">
                    Order Status
                </Heading>
            </Container>
            <Container maxW="1000px" px={4} mt={8}>
                <Grid
                    templateColumns={{base: '1fr', md: '1fr 1fr'}}
                    gap={8}
                    justifyContent="center"
                    alignItems="flex-start"
                >
                    {/* Sign In Card - Only show if user is not registered */}
                    {shouldShowSignInForm && (
                        <Box
                            bg="white"
                            borderRadius="md"
                            boxShadow="md"
                            p={{base: 6, md: 8}}
                            maxW="450px"
                            width="100%"
                            mx="auto"
                        >
                            <Stack spacing={6} align="center">
                                <BrandLogo width="60px" height="auto" />
                                <Text fontSize="lg" fontWeight="medium" textAlign="center">
                                    Sign in with your Account
                                </Text>
                                <Button
                                    colorScheme="blue"
                                    size="lg"
                                    width="100%"
                                    onClick={handleSignInClick}
                                >
                                    Sign in
                                </Button>
                            </Stack>
                        </Box>
                    )}

                    {/* Order Lookup Card */}
                </Grid>
            </Container>
        </Box>
    )
}

export default OrderStatusPage
