/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useState} from 'react'
import {useShopperBasketsMutation} from '@salesforce/commerce-sdk-react'

/**
 * Custom hook to handle gift item functionality for cart
 * @param {Object} basket - The current basket data
 * @param {Function} setCartItemLoading - Function to set cart item loading state
 * @param {Function} setSelectedItem - Function to set selected item
 * @param {Function} showError - Function to show error messages
 * @returns {Object} Object containing gift item operations and state
 */
export const useCartGiftItems = (basket, setCartItemLoading, setSelectedItem, showError) => {
    const [localIsGiftItems, setLocalIsGiftItems] = useState({})
    
    const updateItemInBasketMutation = useShopperBasketsMutation('updateItemInBasket')

    const handleIsAGiftChange = async (product, checked) => {
        try {
            const previousVal = localIsGiftItems[product.itemId]
            setLocalIsGiftItems({
                ...localIsGiftItems,
                [product.itemId]: checked
            })
            setCartItemLoading(true)
            setSelectedItem(product)
            await updateItemInBasketMutation.mutateAsync(
                {
                    parameters: {basketId: basket?.basketId, itemId: product.itemId},
                    body: {
                        productId: product.id,
                        quantity: parseInt(product.quantity),
                        gift: checked
                    }
                },
                {
                    onSettled: () => {
                        // reset the state
                        setCartItemLoading(false)
                        setSelectedItem(undefined)
                    },
                    onSuccess: () => {
                        setLocalIsGiftItems({...localIsGiftItems, [product.itemId]: undefined})
                    },
                    onError: () => {
                        // reset the quantity to the previous value
                        setLocalIsGiftItems({...localIsGiftItems, [product.itemId]: previousVal})
                        showError()
                    }
                }
            )
        } catch (e) {
            showError()
        } finally {
            setCartItemLoading(false)
            setSelectedItem(undefined)
        }
    }

    return {
        localIsGiftItems,
        handleIsAGiftChange
    }
} 