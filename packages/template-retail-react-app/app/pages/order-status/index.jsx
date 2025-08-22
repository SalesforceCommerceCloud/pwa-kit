/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useRef, useEffect, useLayoutEffect} from 'react'
import {Redirect} from 'react-router-dom'
import {FormattedMessage} from 'react-intl'
import {
    Box,
    Heading,
    Grid,
    Container,
    Button,
    Text,
    Stack
} from '@salesforce/retail-react-app/app/components/shared/ui'
import {BrandLogo} from '@salesforce/retail-react-app/app/components/icons'
import useNavigation from '@salesforce/retail-react-app/app/hooks/use-navigation'
import {useCurrentCustomer} from '@salesforce/retail-react-app/app/hooks/use-current-customer'
import OrderLookup from '@salesforce/retail-react-app/app/components/order-lookup/index'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'

const OrderStatusPage = () => {
    const navigate = useNavigation()
    const {data: customer} = useCurrentCustomer()
    const {isRegistered, customerType} = customer
    const headingRef = useRef()

    useEffect(() => {
        // Focus the 'Order Status' header when the component mounts for accessibility
        headingRef?.current?.focus()
    }, [])

    const handleSignInClick = () => {
        navigate('/login')
    }

    const handleOrderLookup = () => {
        // TODO: API integration for order lookup
    }

    // Check if user is not registered and customer data has loaded
    const shouldShowSignInForm = customerType !== null && !isRegistered

    const isOmsEnabled = getConfig()?.app?.oms?.enabled

    // Redirect to home if user navigates to order status page manually
    useLayoutEffect(() => {
        if (isOmsEnabled === false) {
            navigate('/', 'replace')
        }
    }, [isOmsEnabled, navigate])

    // Hide the page entirely and redirect when OMS is disabled
    if (isOmsEnabled === false) {
        return <Redirect to="/" />
    }

    return (
        <Box data-testid="order-status-page" bg="gray.50">
            <Container py={{base: 8, md: 8}} pt={{base: 12, md: 24}}>
                <Heading as="h1" size="lg" textAlign="center" tabIndex="0" ref={headingRef}>
                    <FormattedMessage
                        defaultMessage="Order Status"
                        id="order_status_page.heading.order_status"
                    />
                </Heading>
            </Container>
            <Container maxW="container.lg" px={4} mt={8} pb={{base: 8, md: 16}}>
                {shouldShowSignInForm ? (
                    // Two-column layout when sign-in form is present
                    <Grid
                        templateColumns={{base: '1fr', md: '1fr 1fr'}}
                        gap={8}
                        justifyContent="center"
                        alignItems="flex-start"
                    >
                        {/* Sign In Card */}
                        <Box
                            bg="white"
                            borderRadius="md"
                            boxShadow="md"
                            p={{base: 6, md: 8}}
                            maxW="md"
                            width="100%"
                            mx="auto"
                        >
                            <Stack spacing={6} align="center">
                                <BrandLogo width="60px" height="auto" />
                                <Text fontSize="lg" fontWeight="medium" textAlign="center">
                                    <FormattedMessage
                                        defaultMessage="Sign in with your Account"
                                        id="order_status_page.sign_in.heading"
                                    />
                                </Text>
                                <Button
                                    colorScheme="blue"
                                    size="lg"
                                    width="100%"
                                    onClick={handleSignInClick}
                                >
                                    <FormattedMessage
                                        defaultMessage="Sign in"
                                        id="order_status_page.sign_in.button"
                                    />
                                </Button>
                            </Stack>
                        </Box>

                        {/* Order Lookup Card */}
                        <OrderLookup onSubmit={handleOrderLookup} />
                    </Grid>
                ) : (
                    // Centered single-column layout when sign-in form is not present
                    <Box display="flex" justifyContent="center">
                        <OrderLookup onSubmit={handleOrderLookup} />
                    </Box>
                )}
            </Container>
        </Box>
    )
}

export default OrderStatusPage
