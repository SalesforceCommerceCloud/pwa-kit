/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useState, useMemo} from 'react'
import {useIntl} from 'react-intl'
import debounce from 'lodash/debounce'
import {useShopperBasketsMutation} from '@salesforce/commerce-sdk-react'
import useToast from '../../../hooks/use-toast'
import {TOAST_MESSAGE_REMOVED_ITEM_FROM_CART} from '../../../../config/constants'
import {getUpdateBundleChildArray} from '../../../utils/product-utils'
import {useDisclosure} from '@chakra-ui/react'

const DEBOUNCE_WAIT = 750

/**
 * Custom hook to handle all cart operations (add, update, remove, quantity changes)
 * @param {Object} basket - The current basket data
 * @param {Object} productsByItemId - Products organized by item ID
 * @param {Function} showError - Function to show error messages
 * @returns {Object} Object containing cart operations and state
 */
export const useCartOperations = (basket, productsByItemId, showError) => {
    const [selectedItem, setSelectedItem] = useState(undefined)
    const [localQuantity, setLocalQuantity] = useState({})
    const [isCartItemLoading, setCartItemLoading] = useState(false)

    // Modal state and actions
    const {open: isOpen, onOpen, onClose} = useDisclosure()

    const intl = useIntl()
    const {formatMessage} = intl
    const toast = useToast()

    const messages = useMemo(
        () => ({
            removedItemFromCart: formatMessage(TOAST_MESSAGE_REMOVED_ITEM_FROM_CART, {
                quantity: 1
            })
        }),
        [intl]
    )

    /*****************Basket Mutations************************/
    const updateItemInBasketMutation = useShopperBasketsMutation('updateItemInBasket')
    const updateItemsInBasketMutation = useShopperBasketsMutation('updateItemsInBasket')
    const removeItemFromBasketMutation = useShopperBasketsMutation('removeItemFromBasket')

    /***************************** Update Cart **************************/
    const handleUpdateCart = async (variant, quantity) => {
        // using try-catch is better than using onError callback since we have many mutation calls logic here
        try {
            setCartItemLoading(true)
            // close the modal before performing any actions on cart item
            onClose()
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

    const handleUpdateBundle = async (bundle, bundleQuantity, childProducts) => {
        try {
            setCartItemLoading(true)
            // close the modal before performing any actions on cart item
            onClose()
            const itemsToBeUpdated = getUpdateBundleChildArray(bundle, childProducts)

            // We only update the parent bundle when the quantity changes
            // Since top level bundles don't have variants
            if (bundle.quantity !== bundleQuantity) {
                itemsToBeUpdated.unshift({
                    itemId: bundle.itemId,
                    productId: bundle.productId,
                    quantity: bundleQuantity
                })
            }

            if (itemsToBeUpdated.length) {
                await updateItemsInBasketMutation.mutateAsync({
                    method: 'PATCH',
                    parameters: {
                        basketId: basket.basketId
                    },
                    body: itemsToBeUpdated
                })
            }
        } catch {
            showError()
        } finally {
            setCartItemLoading(false)
            setSelectedItem(undefined)
        }
    }

    const handleUnavailableProducts = async (unavailableProductIds) => {
        const productItems = basket?.productItems?.filter((item) =>
            unavailableProductIds?.includes(item.productId)
        )

        await Promise.all(
            productItems.map(async (item) => {
                await handleRemoveItem(item)
            })
        )
    }

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
    }, DEBOUNCE_WAIT)

    const handleChangeItemQuantity = async (product, value) => {
        const stockLevel = productsByItemId?.[product.itemId]?.inventory?.stockLevel ?? 1

        // Handle removing of the items when 0 is selected.
        if (value === 0) {
            // Flush last call to keep ui in sync with data.
            changeItemQuantity.flush()

            // Set the selected item to the current product to the modal acts on it.
            setSelectedItem(product)

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
                        title: messages.removedItemFromCart,
                        type: 'success'
                    })
                },
                onError: () => {
                    showError()
                }
            }
        )
    }

    return {
        isOpen,
        onClose,
        onOpen,
        selectedItem,
        setSelectedItem,
        localQuantity,
        isCartItemLoading,
        setCartItemLoading,
        handleUpdateCart,
        handleUpdateBundle,
        handleUnavailableProducts,
        handleChangeItemQuantity,
        handleRemoveItem,
        changeItemQuantity
    }
}
