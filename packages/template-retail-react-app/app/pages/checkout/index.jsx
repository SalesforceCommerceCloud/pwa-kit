/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useEffect, useState} from 'react'
import {FormattedMessage, useIntl} from 'react-intl'
import {
    Alert,
    AlertIcon,
    Box,
    Button,
    Container,
    Grid,
    GridItem,
    Stack
} from '@salesforce/retail-react-app/app/components/shared/ui'
import useNavigation from '@salesforce/retail-react-app/app/hooks/use-navigation'
import {
    CheckoutProvider,
    useCheckout
} from '@salesforce/retail-react-app/app/pages/checkout/util/checkout-context'
import ContactInfo from '@salesforce/retail-react-app/app/pages/checkout/partials/contact-info'
import ShippingAddress from '@salesforce/retail-react-app/app/pages/checkout/partials/shipping-address'
import ShippingOptions from '@salesforce/retail-react-app/app/pages/checkout/partials/shipping-options'
import Payment from '@salesforce/retail-react-app/app/pages/checkout/partials/payment'
import OrderSummary from '@salesforce/retail-react-app/app/components/order-summary'
import {useCurrentCustomer} from '@salesforce/retail-react-app/app/hooks/use-current-customer'
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'
import CheckoutSkeleton from '@salesforce/retail-react-app/app/pages/checkout/partials/checkout-skeleton'
import {useUsid, useShopperOrdersMutation} from '@salesforce/commerce-sdk-react'

const Checkout = () => {
    const {formatMessage} = useIntl()
    const navigate = useNavigation()
    const {usid} = useUsid()
    const {step} = useCheckout()
    const [error, setError] = useState()
    const {data: basket} = useCurrentBasket()
    const [isLoading, setIsLoading] = useState(false)
    const {mutateAsync: createOrder} = useShopperOrdersMutation('createOrder')

    useEffect(() => {
        if (error || step === 4) {
            window.scrollTo({top: 0})
        }
    }, [error, step])

    const submitOrder = async () => {
        setIsLoading(true)
        try {
            const order = await createOrder({
                // We send the SLAS usid via this header. This is required by ECOM to map
                // Einstein events sent via the API with the finishOrder event fired by ECOM
                // when an Order transitions from Created to New status.
                // Without this, various order conversion metrics will not appear on reports and dashboards
                headers: {_sfdc_customer_id: usid},
                body: {basketId: basket.basketId}
            })
            navigate(`/checkout/confirmation/${order.orderNo}`)
        } catch (error) {
            const message = formatMessage({
                id: 'checkout.message.generic_error',
                defaultMessage: 'An unexpected error occurred during checkout.'
            })
            setError(message)
        } finally {
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
                            {error && (
                                <Alert status="error" variant="left-accent">
                                    <AlertIcon />
                                    {error}
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
                        <OrderSummary
                            basket={basket}
                            showTaxEstimationForm={false}
                            showCartItems={true}
                        />

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
    const {data: customer} = useCurrentCustomer()
    const {data: basket} = useCurrentBasket()

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
