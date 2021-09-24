/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {Button} from '@chakra-ui/react'
import {useHistory} from 'react-router'

import useCustomerProductList from '../commerce-api/hooks/useCustomerProductList'
import {useToast} from './use-toast'
import {withAsyncCallback} from '../utils/utils'
import {API_ERROR_MESSAGE} from '../constants'

const PWA_DEFAULT_WISHLIST_NAME = 'PWA wishlist'
const PWA_DEFAULT_WISHLIST_TYPE = 'wish_list'

const useWishlist = () => {
    const wishlist = useCustomerProductList(PWA_DEFAULT_WISHLIST_NAME, PWA_DEFAULT_WISHLIST_TYPE)
    const toast = useToast()
    const history = useHistory()
    const onError = () =>
        toast({
            title: API_ERROR_MESSAGE,
            status: 'error'
        })

    const onSuccessAdd = ({quantity}) => {
        toast({
            title: `${quantity} items added to wishlist`,
            status: 'success',
            action: (
                // @TODO: It would be ideal if we use Link component
                // like as={Link} to="/account/wishlist"
                // unfortunately there is an issue with Link component
                // Link component can only be used with localization provider
                // but top level hooks like useWishlist doesn't have
                // access to localization provider.
                <Button variant="link" onClick={() => history.push('/en-GB/account/wishlist')}>
                    View
                </Button>
            )
        })
    }

    const onSuccessRemove = () => {
        toast({
            title: 'Item removed from wishlist',
            status: 'success'
        })
    }

    return {
        ...wishlist,
        createListItem: withAsyncCallback(wishlist.createListItem, {
            onSuccess: onSuccessAdd,
            onError
        }),
        updateListItem: withAsyncCallback(wishlist.updateListItem, {
            onError
        }),
        removeListItemByProductId: withAsyncCallback(wishlist.removeListItemByProductId, {
            onSuccess: onSuccessRemove,
            onError
        })
    }
}

export default useWishlist
