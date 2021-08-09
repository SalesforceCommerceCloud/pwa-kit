import React, {useEffect, useState} from 'react'
import {Box, Stack, Grid, GridItem, Container} from '@chakra-ui/react'
import {FormattedMessage, useIntl} from 'react-intl'
import EmptyCart from './partials/empty-cart'
import ProductItem from '../../components/product-item/index'
import CartTitle from './partials/cart-title'
import CartCta from './partials/cart-cta'
import CartSkeleton from './partials/cart-skeleton'
import useBasket from '../../commerce-api/hooks/useBasket'
import OrderSummary from '../../components/order-summary'
import RecommendedProducts from '../../components/recommended-products'
import CartSecondaryButtonGroup from './partials/cart-secondary-button-group'
import {useToast} from '../../hooks/use-toast'
import {API_ERROR_MESSAGE} from '../account/constant'

const Cart = () => {
    const basket = useBasket()
    const [selectedItem, setSelectedItem] = useState(undefined)
    const {formatMessage} = useIntl()
    const showToast = useToast()

    const handleItemClicked = (itemId) => {
        setSelectedItem(itemId)
    }

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

    const handleChangeItemQuantity = async (quantity, product) => {
        setSelectedItem(product.itemId)
        if (quantity === 0) {
            await basket.removeItemFromBasket(product.itemId)
        } else {
            const productItem = {
                productId: product.id,
                quantity: parseInt(quantity)
            }
            try {
                await basket.updateItemInBasket(productItem, product.itemId)
                setSelectedItem(undefined)
            } catch (err) {
                setSelectedItem(undefined)
                showToast({
                    title: formatMessage(
                        {defaultMessage: '{errorMessage}'},
                        {errorMessage: API_ERROR_MESSAGE}
                    ),
                    status: 'error'
                })
            }
        }
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
                                        <ProductItem
                                            key={product.productId}
                                            index={idx}
                                            secondaryActions={
                                                <CartSecondaryButtonGroup
                                                    onClick={handleItemClicked}
                                                />
                                            }
                                            product={{
                                                ...product,
                                                ...(basket._productItemsDetail &&
                                                    basket._productItemsDetail[product.productId]),
                                                price: product.price
                                            }}
                                            onItemQuantityChange={(value) =>
                                                handleChangeItemQuantity(value, product)
                                            }
                                            showLoading={selectedItem === product.itemId}
                                        />
                                    ))}
                                </Stack>
                            </GridItem>
                            <GridItem>
                                <Stack spacing={4}>
                                    <OrderSummary showPromoCodeForm={true} isEstimate={true} />
                                    <Box display={{base: 'none', lg: 'block'}}>
                                        <CartCta />
                                    </Box>
                                </Stack>
                            </GridItem>
                        </Grid>

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
                                shouldFetch={() =>
                                    basket?.basketId && basket.productItems?.length > 0
                                }
                                mx={{base: -4, sm: -6, lg: 0}}
                            />
                        </Stack>
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
