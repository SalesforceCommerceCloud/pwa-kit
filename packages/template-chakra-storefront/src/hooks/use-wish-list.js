/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useEffect, useCallback} from 'react'
import {useIntl} from 'react-intl'
import {Button} from '@chakra-ui/react'
import {
    useCustomerProductLists,
    useShopperCustomersMutation,
    useCustomerId
} from '@salesforce/commerce-sdk-react'
import useToast from './use-toast'
import useNavigation from './use-navigation'
import {
    API_ERROR_MESSAGE,
    TOAST_ACTION_VIEW_WISHLIST,
    TOAST_MESSAGE_ADDED_TO_WISHLIST,
    TOAST_MESSAGE_ALREADY_IN_WISHLIST,
    TOAST_MESSAGE_REMOVED_FROM_WISHLIST
} from '../../config/constants'
import {normalizeProductId} from '../utils/utils'

const onClient = typeof window !== 'undefined'

/**
 * A hook for managing a customer's wish list.
 *
 * This hook provides state and actions for managing a wish list. It fetches the customer's
 * product lists and identifies the wish list. If no wish list exists, it creates one.
 * By default, it uses the first wish list found for the customer.
 *
 * The returned object also includes all the query states from `useCustomerProductLists`,
 * such as `isLoading`, `isError`, etc.
 *
 * @param {object} [options]
 * @param {string} [options.listId] - The ID of a specific wish list to use. If not provided, the first found wish list is used.
 * @returns {object} An object containing the wish list data and actions.
 */
export const useWishList = ({listId = ''} = {}) => {
    const {formatMessage} = useIntl()
    const navigate = useNavigation()
    const toast = useToast()
    const customerId = useCustomerId()

    const createCustomerProductList = useShopperCustomersMutation('createCustomerProductList')
    const createCustomerProductListItem = useShopperCustomersMutation(
        'createCustomerProductListItem'
    )
    const deleteCustomerProductListItem = useShopperCustomersMutation(
        'deleteCustomerProductListItem'
    )

    const {
        data: productLists,
        isSuccess: isProductListsSuccess,
        ...restOfQuery
    } = useCustomerProductLists(
        {
            parameters: {customerId}
        },
        {
            enabled: onClient && Boolean(customerId)
        }
    )

    // Handle product list creation when no lists exist
    useEffect(() => {
        if (!productLists || !isProductListsSuccess || productLists.total) return
        createCustomerProductList.mutate({
            parameters: {customerId},
            body: {type: 'wish_list'}
        })
    }, [productLists, isProductListsSuccess])

    const wishLists = productLists?.data?.filter((list) => list.type === 'wish_list') || []
    const currentWishlist = wishLists.find((list) => list.id === listId)
    const wishlist = !listId ? wishLists[0] : currentWishlist

    const isItemInWishlist = useCallback(
        (product, variant) => {
            if (!wishlist || !product) {
                return false
            }
            const productId = normalizeProductId(product, variant)
            return !!wishlist.customerProductListItems?.find((item) => item.productId === productId)
        },
        [wishlist]
    )

    const addToWishlist = useCallback(
        async (product, variant, quantity = 1) => {
            try {
                if (!customerId || !wishlist) {
                    return
                }

                const productId = normalizeProductId(product, variant)

                if (isItemInWishlist(product, variant)) {
                    toast({
                        title: formatMessage(TOAST_MESSAGE_ALREADY_IN_WISHLIST),
                        type: 'info',
                        action: (
                            <Button variant="link" onClick={() => navigate('/account/wishlist')}>
                                {formatMessage(TOAST_ACTION_VIEW_WISHLIST)}
                            </Button>
                        )
                    })
                    return
                }

                await createCustomerProductListItem.mutateAsync({
                    parameters: {
                        listId: wishlist.id,
                        customerId
                    },
                    body: {
                        quantity,
                        productId,
                        public: false,
                        priority: 1,
                        type: 'product'
                    }
                })

                toast({
                    title: formatMessage(TOAST_MESSAGE_ADDED_TO_WISHLIST, {quantity: 1}),
                    type: 'success',
                    action: (
                        <Button variant="link" onClick={() => navigate('/account/wishlist')}>
                            {formatMessage(TOAST_ACTION_VIEW_WISHLIST)}
                        </Button>
                    )
                })
            } catch (error) {
                console.error(error)
                toast({
                    title: formatMessage(API_ERROR_MESSAGE),
                    type: 'error'
                })
            }
        },
        [
            customerId,
            wishlist,
            isItemInWishlist,
            createCustomerProductListItem,
            toast,
            formatMessage,
            navigate
        ]
    )

    const removeFromWishlist = useCallback(
        async (product, variant) => {
            try {
                if (!customerId || !wishlist) {
                    return
                }

                const productId = normalizeProductId(product, variant)
                const item = wishlist.customerProductListItems?.find(
                    (i) => i.productId === productId
                )

                if (!item) return

                await deleteCustomerProductListItem.mutateAsync({
                    body: {},
                    parameters: {customerId, listId: wishlist.id, itemId: item.id}
                })

                toast({
                    title: formatMessage(TOAST_MESSAGE_REMOVED_FROM_WISHLIST),
                    type: 'success'
                })
            } catch (error) {
                console.error(error)
                toast({
                    title: formatMessage(API_ERROR_MESSAGE),
                    type: 'error'
                })
            }
        },
        [customerId, wishlist, deleteCustomerProductListItem, toast, formatMessage]
    )

    const toggleWishlist = useCallback(
        (product, variant, options = {}) => {
            const action = isItemInWishlist(product, variant) ? removeFromWishlist : addToWishlist
            action(product, variant, options)
        },
        [isItemInWishlist, removeFromWishlist, addToWishlist]
    )

    return {
        data: wishlist,
        isItemInWishlist,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        ...restOfQuery
    }
}
