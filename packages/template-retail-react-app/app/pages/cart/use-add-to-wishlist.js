/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {useWishList} from '@salesforce/retail-react-app/app/hooks/use-wish-list'
import {useShopperCustomersMutation} from '@salesforce/commerce-sdk-react'
import {useCurrentCustomer} from '@salesforce/retail-react-app/app/hooks/use-current-customer'
import {useIntl} from 'react-intl'
import {useToast} from '@salesforce/retail-react-app/app/hooks/use-toast'
import {
    TOAST_ACTION_VIEW_WISHLIST,
    TOAST_MESSAGE_ADDED_TO_WISHLIST
} from '@salesforce/retail-react-app/app/constants'
import {Button} from '@salesforce/retail-react-app/app/components/shared/ui'
import useNavigation from '@salesforce/retail-react-app/app/hooks/use-navigation'
import {useShowGenericError} from '@salesforce/retail-react-app/app/pages/cart/use-show-generic-error'

export const useAddToWishlist = () => {
    const {data: wishlist} = useWishList()
    const {data: customer} = useCurrentCustomer()
    const {customerId} = customer
    const {formatMessage} = useIntl()
    const navigate = useNavigation()
    const createCustomerProductListItem = useShopperCustomersMutation(
        'createCustomerProductListItem'
    )

    const toast = useToast()
    const showError = useShowGenericError()

    const handleAddToWishlist = async (product) => {
        try {
            if (!customerId || !wishlist) {
                return
            }
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
                status: 'success',
                action: (
                    // it would be better if we could use <Button as={Link}>
                    // but unfortunately the Link component is not compatible
                    // with Chakra Toast, since the ToastManager is rendered via portal
                    // and the toast doesn't have access to intl provider, which is a
                    // requirement of the Link component.
                    <Button variant="link" onClick={() => navigate('/account/wishlist')}>
                        {formatMessage(TOAST_ACTION_VIEW_WISHLIST)}
                    </Button>
                )
            })
        } catch {
            showError()
        }
    }

    return handleAddToWishlist
}
