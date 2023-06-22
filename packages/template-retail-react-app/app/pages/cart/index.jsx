/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useState} from 'react'
import {FormattedMessage, useIntl} from 'react-intl'

// Chakra Components
import {
    Box,
    Stack,
    Grid,
    GridItem,
    Container,
    useDisclosure,
    Button
} from '@salesforce/retail-react-app/app/components/shared/ui'

// Project Components
import CartCta from '@salesforce/retail-react-app/app/pages/cart/partials/cart-cta'
import CartSecondaryButtonGroup from '@salesforce/retail-react-app/app/pages/cart/partials/cart-secondary-button-group'
import CartSkeleton from '@salesforce/retail-react-app/app/pages/cart/partials/cart-skeleton'
import CartTitle from '@salesforce/retail-react-app/app/pages/cart/partials/cart-title'
import ConfirmationModal from '@salesforce/retail-react-app/app/components/confirmation-modal'
import EmptyCart from '@salesforce/retail-react-app/app/pages/cart/partials/empty-cart'
import OrderSummary from '@salesforce/retail-react-app/app/components/order-summary'
import ProductItem from '@salesforce/retail-react-app/app/components/product-item/index'
import ProductViewModal from '@salesforce/retail-react-app/app/components/product-view-modal'
import RecommendedProducts from '@salesforce/retail-react-app/app/components/recommended-products'

// Hooks
import {useToast} from '@salesforce/retail-react-app/app/hooks/use-toast'
import useNavigation from '@salesforce/retail-react-app/app/hooks/use-navigation'
import {useWishList} from '@salesforce/retail-react-app/app/hooks/use-wish-list'

// Constants
import {
    API_ERROR_MESSAGE,
    EINSTEIN_RECOMMENDERS,
    TOAST_ACTION_VIEW_WISHLIST,
    TOAST_MESSAGE_ADDED_TO_WISHLIST,
    TOAST_MESSAGE_REMOVED_ITEM_FROM_CART
} from '@salesforce/retail-react-app/app/constants'
import {REMOVE_CART_ITEM_CONFIRMATION_DIALOG_CONFIG} from '@salesforce/retail-react-app/app/pages/cart/partials/cart-secondary-button-group'

// Utilities
import debounce from 'lodash/debounce'
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'
import {
    useShopperBasketsMutation,
    useShippingMethodsForShipment,
    useProducts,
    useShopperCustomersMutation
} from '@salesforce/commerce-sdk-react'
import {useCurrentCustomer} from '@salesforce/retail-react-app/app/hooks/use-current-customer'

const Cart = () => {
    const {data: basket, isLoading} = useCurrentBasket()

    const productIds = basket?.productItems?.map(({productId}) => productId).join(',') ?? ''
    const {data: products} = useProducts(
        {
            parameters: {
                ids: productIds,
                allImages: true
            }
        },
        {
            enabled: Boolean(productIds),
            select: (result) => {
                // Convert array into key/value object with key is the product id
                return result?.data?.reduce((result, item) => {
                    const key = item.id
                    result[key] = item
                    return result
                }, {})
            }
        }
    )
    const {data: customer} = useCurrentCustomer()
    const {customerId, isRegistered} = customer

    /*****************Basket Mutation************************/
    const updateItemInBasketMutation = useShopperBasketsMutation('updateItemInBasket')
    const removeItemFromBasketMutation = useShopperBasketsMutation('removeItemFromBasket')
    const updateShippingMethodForShipmentsMutation = useShopperBasketsMutation(
        'updateShippingMethodForShipment'
    )
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
            parameters: {
                basketId: basket?.basketId,
                shipmentId: 'me'
            }
        },
        {
            // only fetch if basket is has no shipping method in the first shipment
            enabled:
                !!basket?.basketId &&
                basket.shipments.length > 0 &&
                !basket.shipments[0].shippingMethod,
            onSuccess: (data) => {
                updateShippingMethodForShipmentsMutation.mutate({
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
    const {data: wishlist} = useWishList()

    const createCustomerProductListItem = useShopperCustomersMutation(
        'createCustomerProductListItem'
    )
    const handleAddToWishlist = async (product) => {
        try {
            if (!customerId || !wishlist) {
                return
            }
            await createCustomerProductListItem.mutateAsync({
                parameters: {
                    listId: wishlist.id,
                    customerId
                },
                body: {
                    // NOTE: APi does not respect quantity, it always adds 1
                    quantity: product.quantity,
                    productId: product.productId,
                    public: false,
                    priority: 1,
                    type: 'product'
                }
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
                return await updateItemInBasketMutation.mutateAsync({
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
                await removeItemFromBasketMutation.mutateAsync({
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

        await updateItemInBasketMutation.mutateAsync(
            {
                parameters: {basketId: basket?.basketId, itemId: product.itemId},
                body: {
                    productId: product.id,
                    quantity: parseInt(quantity)
                }
            },
            {
                onSettled: () => {
                    // reset the state
                    setCartItemLoading(false)
                    setSelectedItem(undefined)
                },
                onSuccess: () => {
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
        const {stockLevel} = products[product.productId].inventory

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
        await removeItemFromBasketMutation.mutateAsync(
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
                        title: formatMessage(TOAST_MESSAGE_REMOVED_ITEM_FROM_CART, {quantity: 1}),
                        status: 'success'
                    })
                },
                onError: () => {
                    showError()
                }
            }
        )
    }

    /********* Rendering  UI **********/
    if (isLoading) {
        return <CartSkeleton />
    }

    if (!isLoading && !basket?.productItems?.length) {
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
                <Stack spacing={24}>
                    <Stack spacing={4}>
                        <CartTitle />

                        <Grid
                            templateColumns={{base: '1fr', lg: '66% 1fr'}}
                            gap={{base: 10, xl: 20}}
                        >
                            <GridItem>
                                <Stack spacing={4}>
                                    {basket.productItems?.map((productItem, idx) => {
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
                                    <OrderSummary
                                        showPromoCodeForm={true}
                                        isEstimate={true}
                                        basket={basket}
                                    />
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
                                recommender={EINSTEIN_RECOMMENDERS.CART_RECENTLY_VIEWED}
                                mx={{base: -4, sm: -6, lg: 0}}
                            />

                            <RecommendedProducts
                                title={
                                    <FormattedMessage
                                        defaultMessage="You May Also Like"
                                        id="cart.recommended_products.title.may_also_like"
                                    />
                                }
                                recommender={EINSTEIN_RECOMMENDERS.CART_MAY_ALSO_LIKE}
                                products={basket?.productItems}
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
