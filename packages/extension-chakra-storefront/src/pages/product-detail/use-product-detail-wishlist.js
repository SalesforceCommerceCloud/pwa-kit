/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {useIntl} from 'react-intl'
import {Button} from '@chakra-ui/react'
import {useShopperCustomersMutation, useCustomerId} from '@salesforce/commerce-sdk-react'
import useNavigation from '../../hooks/use-navigation'
import useToast from '../../hooks/use-toast'
import {useWishList} from '../../hooks/use-wish-list'
import {
    API_ERROR_MESSAGE,
    TOAST_ACTION_VIEW_WISHLIST,
    TOAST_MESSAGE_ADDED_TO_WISHLIST,
    TOAST_MESSAGE_ALREADY_IN_WISHLIST
} from '../../constants'

// TODO: we are in the process of de-duplicating the wishlist related logic
// across multiple pages. We first need to extract these logic into individual files
// and then we will dedupe them and remove the unnecessary files.
// This file should be removed and the logic should be moved to use-wishlist.js
export const useProductDetailWishlist = () => {
    const {formatMessage} = useIntl()
    const navigate = useNavigation()
    const customerId = useCustomerId()
    const toast = useToast()

    const {data: wishlist, isLoading: isWishlistLoading} = useWishList()
    const createCustomerProductListItem = useShopperCustomersMutation(
        'createCustomerProductListItem'
    )

    const showError = () => {
        toast({
            title: formatMessage(API_ERROR_MESSAGE),
            type: 'error'
        })
    }

    const handleAddToWishlist = (product, variant, quantity) => {
        const isItemInWishlist = wishlist?.customerProductListItems?.find(
            (i) => i.productId === variant?.productId || i.productId === product?.id
        )

        if (!isItemInWishlist) {
            createCustomerProductListItem.mutate(
                {
                    parameters: {
                        listId: wishlist.id,
                        customerId
                    },
                    body: {
                        // NOTE: API does not respect quantity, it always adds 1
                        quantity,
                        productId: variant?.productId || product?.id,
                        public: false,
                        priority: 1,
                        type: 'product'
                    }
                },
                {
                    onSuccess: () => {
                        toast({
                            title: formatMessage(TOAST_MESSAGE_ADDED_TO_WISHLIST, {quantity: 1}),
                            type: 'success',
                            action: (
                                <Button
                                    variant="link"
                                    onClick={() => navigate('/account/wishlist')}
                                >
                                    {formatMessage(TOAST_ACTION_VIEW_WISHLIST)}
                                </Button>
                            )
                        })
                    },
                    onError: () => {
                        showError()
                    }
                }
            )
        } else {
            toast({
                title: formatMessage(TOAST_MESSAGE_ALREADY_IN_WISHLIST),
                type: 'info',
                action: (
                    <Button variant="link" onClick={() => navigate('/account/wishlist')}>
                        {formatMessage(TOAST_ACTION_VIEW_WISHLIST)}
                    </Button>
                )
            })
        }
    }

    return {handleAddToWishlist, isWishlistLoading}
}
