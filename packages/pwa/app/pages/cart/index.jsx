import React, {useEffect} from 'react'
import {FormattedMessage} from 'react-intl'
import {Box, Stack, Grid, GridItem, Container} from '@chakra-ui/react'
import EmptyCart from './partials/empty-cart'
import CartItem from './partials/cart-item'
import CartTitle from './partials/cart-title'
import CartCta from './partials/cart-cta'
import CartSkeleton from './partials/cart-skeleton'
import useBasket from '../../commerce-api/hooks/useBasket'
import OrderSummary from '../../components/order-summary'
import RecommendedProducts from '../../components/recommended-products'

const Cart = () => {
    const basket = useBasket()

    useEffect(() => {
        // Set the default shipping method if none is already selected
        if (basket.basketId && basket.shipments.length > 0 && !basket.shipments[0].shippingMethod) {
            ;(async () => {
                const shippingMethods = await basket.getShippingMethods()
                basket.setShippingMethod(shippingMethods.defaultShippingMethodId)
            })()
        }
    }, [basket.basketId])

    if (!basket?.basketId) {
        return <CartSkeleton />
    }

    if (!basket?.productItems) {
        return <EmptyCart />
    }

    return (
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
                                <Stack spacing={4}>
                                    {basket.productItems.map((product, idx) => (
                                        <CartItem
                                            key={product.productId}
                                            index={idx}
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
                            <GridItem>
                                <Stack spacing={4}>
                                    <OrderSummary showPromoCodeForm={true} />
                                    <Box display={{base: 'none', lg: 'block'}}>
                                        <CartCta />
                                    </Box>
                                </Stack>
                            </GridItem>
                        </Grid>
                    </Stack>

                    {/* Product Recommendations */}
                    <Stack spacing={16}>
                        <RecommendedProducts
                            title={<FormattedMessage defaultMessage="Recently Viewed" />}
                            recommender={'viewed-recently-einstein'}
                            mx={{base: -4, sm: -6, lg: 0}}
                        />

                        <RecommendedProducts
                            title={<FormattedMessage defaultMessage="You May Also Like" />}
                            recommender={'product-to-product-einstein'}
                            products={basket?.productItems?.map((item) => item.productId)}
                            shouldFetch={() => basket?.basketId && basket.productItems?.length > 0}
                            mx={{base: -4, sm: -6, lg: 0}}
                        />
                    </Stack>
                </Stack>
            </Container>

            <Box
                h="130px"
                position="sticky"
                bottom={0}
                bg="white"
                display={{base: 'block', lg: 'none'}}
                align="center"
            >
                <CartCta />
            </Box>
        </Box>
    )
}

Cart.getTemplateName = () => 'cart'

export default Cart
