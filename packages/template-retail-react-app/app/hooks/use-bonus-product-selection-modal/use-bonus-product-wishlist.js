/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useCallback} from 'react'
import {useIntl} from 'react-intl'
import {Button} from '@salesforce/retail-react-app/app/components/shared/ui'
import {useShopperCustomersMutation, useCustomerId} from '@salesforce/commerce-sdk-react'
import {useWishList} from '@salesforce/retail-react-app/app/hooks/use-wish-list'
import {useToast} from '@salesforce/retail-react-app/app/hooks/use-toast'
import useNavigation from '@salesforce/retail-react-app/app/hooks/use-navigation'
import {
    API_ERROR_MESSAGE,
    TOAST_MESSAGE_ADDED_TO_WISHLIST,
    TOAST_MESSAGE_REMOVED_FROM_WISHLIST,
    TOAST_ACTION_VIEW_WISHLIST
} from '@salesforce/retail-react-app/app/constants'

export const useBonusProductWishlist = () => {
    const intl = useIntl()
    const toast = useToast()
    const navigate = useNavigation()
    const customerId = useCustomerId()
    const {data: wishlist} = useWishList()

    const createCustomerProductListItem = useShopperCustomersMutation(
        'createCustomerProductListItem'
    )
    const deleteCustomerProductListItem = useShopperCustomersMutation(
        'deleteCustomerProductListItem'
    )

    const handleAddToWishlist = useCallback(
        async (product) => {
            if (!wishlist || !customerId) return

            try {
                await createCustomerProductListItem.mutateAsync({
                    parameters: {
                        listId: wishlist.id,
                        customerId
                    },
                    body: {
                        quantity: 1,
                        productId: product.productId,
                        public: false,
                        priority: 1,
                        type: 'product'
                    }
                })

                toast({
                    title: intl.formatMessage(TOAST_MESSAGE_ADDED_TO_WISHLIST, {quantity: 1}),
                    status: 'success',
                    action: (
                        <Button variant="link" onClick={() => navigate('/account/wishlist')}>
                            {intl.formatMessage(TOAST_ACTION_VIEW_WISHLIST)}
                        </Button>
                    )
                })
            } catch (error) {
                toast({
                    title: intl.formatMessage(API_ERROR_MESSAGE),
                    status: 'error'
                })
            }
        },
        [wishlist, customerId, createCustomerProductListItem, toast, intl, navigate]
    )

    const handleRemoveFromWishlist = useCallback(
        async (product) => {
            if (!wishlist || !customerId) return

            const wishlistItem = wishlist.customerProductListItems?.find(
                (item) => item.productId === product.productId
            )

            if (!wishlistItem) return

            try {
                await deleteCustomerProductListItem.mutateAsync({
                    parameters: {
                        customerId,
                        itemId: wishlistItem.id,
                        listId: wishlist.id
                    }
                })

                toast({
                    title: intl.formatMessage(TOAST_MESSAGE_REMOVED_FROM_WISHLIST),
                    status: 'success'
                })
            } catch (error) {
                toast({
                    title: intl.formatMessage(API_ERROR_MESSAGE),
                    status: 'error'
                })
            }
        },
        [wishlist, customerId, deleteCustomerProductListItem, toast, intl]
    )

    const handleWishlistToggle = useCallback(
        async (product, shouldAdd) => {
            if (shouldAdd) {
                await handleAddToWishlist(product)
            } else {
                await handleRemoveFromWishlist(product)
            }
        },
        [handleAddToWishlist, handleRemoveFromWishlist]
    )

    const isProductInWishlist = useCallback(
        (productId) => {
            return Boolean(
                wishlist?.customerProductListItems?.some((item) => item.productId === productId)
            )
        },
        [wishlist]
    )

    return {
        wishlist,
        handleAddToWishlist,
        handleRemoveFromWishlist,
        handleWishlistToggle,
        isProductInWishlist,
        isLoading:
            createCustomerProductListItem.isLoading || deleteCustomerProductListItem.isLoading
    }
}
