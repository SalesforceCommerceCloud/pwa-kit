/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useEffect, useRef, useCallback} from 'react'
import {Box, Stack, Grid, GridItem, Container, useDisclosure} from '@chakra-ui/react'
import {useCurrentBasket, useCurrentCustomer} from '../../hooks/'

// Custom Cart Hooks
import {useCartProducts} from './hooks/use-cart-products'
import {useCartOperations} from './hooks/use-cart-operations'
import {useWishList} from '../../hooks/use-wish-list'
import {useCartGiftItems} from './hooks/use-cart-gift-items'
import {useCartDefaultShipping} from './hooks/use-cart-default-shipping'
import {useErrorHandler} from '../../hooks/use-errors'
import {useManualBonusProducts} from '../../hooks/use-manual-bonus-products'

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

    // Initialize manual bonus products hook
    const {
        manualBonusProductCollections,
        createManualBonusProductCollections,
        detectNewlyAddedBonusProducts,
        analyzeQualifyingProductChanges,
        clearAllManualBonusProductCollections
    } = useManualBonusProducts()

    // Store previous basket state for comparison
    const prevBasketRef = useRef(null)

    // Effect to detect and track bonus products when basket changes
    useEffect(() => {
        if (!basket || isPending) return

        const previousBasket = prevBasketRef.current
        if (!previousBasket) {
            prevBasketRef.current = basket
            return
        }

        // Analyze changes in qualifying products
        const qualifyingProductChanges = analyzeQualifyingProductChanges(
            previousBasket,
            basket,
            [] // addedProductIds - this would come from add-to-cart operations
        )

        if (qualifyingProductChanges.length > 0) {
            // Detect newly added bonus products
            const detectionResult = detectNewlyAddedBonusProducts(
                previousBasket,
                basket,
                qualifyingProductChanges
            )

            // Create/update manual bonus product collections
            if (detectionResult.qualifyingProductToBonusProducts) {
                createManualBonusProductCollections(
                    detectionResult.qualifyingProductToBonusProducts
                )
            }

            console.log('Manual Bonus Products Updated:', {
                qualifyingProductChanges: detectionResult.qualifyingProductChanges,
                newBonusProducts: detectionResult.newBonusProducts,
                collections: manualBonusProductCollections
            })
        }

        // Update previous basket reference
        prevBasketRef.current = basket
    }, [
        basket,
        isPending,
        analyzeQualifyingProductChanges,
        detectNewlyAddedBonusProducts,
        createManualBonusProductCollections,
        manualBonusProductCollections
    ])

    // Clear collections when basket is empty or customer logs out
    useEffect(() => {
        if (!basket?.productItems?.length || !isRegistered) {
            clearAllManualBonusProductCollections()
        }
    }, [basket?.productItems?.length, isRegistered, clearAllManualBonusProductCollections])

    // Cart operations with bonus product tracking integration
    const cartOperations = useCartOperations(basket, productsByItemId, showError)

    // Enhanced quantity change handler that tracks qualifying products
    const handleChangeItemQuantityWithTracking = useCallback(
        async (product, value) => {
            // Call original handler
            const result = await cartOperations.handleChangeItemQuantity(product, value)

            // The basket will be updated via the useCurrentBasket hook
            // The useEffect above will automatically detect changes and update bonus collections

            return result
        },
        [cartOperations.handleChangeItemQuantity]
    )

    // Enhanced remove item handler
    const handleRemoveItemWithTracking = useCallback(
        async (product) => {
            // Call original handler
            const result = await cartOperations.handleRemoveItem(product)

            // The useEffect above will automatically detect changes and update bonus collections

            return result
        },
        [cartOperations.handleRemoveItem]
    )

    // Wishlist operations
    const {addToWishlist} = useWishList()
    const handleAddToWishlist = (product) => addToWishlist(product)

    // Gift items
    const {localIsGiftItems, handleIsAGiftChange} = useCartGiftItems(
        basket,
        cartOperations.setCartItemLoading,
        cartOperations.setSelectedItem,
        showError
    )

    // Shipping
    useCartDefaultShipping(basket)

    // Modal state
    const {open: isOpen, onOpen, onClose} = useDisclosure()

    // Handle edit click
    const handleEditClick = (product) => {
        cartOperations.setSelectedItem(product)
        onOpen()
    }

    // Handle modal close
    const handleModalClose = () => {
        onClose()
        cartOperations.setSelectedItem(undefined)
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
                                    localQuantity={cartOperations.localQuantity}
                                    localIsGiftItems={localIsGiftItems}
                                    isProductsPending={isProductsPending}
                                    isCartItemLoading={cartOperations.isCartItemLoading}
                                    selectedItem={cartOperations.selectedItem}
                                    handleChangeItemQuantity={handleChangeItemQuantityWithTracking}
                                    handleIsAGiftChange={handleIsAGiftChange}
                                    handleAddToWishlist={handleAddToWishlist}
                                    handleEditClick={handleEditClick}
                                    handleRemoveItem={handleRemoveItemWithTracking}
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
                selectedItem={cartOperations.selectedItem}
                handleUpdateCart={cartOperations.handleUpdateCart}
                handleUpdateBundle={cartOperations.handleUpdateBundle}
                handleRemoveItem={handleRemoveItemWithTracking}
                basket={basket}
                handleUnavailableProducts={cartOperations.handleUnavailableProducts}
            />
        </Box>
    )
}

Cart.getTemplateName = () => 'cart'

export default Cart
