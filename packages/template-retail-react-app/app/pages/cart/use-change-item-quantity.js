/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useShopperBasketsMutation} from '@salesforce/commerce-sdk-react'
import {useSelectedItem} from '@salesforce/retail-react-app/app/pages/cart/use-selected-item'
import {useShowGenericError} from '@salesforce/retail-react-app/app/pages/cart/use-show-generic-error'

export const useChangeItemQuantity = ({basket, setLocalQuantity, setCartItemLoading}) => {
    const updateItemInBasketMutation = useShopperBasketsMutation('updateItemInBasket')
    const {setSelectedItem} = useSelectedItem()
    const showError = useShowGenericError()

    return async (quantity, product) => {
        // This local state allows the dropdown to show the desired quantity
        // while the API call to update it is happening.
        let previousQuantity
        setLocalQuantity((localQuantity) => {
            previousQuantity = localQuantity[product.itemId]
            return {...localQuantity, [product.itemId]: quantity}
        })

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
                    setLocalQuantity((localQuantity) => ({
                        ...localQuantity,
                        [product.itemId]: undefined
                    }))
                },
                onError: () => {
                    // reset the quantity to the previous value
                    setLocalQuantity((localQuantity) => ({
                        ...localQuantity,
                        [product.itemId]: previousQuantity
                    }))
                    showError()
                }
            }
        )
    }
}
