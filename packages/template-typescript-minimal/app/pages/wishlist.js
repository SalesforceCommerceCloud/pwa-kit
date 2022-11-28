/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {getApiUrl, useWishList, useWishlistAction, useWishListItems} from '../hooks/useFetch'
import {getMediaLink} from '../utils/utils'
import {useQueryClient} from '@tanstack/react-query'
import {getConfig} from 'pwa-kit-runtime/utils/ssr-config'
function Wishlist() {
    const {data: wishList} = useWishList()
    const wishListId = wishList?.summaries?.[0].id
    const {data: wishlistItems, isLoading} = useWishListItems(wishListId)
    const wishListAction = useWishlistAction(wishListId)
    const {
        app: {webstoreId}
    } = getConfig()
    const queryClient = useQueryClient()
    if (isLoading) {
        return <div>Loading...</div>
    }
    return (
        <div>
            {wishlistItems.items.map((item) => {
                return (
                    <div key={item.wishlistItemId}>
                        <div style={{display: 'flex'}}>
                            <img
                                style={{width: '100px'}}
                                src={getMediaLink(item.productSummary.thumbnailImage.url)}
                                alt=""
                            />
                            <div>
                                <div>{item.productSummary.name}</div>
                                <div>List Price: {item.listPrice}</div>
                                <div>Sale Price: {item.salesPrice}</div>
                                <div>
                                    {Object.values(item.productSummary?.variationAttributes).map(
                                        (attr) => {
                                            return (
                                                <div>
                                                    {attr.label}: {attr.value}
                                                </div>
                                            )
                                        }
                                    )}
                                </div>
                                <div style={{display: 'flex', gap: '10px'}}>
                                    <button
                                        onClick={() => {
                                            wishListAction.mutate({
                                                url: getApiUrl(
                                                    `/wishlists/${wishListId}/wishlist-items/${item.wishlistItemId}`
                                                ),
                                                fetchOptions: {
                                                    method: 'DELETE'
                                                }
                                            })
                                        }}
                                    >
                                        Remove
                                    </button>
                                    <button
                                        onClick={() => {
                                            wishListAction.mutate(
                                                {
                                                    url: getApiUrl(
                                                        `/wishlists/${wishListId}/actions/add-wishlist-to-cart`
                                                    )
                                                },
                                                {
                                                    onSuccess: () => {
                                                        queryClient.invalidateQueries([
                                                            `/${webstoreId}/carts/current`
                                                        ])
                                                        queryClient.invalidateQueries([
                                                            `/${webstoreId}/carts/current/cart-items`
                                                        ])
                                                    }
                                                }
                                            )
                                        }}
                                    >
                                        Add to Cart
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

export default Wishlist
