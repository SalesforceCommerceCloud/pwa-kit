/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useSelectedItem} from '@salesforce/retail-react-app/app/pages/cart/use-selected-item'
import {useShopperBasketsMutation} from '@salesforce/commerce-sdk-react'
import {useShowGenericError} from '@salesforce/retail-react-app/app/pages/cart/use-show-generic-error'
import {useToast} from '@salesforce/retail-react-app/app/hooks/use-toast'
import {useIntl} from 'react-intl'
import {TOAST_MESSAGE_REMOVED_ITEM_FROM_CART} from '@salesforce/retail-react-app/app/constants'

export const useRemoveItem = ({basket, setCartItemLoading}) => {
    const {setSelectedItem} = useSelectedItem()
    const removeItemFromBasketMutation = useShopperBasketsMutation('removeItemFromBasket')
    const showError = useShowGenericError()
    const toast = useToast()
    const {formatMessage} = useIntl()

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

    return handleRemoveItem
}
