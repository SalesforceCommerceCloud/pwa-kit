// /* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
// /* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
// /* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
import Immutable from 'immutable'
import {createSelector} from 'reselect'
import {createGetSelector} from 'reselect-immutable-helpers'
import {getProducts} from '../../store/products/selectors'
import {WISHLIST_TITLE_DEFAULT} from './constants'

export const getUser = ({user}) => user

export const getIsLoggedIn = createGetSelector(getUser, 'isLoggedIn')

export const getUserCustomContent = createGetSelector(getUser, 'custom', Immutable.Map())

export const getSavedAddresses = createGetSelector(getUser, 'savedAddresses', Immutable.List())

const PLACEHOLDER = {
    text: undefined
}

export const getDefaultAddress = createSelector(
    getUser,
    (user) => {
        const addresses = user.get('savedAddresses')
        return addresses ? addresses.toJS().find((address) => address.preferred) : Immutable.Map()
    }
)

export const getAddresses = createSelector(
    getUser,
    (user) => {
        const addresses = user.get('savedAddresses')
        return addresses
            ? addresses.toJS().filter((address) => !address.preferred)
            : Immutable.List(new Array(5).fill(PLACEHOLDER))
    }
)

export const getWishlist = createGetSelector(getUser, 'wishlist', Immutable.Map())

export const getWishlistTitle = createGetSelector(getWishlist, 'title', WISHLIST_TITLE_DEFAULT)

export const getWishlistID = createGetSelector(getWishlist, 'id', '')

export const getWishlistShareURL = createGetSelector(getWishlist, 'shareURL')

export const getWishlistItems = createGetSelector(getWishlist, 'products', Immutable.List())

export const getWishlistCustomContent = createGetSelector(getWishlist, 'custom', Immutable.Map())

export const getWishlistProducts = createSelector(
    getWishlistItems,
    getProducts,
    (wishlistItems, products) =>
        wishlistItems.map((wishlistItem) => {
            const productData = products.get(wishlistItem.get('productId'))
            if (productData) {
                return productData.mergeDeep(wishlistItem)
            }
            return Immutable.Map()
        })
)

export const getWishlistItemCount = createSelector(
    getWishlistItems,
    (products) => products.size
)
