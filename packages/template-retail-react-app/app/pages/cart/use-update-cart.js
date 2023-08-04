/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useSelectedItem} from '@salesforce/retail-react-app/app/pages/cart/use-selected-item'
import {useShopperBasketsMutation} from '@salesforce/commerce-sdk-react'
import {useShowGenericError} from '@salesforce/retail-react-app/app/pages/cart/use-show-generic-error'
import {useChangeItemQuantity} from '@salesforce/retail-react-app/app/pages/cart/use-change-item-quantity'

export const useUpdateCart = ({basket, setCartItemLoading, setLocalQuantity}) => {
    const {selectedItem, setSelectedItem} = useSelectedItem()
    const showError = useShowGenericError()
    const updateItemInBasketMutation = useShopperBasketsMutation('updateItemInBasket')
    const removeItemFromBasketMutation = useShopperBasketsMutation('removeItemFromBasket')
    const changeItemQuantity = useChangeItemQuantity({basket, setCartItemLoading, setLocalQuantity})

    const handleUpdateCart = async (variant, quantity) => {
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

    return handleUpdateCart
}
