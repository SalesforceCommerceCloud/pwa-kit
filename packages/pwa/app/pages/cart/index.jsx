/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

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
import useCustomerProductLists from '../../commerce-api/hooks/useCustomerProductLists'
import {API_ERROR_MESSAGE, customerProductListTypes} from '../../constants'
import useNavigation from '../../hooks/use-navigation'
import useCustomer from '../../commerce-api/hooks/useCustomer'

const Cart = () => {
    const basket = useBasket()
    const customer = useCustomer()
    const [selectedItem, setSelectedItem] = useState(undefined)
    const [localQuantity, setLocalQuantity] = useState({})
    const {formatMessage} = useIntl()
    const showToast = useToast()
    const navigate = useNavigation()

    const productListEventHandler = (event) => {
        if (event.action === 'add') {
            showWishlistItemAdded(event.item?.quantity)
        }
    }

    const showError = (error) => {
        console.log(error)
        showToast({
            title: formatMessage(
                {defaultMessage: '{errorMessage}'},
                {errorMessage: API_ERROR_MESSAGE}
            ),
            status: 'error'
        })
    }

    const customerProductLists = useCustomerProductLists({
        eventHandler: productListEventHandler,
        errorHandler: showError
    })

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
        return <EmptyCart isRegistered={customer.isRegistered} />
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
        } catch (error) {
            showError(error)
        } finally {
            setCartItemLoading(false)
            setSelectedItem(undefined)
        }
    }

    const changeItemQuantity = async (quantity, product) => {
        // This local state allows the dropdown to show the desired quantity
        // while the API call to update it is happening.
        setLocalQuantity({...localQuantity, [product.itemId]: quantity})
        setCartItemLoading(true)
        setSelectedItem(product)
        try {
            const item = {
                productId: product.id,
                quantity: parseInt(quantity)
            }
            await basket.updateItemInBasket(item, product.itemId)
        } catch (error) {
            showError(error)
        } finally {
            // reset the state
            setCartItemLoading(false)
            setSelectedItem(undefined)
            setLocalQuantity({...localQuantity, [product.itemId]: undefined})
        }
    }

    const showWishlistItemAdded = (quantity) => {
        const toastAction = (
            <Button variant="link" onClick={() => navigate('/account/wishlist')}>
                View
            </Button>
        )
        showToast({
            title: formatMessage(
                {
                    defaultMessage:
                        '{quantity} {quantity, plural, one {item} other {items}} added to wishlist'
                },
                {quantity}
            ),
            status: 'success',
            action: toastAction
        })
    }

    const handleAddToWishlist = async (product) => {
        setCartItemLoading(true)
        setSelectedItem(product)
        try {
            // If product-lists have not loaded we push "Add to wishlist" event to eventQueue to be
            // processed once the product-lists have loaded.

            // @TODO: move the logic to useCustomerProductLists
            // Cart shouldn't need to know the implementation detail of the event queue
            // Cart should just do "customerProductLists.addItem(item)"!
            if (!customerProductLists?.loaded) {
                const event = {
                    item: product,
                    action: 'add',
                    listType: customerProductListTypes.WISHLIST,
                    showStatus: showWishlistItemAdded,
                    showError
                }

                customerProductLists.addActionToEventQueue(event)
            } else {
                const wishlist = customerProductLists.data.find(
                    (list) => list.type === customerProductListTypes.WISHLIST
                )

                const wishlistItem = await customerProductLists.createCustomerProductListItem(
                    wishlist,
                    {
                        productId: product.productId,
                        priority: 1,
                        quantity: product.quantity,
                        public: false,
                        type: 'product'
                    }
                )

                if (wishlistItem?.id) {
                    showWishlistItemAdded(product.quantity)
                }
            }
        } catch (error) {
            showError(error)
        } finally {
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
                title: formatMessage({defaultMessage: 'Item removed from cart'}),
                status: 'success'
            })
        } catch (error) {
            showError(error)
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
                                                price: product.price,
                                                quantity: localQuantity[product.itemId]
                                                    ? localQuantity[product.itemId]
                                                    : product.quantity
                                            }}
                                            onItemQuantityChange={(value) =>
                                                changeItemQuantity(value, product)
                                            }
                                            showLoading={
                                                isCartItemLoading &&
                                                selectedItem?.itemId === product.itemId
                                            }
                                            handleRemoveItem={handleRemoveItem}
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
