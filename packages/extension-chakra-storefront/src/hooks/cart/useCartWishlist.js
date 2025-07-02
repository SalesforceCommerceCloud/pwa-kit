/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {Button} from '@chakra-ui/react'
import {useIntl} from 'react-intl'
import {useShopperCustomersMutation} from '@salesforce/commerce-sdk-react'
import {useWishList} from '../use-wish-list'
import {useCurrentCustomer} from '../'
import useToast from '../use-toast'
import useNavigation from '../use-navigation'
import {
    TOAST_ACTION_VIEW_WISHLIST,
    TOAST_MESSAGE_ADDED_TO_WISHLIST,
    TOAST_MESSAGE_ALREADY_IN_WISHLIST
} from '../../constants'

/**
 * Custom hook to handle wishlist operations from cart
 * @param {Function} showError - Function to show error messages
 * @returns {Object} Object containing wishlist operations
 */
export const useCartWishlist = (showError) => {
    const {formatMessage} = useIntl()
    const toast = useToast()
    const navigate = useNavigation()
    
    const {data: wishlist} = useWishList()
    const {data: customer} = useCurrentCustomer()
    const {customerId} = customer || {}

    const createCustomerProductListItem = useShopperCustomersMutation(
        'createCustomerProductListItem'
    )

    const handleAddToWishlist = async (product) => {
        try {
            if (!customerId || !wishlist) {
                return
            }

            const isItemInWishlist = wishlist?.customerProductListItems?.find(
                (i) => i.productId === product?.id
            )

            if (!isItemInWishlist) {
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
                    type: 'success',
                    action: (
                        <Button variant="link" onClick={() => navigate('/account/wishlist')}>
                            {formatMessage(TOAST_ACTION_VIEW_WISHLIST)}
                        </Button>
                    )
                })
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
        } catch {
            showError()
        }
    }

    return {
        handleAddToWishlist
    }
} 