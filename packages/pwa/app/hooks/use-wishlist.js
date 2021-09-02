/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// import {useIntl} from 'react-intl'
import React from 'react'
import {Button} from '@chakra-ui/react'
import Link from '../components/link'
import {useCustomerProductList} from '../commerce-api/hooks/useCustomerProductList'
import {useToast} from './use-toast'
import {withAsync} from '../utils/utils'
import {API_ERROR_MESSAGE} from '../constants'

const PWA_DEFAULT_WISHLIST_NAME = 'PWA wishlist'

const useWishlist = (options = {}) => {
    const enableToast = options?.enableToast

    // TODO: this hook is invoked by useShopper in _app_config
    // the intl provider is not available, we need to move
    // intl provider a level higher to wrap _app_config
    // const {formatMessage} = useIntl()
    const toast = useToast()
    const wishlist = useCustomerProductList(PWA_DEFAULT_WISHLIST_NAME, options)

    if (!enableToast) {
        return wishlist
    }

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
                // @TODO: Link depends on locale
                // <Button as={Link} variant="link" to="/account/wishlist">
                //     View
                // </Button>
                null
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
        addItem: withAsync(wishlist.addItem, {
            onSuccess: onSuccessAdd,
            onError
        }),
        removeItemByProductId: withAsync(wishlist.removeItemByProductId, {
            onSuccess: onSuccessRemove,
            onError
        })
    }
}

export default useWishlist
