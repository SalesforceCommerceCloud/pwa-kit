/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useState} from 'react'
import {FormattedMessage, useIntl} from 'react-intl'

// Chakra Components
import {Box, Stack, Grid, GridItem, Container, useDisclosure, Button} from '@chakra-ui/react'

// Project Components
import CartCta from './partials/cart-cta'
import CartSecondaryButtonGroup from './partials/cart-secondary-button-group'
import CartSkeleton from './partials/cart-skeleton'
import CartTitle from './partials/cart-title'
import ConfirmationModal from '../../components/confirmation-modal'
import EmptyCart from './partials/empty-cart'
import OrderSummary from '../../components/order-summary'
import ProductItem from '../../components/product-item/index'
import ProductViewModal from '../../components/product-view-modal'
import RecommendedProducts from '../../components/recommended-products'

// Hooks
import {useToast} from '../../hooks/use-toast'
import useWishlist from '../../hooks/use-wishlist'
import useNavigation from '../../hooks/use-navigation'

// Constants
import {
    API_ERROR_MESSAGE,
    TOAST_ACTION_VIEW_WISHLIST,
    TOAST_MESSAGE_ADDED_TO_WISHLIST
} from '../../constants'
import {REMOVE_CART_ITEM_CONFIRMATION_DIALOG_CONFIG} from './partials/cart-secondary-button-group'

// Utilities
import debounce from 'lodash/debounce'
import {useCurrentBasket} from '../../hooks/use-current-basket'
import {
    useCustomerType,
    useShopperBasketsMutation,
    useShippingMethodsForShipment
} from 'commerce-sdk-react-preview'

const Cart = () => {
    const {basket, productItemDetail = {}} = useCurrentBasket({
        shouldFetchProductDetail: true
    })
    const {products = {}} = productItemDetail
    const customerType = useCustomerType()

    /*****************Basket Mutation************************/
    const updateItemInBasketAction = useShopperBasketsMutation({action: 'updateItemInBasket'})
    const removeItemFromBasketAction = useShopperBasketsMutation({action: 'removeItemFromBasket'})
    const updateShippingMethodForShipmentsAction = useShopperBasketsMutation({
        action: 'updateShippingMethodForShipment'
    })
    /*****************Basket Mutation************************/

    const [selectedItem, setSelectedItem] = useState(undefined)
    const [localQuantity, setLocalQuantity] = useState({})
    const [isCartItemLoading, setCartItemLoading] = useState(false)

    const {isOpen, onOpen, onClose} = useDisclosure()
    const {formatMessage} = useIntl()
    const toast = useToast()
    const navigate = useNavigation()
    const modalProps = useDisclosure()

    /******************* Shipping Methods for basket shipment *******************/
    // do this action only if the basket shipping method is not defined
    // we need to fetch the shippment methods to get the default value before we can add it to the basket
    useShippingMethodsForShipment(
        {
            basketId: basket?.basketId,
            shipmentId: 'me'
        },
        {
            // only fetch if basket is has no shipping method in the first shipment
            enabled:
                !!basket?.basketId &&
                basket.shipments.length > 0 &&
                !basket.shipments[0].shippingMethod,
            onSuccess: (data) => {
                updateShippingMethodForShipmentsAction.mutate({
                    parameters: {
                        basketId: basket?.basketId,
                        shipmentId: 'me'
                    },
                    body: {
                        id: data.defaultShippingMethodId
                    }
                })
            }
        }
    )

    /************************* Error handling ***********************/
    const showError = () => {
        toast({
            title: formatMessage(API_ERROR_MESSAGE),
            status: 'error'
        })
    }
    /************************* Error handling ***********************/

    /**************** Wishlist ****************/
    const wishlist = useWishlist()
    // TODO: DRY this handler when intl provider is available globally
    const handleAddToWishlist = async (product) => {
        try {
            await wishlist.createListItem({
                id: product.productId,
                quantity: product.quantity
            })
            toast({
                title: formatMessage(TOAST_MESSAGE_ADDED_TO_WISHLIST, {quantity: 1}),
                status: 'success',
                action: (
                    // it would be better if we could use <Button as={Link}>
                    // but unfortunately the Link component is not compatible
                    // with Chakra Toast, since the ToastManager is rendered via portal
                    // and the toast doesn't have access to intl provider, which is a
                    // requirement of the Link component.
                    <Button variant="link" onClick={() => navigate('/account/wishlist')}>
                        {formatMessage(TOAST_ACTION_VIEW_WISHLIST)}
                    </Button>
                )
            })
        } catch {
            showError()
        }
    }
    /**************** Wishlist ****************/

    /***************************** Update Cart **************************/
    const handleUpdateCart = async (variant, quantity) => {
        // close the modal before handle the change
        onClose()
        // using try-catch is better than using onError callback since we have many mutation calls logic here
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
                return await updateItemInBasketAction.mutate({
                    parameters: {
                        basketId: basket.basketId,
                        itemId: selectedItem.itemId
                    },
                    body: item
                })
            }

            // The user is selecting different variant, and it has existed in basket
            // remove this item in the basket, change the quantity for the new selected variant in the basket
            if (selectedItem.id !== variant.productId && productIds.includes(variant.productId)) {
                await removeItemFromBasketAction.mutate({
                    parameters: {
                        basketId: basket.basketId,
                        itemId: selectedItem.itemId
                    }
                })
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
        } catch {
            showError()
        } finally {
            setCartItemLoading(false)
            setSelectedItem(undefined)
        }
    }
    /***************************** Update Cart **************************/

    /***************************** Update quantity **************************/
    const changeItemQuantity = debounce(async (quantity, product) => {
        // This local state allows the dropdown to show the desired quantity
        // while the API call to update it is happening.
        const previousQuantity = localQuantity[product.itemId]
        setLocalQuantity({...localQuantity, [product.itemId]: quantity})
        setCartItemLoading(true)
        setSelectedItem(product)

        await updateItemInBasketAction.mutate(
            {
                parameters: {basketId: basket?.basketId, itemId: product.itemId},
                body: {
                    productId: product.id,
                    quantity: parseInt(quantity)
                }
            },
            {
                onSuccess: () => {
                    // reset the state
                    setCartItemLoading(false)
                    setSelectedItem(undefined)
                    setLocalQuantity({...localQuantity, [product.itemId]: undefined})
                },
                onError: () => {
                    // reset the quantity to the previous value
                    setLocalQuantity({...localQuantity, [product.itemId]: previousQuantity})
                    showError()
                }
            }
        )
    }, 750)

    const handleChangeItemQuantity = async (product, value) => {
        const {stockLevel} = products?.[product.productId].inventory

        // Handle removing of the items when 0 is selected.
        if (value === 0) {
            // Flush last call to keep ui in sync with data.
            changeItemQuantity.flush()

            // Set the selected item to the current product to the modal acts on it.
            setSelectedItem(product)

            // Show the modal.
            modalProps.onOpen()

            // Return false as 0 isn't valid section.
            return false
        }

        // Cancel any pending handlers.
        changeItemQuantity.cancel()

        // Allow use to selected values above the inventory.
        if (value > stockLevel || value === product.quantity) {
            return true
        }

        // Take action.
        changeItemQuantity(value, product)

        return true
    }
    /***************************** Update quantity **************************/

    /***************************** Remove Item from basket **************************/
    const handleRemoveItem = async (product) => {
        setSelectedItem(product)
        setCartItemLoading(true)
        await removeItemFromBasketAction.mutate(
            {
                parameters: {basketId: basket.basketId, itemId: product.itemId}
            },
            {
                onSettled: () => {
                    // reset the state
                    setCartItemLoading(false)
                    setSelectedItem(undefined)
                },
                onSuccess: () => {
                    toast({
                        title: formatMessage({
                            defaultMessage: 'Item removed from cart',
                            id: 'cart.info.removed_from_cart'
                        }),
                        status: 'success'
                    })
                },
                onError: () => {
                    showError()
                }
            }
        )
    }
    /***************************** Remove Item **************************/
    /********* Rendering  UI **********/
    if (!basket?.basketId && products) {
        return <CartSkeleton />
    }

    if (!basket?.productItems) {
        return <EmptyCart isRegistered={customerType === 'registered'} />
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
                                    {basket.productItems.map((productItem, idx) => {
                                        return (
                                            <ProductItem
                                                key={productItem.productId}
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
                                                    ...productItem,
                                                    ...(products &&
                                                        products[productItem.productId]),
                                                    price: productItem.price,
                                                    quantity: localQuantity[productItem.itemId]
                                                        ? localQuantity[productItem.itemId]
                                                        : productItem.quantity
                                                }}
                                                onItemQuantityChange={handleChangeItemQuantity.bind(
                                                    this,
                                                    productItem
                                                )}
                                                showLoading={
                                                    isCartItemLoading &&
                                                    selectedItem?.itemId === productItem.itemId
                                                }
                                                handleRemoveItem={handleRemoveItem}
                                            />
                                        )
                                    })}
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
                                title={
                                    <FormattedMessage
                                        defaultMessage="Recently Viewed"
                                        id="cart.recommended_products.title.recently_viewed"
                                    />
                                }
                                recommender={'viewed-recently-einstein'}
                                mx={{base: -4, sm: -6, lg: 0}}
                            />

                            <RecommendedProducts
                                title={
                                    <FormattedMessage
                                        defaultMessage="You May Also Like"
                                        id="cart.recommended_products.title.may_also_like"
                                    />
                                }
                                recommender={'product-to-product-einstein'}
                                products={basket?.productItems?.map((item) => item.productId)}
                                shouldFetch={() => basket?.basketId && products?.length > 0}
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

            <ConfirmationModal
                {...REMOVE_CART_ITEM_CONFIRMATION_DIALOG_CONFIG}
                onPrimaryAction={() => {
                    handleRemoveItem(selectedItem)
                }}
                onAlternateAction={() => {}}
                {...modalProps}
            />
        </Box>
    )
}

Cart.getTemplateName = () => 'cart'

export default Cart
