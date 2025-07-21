/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useEffect, useState} from 'react'
import {
    Alert,
    AlertIcon,
    Box,
    Container,
    Grid,
    GridItem,
    Stack
} from '@salesforce/retail-react-app/app/components/shared/ui'
import {useCheckout} from '@salesforce/retail-react-app/app/pages/checkout-container/util/checkout-context'
import ContactInfo from '@salesforce/retail-react-app/app/pages/checkout-one-click/partials/one-click-contact-info'
import PickupAddress from '@salesforce/retail-react-app/app/pages/checkout-one-click/partials/one-click-pickup-address'
import ShippingAddress from '@salesforce/retail-react-app/app/pages/checkout-one-click/partials/one-click-shipping-address'
import ShippingOptions from '@salesforce/retail-react-app/app/pages/checkout-one-click/partials/one-click-shipping-options'
import Payment from '@salesforce/retail-react-app/app/pages/checkout-one-click/partials/one-click-payment'
import OrderSummary from '@salesforce/retail-react-app/app/components/order-summary'
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'
import {STORE_LOCATOR_IS_ENABLED} from '@salesforce/retail-react-app/app/constants'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'

const CheckoutOneClick = () => {
    const {step} = useCheckout()
    const [error] = useState()
    const {data: basket} = useCurrentBasket()
    const {passwordless = {}, social = {}} = getConfig().app.login || {}
    const idps = social?.idps
    const isSocialEnabled = !!social?.enabled
    const isPasswordlessEnabled = !!passwordless?.enabled

    // Only enable BOPIS functionality if the feature toggle is on
    const isPickupOrder = STORE_LOCATOR_IS_ENABLED
        ? basket?.shipments[0]?.shippingMethod?.c_storePickupEnabled === true
        : false

    useEffect(() => {
        if (error || step === 4) {
            window.scrollTo({top: 0})
        }
    }, [error, step])

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

                            <ContactInfo
                                isSocialEnabled={isSocialEnabled}
                                isPasswordlessEnabled={isPasswordlessEnabled}
                                idps={idps}
                            />
                            {isPickupOrder ? <PickupAddress /> : <ShippingAddress />}
                            {!isPickupOrder && <ShippingOptions />}
                            <Payment />
                        </Stack>
                    </GridItem>

                    <GridItem py={6} px={[4, 4, 4, 0]}>
                        <OrderSummary
                            basket={basket}
                            showTaxEstimationForm={false}
                            showCartItems={true}
                        />
                    </GridItem>
                </Grid>
            </Container>
        </Box>
    )
}

export default CheckoutOneClick
