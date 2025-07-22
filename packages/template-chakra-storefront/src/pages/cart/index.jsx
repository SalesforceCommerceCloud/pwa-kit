/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {Box, Stack, Grid, GridItem, Container, useDisclosure} from '@chakra-ui/react'
import {useCurrentBasket, useCurrentCustomer} from '../../hooks/'

// Custom Cart Hooks
import {useCartProducts} from '../../hooks/cart/use-cart-products'
import {useCartOperations} from '../../hooks/cart/use-cart-operations'
import {useWishList} from '../../hooks/use-wish-list'
import {useCartGiftItems} from '../../hooks/cart/use-cart-gift-items'
import {useCartDefaultShipping} from '../../hooks/cart/use-cart-default-shipping'
import {useErrorHandler} from '../../hooks/use-errors'

// Cart Components
import CartTitle from './partials/cart-title'
import CartProductList from './partials/cart-product-list'
import CartSummarySection from './partials/cart-summary-section'
import CartRecommendations from './partials/cart-recommendations'
import CartModals from './partials/cart-modals'
import CartSkeleton from './partials/cart-skeleton'
import EmptyCart from './partials/empty-cart'

const Cart = () => {
    const {data: basket, isPending} = useCurrentBasket()
    const {data: customer} = useCurrentCustomer()
    const {isRegistered} = customer || {}

    // Error handling
    const showError = useErrorHandler()

    // Product data and processing
    const {isProductsPending, productsByItemId} = useCartProducts(basket)

    // Cart operations
    const {
        selectedItem,
        setSelectedItem,
        localQuantity,
        isCartItemLoading,
        setCartItemLoading,
        handleUpdateCart,
        handleUpdateBundle,
        handleUnavailableProducts,
        handleChangeItemQuantity,
        handleRemoveItem
    } = useCartOperations(basket, productsByItemId, showError)

    // Wishlist operations
    const {addToWishlist} = useWishList()
    const handleAddToWishlist = (product) => addToWishlist(product)

    // Gift items
    const {localIsGiftItems, handleIsAGiftChange} = useCartGiftItems(
        basket,
        setCartItemLoading,
        setSelectedItem,
        showError
    )

    // Shipping
    useCartDefaultShipping(basket)

    // Modal state
    const {open: isOpen, onOpen, onClose} = useDisclosure()

    // Handle edit click
    const handleEditClick = (product) => {
        setSelectedItem(product)
        onOpen()
    }

    // Handle modal close
    const handleModalClose = () => {
        onClose()
        setSelectedItem(undefined)
    }

    /********* Rendering UI **********/
    if (isPending) {
        return <CartSkeleton />
    }

    if (!isPending && !basket?.productItems?.length) {
        return <EmptyCart isRegistered={isRegistered} />
    }

    return (
        <Box background="gray.50" flex="1" data-testid="sf-cart-container">
            <Container
                maxWidth="container.xl"
                px={[4, 6, 6, 4]}
                paddingTop={{base: 8, lg: 8}}
                paddingBottom={{base: 8, lg: 14}}
            >
                <Stack gap={24}>
                    <Stack gap={4}>
                        <CartTitle />

                        <Grid
                            templateColumns={{base: '1fr', lg: '66% 1fr'}}
                            gap={{base: 10, xl: 20}}
                        >
                            <GridItem>
                                <CartProductList
                                    basket={basket}
                                    productsByItemId={productsByItemId}
                                    localQuantity={localQuantity}
                                    localIsGiftItems={localIsGiftItems}
                                    isProductsPending={isProductsPending}
                                    isCartItemLoading={isCartItemLoading}
                                    selectedItem={selectedItem}
                                    handleChangeItemQuantity={handleChangeItemQuantity}
                                    handleIsAGiftChange={handleIsAGiftChange}
                                    handleAddToWishlist={handleAddToWishlist}
                                    handleEditClick={handleEditClick}
                                    handleRemoveItem={handleRemoveItem}
                                />
                            </GridItem>
                            <GridItem>
                                <CartSummarySection basket={basket} isDesktop={true} />
                            </GridItem>
                        </Grid>

                        {/* Product Recommendations */}
                        <CartRecommendations basket={basket} />
                    </Stack>
                </Stack>
            </Container>

            {/* Mobile CTA */}
            <CartSummarySection basket={basket} isDesktop={false} />

            {/* Modals */}
            <CartModals
                isOpen={isOpen}
                onOpen={onOpen}
                onClose={handleModalClose}
                selectedItem={selectedItem}
                handleUpdateCart={handleUpdateCart}
                handleUpdateBundle={handleUpdateBundle}
                handleRemoveItem={handleRemoveItem}
                basket={basket}
                handleUnavailableProducts={handleUnavailableProducts}
            />
        </Box>
    )
}

Cart.getTemplateName = () => 'cart'

export default Cart
