/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useState} from 'react'
import {
    Box,
    Stack,
    Grid,
    GridItem,
    Container
} from '@salesforce/retail-react-app/app/components/shared/ui'

import CartCta from '@salesforce/retail-react-app/app/pages/cart/partials/cart-cta'
import CartSkeleton from '@salesforce/retail-react-app/app/pages/cart/partials/cart-skeleton'
import CartTitle from '@salesforce/retail-react-app/app/pages/cart/partials/cart-title'
import EmptyCart from '@salesforce/retail-react-app/app/pages/cart/partials/empty-cart'
import OrderSummary from '@salesforce/retail-react-app/app/components/order-summary'

import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'
import {useCurrentCustomer} from '@salesforce/retail-react-app/app/hooks/use-current-customer'
import {
    HideOnDesktop,
    HideOnMobile
} from '@salesforce/retail-react-app/app/components/responsive/index'
import ProductRecommendations from '@salesforce/retail-react-app/app/pages/cart/product-recommendations'
import {SelectedItemContext} from '@salesforce/retail-react-app/app/pages/cart/use-selected-item'
import ProductItems from '@salesforce/retail-react-app/app/pages/cart/product-items'

const Cart = () => {
    const [selectedItem, setSelectedItem] = useState(undefined)
    const {data: basket, isLoading} = useCurrentBasket()
    const {data: customer} = useCurrentCustomer()
    const {isRegistered} = customer

    if (isLoading) {
        return <CartSkeleton />
    }

    if (!isLoading && !basket?.productItems?.length) {
        return <EmptyCart isRegistered={isRegistered} />
    }
    return (
        <SelectedItemContext.Provider value={{selectedItem, setSelectedItem}}>
            <Box background="gray.50" flex="1" data-testid="sf-cart-container">
                <Container
                    maxWidth="container.xl"
                    px={[4, 6, 6, 4]}
                    paddingTop={{base: 8, lg: 8}}
                    paddingBottom={{base: 8, lg: 14}}
                >
                    <Stack spacing={24}>
                        <Stack spacing={4}>
                            <CartTitle />

                            <Grid
                                templateColumns={{base: '1fr', lg: '66% 1fr'}}
                                gap={{base: 10, xl: 20}}
                            >
                                <GridItem>
                                    <ProductItems />
                                </GridItem>
                                <GridItem>
                                    <Stack spacing={4}>
                                        <OrderSummary
                                            showPromoCodeForm={true}
                                            isEstimate={true}
                                            basket={basket}
                                        />
                                        <HideOnMobile>
                                            <CartCta />
                                        </HideOnMobile>
                                    </Stack>
                                </GridItem>
                            </Grid>

                            <ProductRecommendations />
                        </Stack>
                    </Stack>
                </Container>

                <HideOnDesktop h="130px" position="sticky" bottom={0} bg="white" align="center">
                    <CartCta />
                </HideOnDesktop>
            </Box>
        </SelectedItemContext.Provider>
    )
}

Cart.getTemplateName = () => 'cart'

export default Cart
