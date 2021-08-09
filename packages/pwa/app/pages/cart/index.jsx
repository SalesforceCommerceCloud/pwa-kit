import React from 'react'
import {Box, Stack, Grid, GridItem, Container} from '@chakra-ui/react'
import EmptyCart from './partials/empty-cart'
import CartItem from './partials/cart-item'
import CartLedger from './partials/cart-ledger'
import CartTitle from './partials/cart-title'
import CartCta from './partials/cart-cta'
import CartSkeleton from './partials/cart-skeleton'
import useBasket from '../../commerce-api/hooks/useBasket'

const Cart = () => {
    const basket = useBasket()
    if (!basket.basketId) {
        return <CartSkeleton />
    }

    if (!basket?.productItems) {
        return <EmptyCart />
    }

    return (
        <Box background="gray.50">
            <Container
                data-testid="sf-cart-container"
                maxWidth="container.xl"
                p={[4, 6, 6, 4]}
                paddingTop={[null, null, null, 6]}
            >
                <Grid templateColumns={{base: '1fr', lg: '66% 1fr'}} gap={{base: 10, xl: 20}}>
                    <GridItem>
                        <Stack paddingTop={4} spacing={4}>
                            <CartTitle />
                            {basket.productItems.map((product) => (
                                <CartItem
                                    key={product.productId}
                                    product={{
                                        ...product,
                                        ...(basket._productItemsDetail &&
                                            basket._productItemsDetail[product.productId]),
                                        price: product.price
                                    }}
                                />
                            ))}
                        </Stack>
                    </GridItem>
                    <GridItem py={8} px={[6, 6, 6, 0]}>
                        <CartLedger />
                    </GridItem>
                </Grid>
            </Container>
            <Box
                h="130px"
                position="sticky"
                bottom={0}
                bg="white"
                display={['block', 'block', 'block', 'none']}
                align="center"
            >
                <CartCta />
            </Box>
        </Box>
    )
}

Cart.getTemplateName = () => 'cart'

export default Cart
