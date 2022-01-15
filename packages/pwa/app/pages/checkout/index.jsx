/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useEffect, useState} from 'react'
import {FormattedMessage} from 'react-intl'
import {Alert, AlertIcon, Box, Button, Container, Grid, GridItem, Stack} from '@chakra-ui/react'
import useNavigation from '../../hooks/use-navigation'
import {CheckoutProvider, useCheckout} from './util/checkout-context'
import ContactInfo from './partials/contact-info'
import ShippingAddress from './partials/shipping-address'
import ShippingOptions from './partials/shipping-options'
import useCustomer from '../../commerce-api/hooks/useCustomer'
import useBasket from '../../commerce-api/hooks/useBasket'
import Payment from './partials/payment'
import CheckoutSkeleton from './partials/checkout-skeleton'
import OrderSummary from '../../components/order-summary'

const Checkout = () => {
    const navigate = useNavigation()
    const {globalError, step, placeOrder} = useCheckout()
    const [isLoading, setIsLoading] = useState(false)

    // Scroll to the top when we get a global error
    useEffect(() => {
        if (globalError || step === 4) {
            window.scrollTo({top: 0})
        }
    }, [globalError, step])

    const submitOrder = async () => {
        setIsLoading(true)
        try {
            await placeOrder()
            navigate('/checkout/confirmation')
        } catch (error) {
            setIsLoading(false)
        }
    }

    return (
        <Box background="gray.50" flex="1">
            <Container
                data-testid="sf-checkout-container"
                maxWidth="container.xl"
                py={{base: 7, lg: 16}}
                px={{base: 0, lg: 8}}
            >
                <Grid templateColumns={{base: '1fr', lg: '66% 1fr'}} gap={{base: 10, xl: 20}}>
                    <GridItem>
                        <Stack spacing={4}>
                            {globalError && (
                                <Alert status="error" variant="left-accent">
                                    <AlertIcon />
                                    {globalError}
                                </Alert>
                            )}

                            <ContactInfo />
                            <ShippingAddress />
                            <ShippingOptions />
                            <Payment />

                            {step === 4 && (
                                <Box pt={3} display={{base: 'none', lg: 'block'}}>
                                    <Container variant="form">
                                        <Button
                                            w="full"
                                            onClick={submitOrder}
                                            isLoading={isLoading}
                                            data-testid="sf-checkout-place-order-btn"
                                        >
                                            <FormattedMessage
                                                defaultMessage="Place Order"
                                                id="checkout.button.place_order"
                                            />
                                        </Button>
                                    </Container>
                                </Box>
                            )}
                        </Stack>
                    </GridItem>

                    <GridItem py={6} px={[4, 4, 4, 0]}>
                        <OrderSummary showTaxEstimationForm={false} showCartItems={true} />

                        {step === 4 && (
                            <Box display={{base: 'none', lg: 'block'}} pt={2}>
                                <Button w="full" onClick={submitOrder} isLoading={isLoading}>
                                    <FormattedMessage
                                        defaultMessage="Place Order"
                                        id="checkout.button.place_order"
                                    />
                                </Button>
                            </Box>
                        )}
                    </GridItem>
                </Grid>
            </Container>

            {step === 4 && (
                <Box
                    display={{lg: 'none'}}
                    position="sticky"
                    bottom="0"
                    px={4}
                    pt={6}
                    pb={11}
                    background="white"
                    borderTop="1px solid"
                    borderColor="gray.100"
                >
                    <Container variant="form">
                        <Button w="full" onClick={submitOrder} isLoading={isLoading}>
                            <FormattedMessage
                                defaultMessage="Place Order"
                                id="checkout.button.place_order"
                            />
                        </Button>
                    </Container>
                </Box>
            )}
        </Box>
    )
}

const CheckoutContainer = () => {
    const customer = useCustomer()
    const basket = useBasket()

    if (!customer || !customer.customerId || !basket || !basket.basketId) {
        return <CheckoutSkeleton />
    }

    return (
        <CheckoutProvider>
            <Checkout />
        </CheckoutProvider>
    )
}

export default CheckoutContainer
