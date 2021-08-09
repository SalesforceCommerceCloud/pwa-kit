/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * *
 * Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. *
 * * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React, {useEffect, useState} from 'react'
import {Box, Stack, Grid, GridItem, Container, useDisclosure, Button} from '@chakra-ui/react'
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
import ProductViewModal from '../../components/product-view-modal'

import {useToast} from '../../hooks/use-toast'
import {API_ERROR_MESSAGE} from '../account/constant'
import useCustomerProductLists, {
    eventActions
} from '../../commerce-api/hooks/useCustomerProductLists'
import {customerProductListTypes} from '../../constants'
import useNavigation from '../../hooks/use-navigation'

const Cart = () => {
    const basket = useBasket()
    const intl = useIntl()
    const [selectedItem, setSelectedItem] = useState(undefined)
    const {formatMessage} = useIntl()
    const showToast = useToast()
    const navigate = useNavigation()

    const customerProductLists = useCustomerProductLists()

    const [isCartItemLoading, setCartItemLoading] = useState(false)
    const {isOpen, onOpen, onClose} = useDisclosure()

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

    const handleUpdateCart = async (variant, quantity) => {
        // close the modal before handle the change
        onClose()
        try {
            setCartItemLoading(true)
            const productIds = basket.productItems.map(({productId}) => productId)
            // The user is selecting different variant, and it has not existed in basket
            if (selectedItem.id !== variant.productId && !productIds.includes(variant.productId)) {
                const item = {
                    productId: variant.productId,
                    quantity,
                    price: variant.price
                }
                return await basket.updateItemInBasket(item, selectedItem.itemId)
            }
            // The user is selecting different variant, and it has existed in basket
            // remove this item in the basket, change the quantity for the new selected variant in the basket
            if (selectedItem.id !== variant.productId && productIds.includes(variant.productId)) {
                await basket.removeItemFromBasket(selectedItem.itemId)
                const basketItem = basket.productItems.find(
                    ({productId}) => productId === variant.productId
                )
                const newQuantity = quantity + basketItem.quantity
                return await changeItemQuantity(newQuantity, basketItem)
            }
            // the user only changes quantity of the same variant
            if (selectedItem.quantity !== quantity) {
                return await changeItemQuantity(quantity, selectedItem)
            }
        } catch (err) {
            showToast({
                title: formatMessage(
                    {defaultMessage: '{errorMessage}'},
                    {errorMessage: API_ERROR_MESSAGE}
                ),
                status: 'error'
            })
        } finally {
            setCartItemLoading(false)
            setSelectedItem(undefined)
        }
    }

    const changeItemQuantity = async (quantity, product) => {
        setCartItemLoading(true)
        setSelectedItem(product)
        try {
            if (quantity === 0) {
                await basket.removeItemFromBasket(product.itemId)
            } else {
                const item = {
                    productId: product.id,
                    quantity: parseInt(quantity)
                }
                await basket.updateItemInBasket(item, product.itemId)
            }
        } catch (err) {
            showToast({
                title: formatMessage(
                    {defaultMessage: '{errorMessage}'},
                    {errorMessage: API_ERROR_MESSAGE}
                ),
                status: 'error'
            })
        } finally {
            // reset the state
            setCartItemLoading(false)
            setSelectedItem(undefined)
        }
    }

    const handleAddToWishlist = async (product) => {
        setCartItemLoading(true)
        setSelectedItem(product)
        try {
            // If product-lists have not loaded we push "Add to wishlist" event to eventQueue to be
            // processed once the product-lists have loaded.
            if (!customerProductLists?.loaded) {
                const event = {
                    item: product,
                    action: eventActions.ADD,
                    listType: customerProductListTypes.WISHLIST
                }

                customerProductLists.addActionToEventQueue(event)
            } else {
                const wishlist = customerProductLists.data.find(
                    (list) => list.type === customerProductListTypes.WISHLIST
                )
                const requestBody = {
                    productId: product.productId,
                    priority: 1,
                    quantity: product.quantity,
                    public: false,
                    type: 'product'
                }

                const wishlistItem = await customerProductLists.createCustomerProductListItem(
                    requestBody,
                    wishlist.id
                )

                if (wishlistItem?.id) {
                    const toastAction = (
                        <Button variant="link" onClick={() => navigate('/account/wishlist')}>
                            View
                        </Button>
                    )
                    showToast({
                        title: intl.formatMessage({defaultMessage: '1 item added to wishlist'}),
                        status: 'success',
                        action: toastAction
                    })
                }
            }
        } catch (error) {
            showToast({
                title: intl.formatMessage(
                    {defaultMessage: '{errorMessage}'},
                    {errorMessage: API_ERROR_MESSAGE}
                ),
                status: 'error'
            })
        } finally {
            // close the modal
            setCartItemLoading(false)
            setSelectedItem(undefined)
        }
    }

    const handleRemoveItem = async (product) => {
        setSelectedItem(product)
        setCartItemLoading(true)
        try {
            await basket.removeItemFromBasket(product.itemId)
            showToast({
                title: intl.formatMessage({defaultMessage: 'Item removed from cart'}),
                status: 'success'
            })
        } catch (err) {
            showToast({
                title: intl.formatMessage(
                    {defaultMessage: '{errorMessage}'},
                    {errorMessage: API_ERROR_MESSAGE}
                ),
                status: 'error'
            })
        } finally {
            // reset the state
            setCartItemLoading(false)
            setSelectedItem(undefined)
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
                                                    onAddToWishlistClick={handleAddToWishlist}
                                                    onEditClick={(product) => {
                                                        setSelectedItem(product)
                                                        onOpen()
                                                    }}
                                                    onRemoveItemClick={handleRemoveItem}
                                                />
                                            }
                                            product={{
                                                ...product,
                                                ...(basket._productItemsDetail &&
                                                    basket._productItemsDetail[product.productId]),
                                                price: product.price
                                            }}
                                            onItemQuantityChange={(value) =>
                                                changeItemQuantity(value, product)
                                            }
                                            showLoading={
                                                isCartItemLoading &&
                                                selectedItem?.itemId === product.itemId
                                            }
                                        />
                                    ))}
                                </Stack>
                                <Box>
                                    {isOpen && (
                                        <ProductViewModal
                                            isOpen={isOpen}
                                            onOpen={onOpen}
                                            onClose={onClose}
                                            product={selectedItem}
                                            updateCart={(variant, quantity) =>
                                                handleUpdateCart(variant, quantity)
                                            }
                                        />
                                    )}
                                </Box>
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
