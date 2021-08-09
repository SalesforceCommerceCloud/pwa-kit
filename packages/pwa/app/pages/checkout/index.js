import React, {useEffect} from 'react'
import {Alert, AlertIcon, Box, Container, Grid, GridItem, Stack} from '@chakra-ui/react'
import {CheckoutProvider, useCheckout} from './util/checkout-context'
import OrderSummary from './partials/order-summary'
import ContactInfo from './partials/contact-info'
import ShippingAddress from './partials/shipping-address'
import ShippingOptions from './partials/shipping-options'
import useCustomer from '../../commerce-api/hooks/useCustomer'
import useBasket from '../../commerce-api/hooks/useBasket'
import Payment from './partials/payment'
import CheckoutSkeleton from './partials/checkout-skeleton'

const Checkout = () => {
    const {globalError} = useCheckout()

    // Scroll to the top when we get a global error
    useEffect(() => {
        if (globalError) {
            window.scrollTo({top: 0})
        }
    }, [globalError])

    return (
        <Box background="gray.50">
            <Container
                data-testid="sf-checkout-container"
                maxWidth="container.xl"
                py={{base: 7, md: 16}}
                px={{base: 0, md: 8}}
            >
                <Grid templateColumns={{base: '1fr', md: '66% 1fr'}} gap={{base: 10, xl: 20}}>
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
                        </Stack>
                    </GridItem>

                    <GridItem py={6} px={[4, 4, 0]}>
                        <OrderSummary />
                    </GridItem>
                </Grid>
            </Container>
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
