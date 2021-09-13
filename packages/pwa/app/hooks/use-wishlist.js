/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useCustomerProductList} from '../commerce-api/hooks/useCustomerProductList'

const PWA_DEFAULT_WISHLIST_NAME = 'PWA wishlist'

const useWishlist = () => {
    const wishlist = useCustomerProductList(PWA_DEFAULT_WISHLIST_NAME)

    return wishlist
    // if (!enableToast) {
    //     return wishlist
    // }

    // const onError = () =>
    //     toast({
    //         title: API_ERROR_MESSAGE,
    //         status: 'error'
    //     })

    // const onSuccessAdd = ({quantity}) => {
    //     toast({
    //         title: `${quantity} items added to wishlist`,
    //         status: 'success',
    //         action: (
    //             // @TODO: Link depends on locale
    //             <Button as={Link} variant="link" to="/account/wishlist">
    //                 View
    //             </Button>
    //             // null
    //         )
    //     })
    // }

    // const onSuccessRemove = () => {
    //     toast({
    //         title: 'Item removed from wishlist',
    //         status: 'success'
    //     })
    // }

    // return {
    //     ...wishlist,
    //     addItem: withAsync(wishlist.addItem, {
    //         onSuccess: onSuccessAdd,
    //         onError
    //     }),
    //     updateItem: withAsync(wishlist.updateItem, {
    //         onError
    //     }),
    //     removeItem: withAsync(wishlist.removeItem, {
    //         onSuccess: onSuccessRemove,
    //         onError
    //     }),
    //     removeItemByProductId: withAsync(wishlist.removeItemByProductId, {
    //         onSuccess: onSuccessRemove,
    //         onError
    //     })
    // }
}

export default useWishlist
