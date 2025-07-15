/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useIntl} from 'react-intl'
import {useShopperCustomersMutation, useCustomerId} from '@salesforce/commerce-sdk-react'
import {Button} from '@chakra-ui/react'
import useToast from '../../../hooks/use-toast'
import useNavigation from '../../../hooks/use-navigation'
import {useWishList} from '../../../hooks/use-wish-list'
import {
    API_ERROR_MESSAGE,
    TOAST_ACTION_VIEW_WISHLIST,
    TOAST_MESSAGE_ADDED_TO_WISHLIST,
    TOAST_MESSAGE_REMOVED_FROM_WISHLIST
} from '../../../constants'

export const useProductListWishlist = () => {
    const {formatMessage} = useIntl()
    const navigate = useNavigation()
    const toast = useToast()
    const customerId = useCustomerId()
    const {data: wishlist} = useWishList()

    const {mutateAsync: createCustomerProductListItem} = useShopperCustomersMutation(
        'createCustomerProductListItem'
    )
    const {mutateAsync: deleteCustomerProductListItem} = useShopperCustomersMutation(
        'deleteCustomerProductListItem'
    )

    const addItem = async (product) => {
        // TODO: This wishlist object is from an old API, we need to replace it with the new one.
        const listId = wishlist.id
        await createCustomerProductListItem(
            {
                parameters: {customerId, listId},
                body: {
                    quantity: 1,
                    public: false,
                    priority: 1,
                    type: 'product',
                    productId: product.productId
                }
            },
            {
                onError: () => {
                    toast({
                        title: formatMessage(API_ERROR_MESSAGE),
                        type: 'error'
                    })
                },
                onSuccess: () => {
                    toast({
                        title: formatMessage(TOAST_MESSAGE_ADDED_TO_WISHLIST, {quantity: 1}),
                        type: 'success',
                        action: (
                            <Button variant="link" onClick={() => navigate('/account/wishlist')}>
                                {formatMessage(TOAST_ACTION_VIEW_WISHLIST)}
                            </Button>
                        )
                    })
                }
            }
        )
    }

    const removeItem = async (product) => {
        const listId = wishlist.id
        const item = wishlist.customerProductListItems?.find(
            (i) => i.productId === product.productId
        )

        if (!item) return

        await deleteCustomerProductListItem(
            {
                body: {},
                parameters: {customerId, listId, itemId: item.id}
            },
            {
                onError: () => {
                    toast({
                        title: formatMessage(API_ERROR_MESSAGE),
                        type: 'error'
                    })
                },
                onSuccess: () => {
                    toast({
                        title: formatMessage(TOAST_MESSAGE_REMOVED_FROM_WISHLIST),
                        type: 'success'
                    })
                }
            }
        )
    }

    const isItemInWishlist = (product) => {
        if (!wishlist || !product) {
            return false
        }
        return !!wishlist.customerProductListItems?.find(
            (item) => item.productId === product.productId
        )
    }

    const toggleItem = (product) => {
        const action = isItemInWishlist(product) ? removeItem : addItem
        action(product)
    }

    return {
        toggleItem,
        isItemInWishlist
    }
}
