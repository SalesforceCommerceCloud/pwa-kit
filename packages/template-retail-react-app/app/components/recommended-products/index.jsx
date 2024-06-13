/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useEffect, useRef, useState} from 'react'
import PropTypes from 'prop-types'
import {useIntl} from 'react-intl'
import {Button} from '@salesforce/retail-react-app/app/components/shared/ui'
import ProductScroller from '@salesforce/retail-react-app/app/components/product-scroller'
import useEinstein from '@salesforce/retail-react-app/app/hooks/use-einstein'
import {useCurrentCustomer} from '@salesforce/retail-react-app/app/hooks/use-current-customer'
import useIntersectionObserver from '@salesforce/retail-react-app/app/hooks/use-intersection-observer'
import {useWishList} from '@salesforce/retail-react-app/app/hooks/use-wish-list'

import {useToast} from '@salesforce/retail-react-app/app/hooks/use-toast'
import useNavigation from '@salesforce/retail-react-app/app/hooks/use-navigation'
import {
    API_ERROR_MESSAGE,
    TOAST_ACTION_VIEW_WISHLIST,
    TOAST_MESSAGE_ADDED_TO_WISHLIST,
    TOAST_MESSAGE_REMOVED_FROM_WISHLIST
} from '@salesforce/retail-react-app/app/constants'
import {useShopperCustomersMutation} from '@salesforce/commerce-sdk-react'

/**
 * A component for fetching and rendering product recommendations from the Einstein API
 * by a zone or a recommender name.
 */
const RecommendedProducts = ({zone, recommender, products, title, shouldFetch, ...props}) => {
    const {
        isLoading,
        recommendations,
        getZoneRecommendations,
        getRecommendations,
        sendClickReco,
        sendViewReco
    } = useEinstein()
    const {data: customer} = useCurrentCustomer()
    const {customerId} = customer
    const {data: wishlist} = useWishList()

    const createCustomerProductListItem = useShopperCustomersMutation(
        'createCustomerProductListItem'
    )
    const deleteCustomerProductListItem = useShopperCustomersMutation(
        'deleteCustomerProductListItem'
    )
    const toast = useToast()
    const navigate = useNavigation()
    const {formatMessage} = useIntl()

    const ref = useRef()
    const isOnScreen = useIntersectionObserver(ref, {useOnce: true})
    const [_products, setProducts] = useState(products)

    useEffect(() => {
        // Check if the component should fetch results or not. This is useful
        // when you are still waiting on additional data, like `products`.
        if (typeof shouldFetch === 'function' && !shouldFetch()) {
            return
        }

        // Fetch either zone or recommender, but not both. If a zone and recommender
        // name are both provided, `zone` takes precendence.
        if (zone) {
            getZoneRecommendations(zone, _products)
            return
        }
        if (recommender) {
            getRecommendations(recommender, _products)
            return
        }
    }, [zone, recommender, _products])

    useEffect(() => {
        // This is an optimization that eliminates superfluous rerenders/fetching by
        // keeping a copy of the `products` array prop in state for shallow comparison.
        if (!Array.isArray(products)) {
            return
        }
        if (
            products.length !== _products?.length ||
            !products.every((val, index) => val === _products?.[index])
        ) {
            setProducts(products)
        }
    }, [products])

    useEffect(() => {
        if (isOnScreen && recommendations?.recs) {
            sendViewReco(
                {
                    recommenderName: recommendations.recommenderName,
                    __recoUUID: recommendations.recoUUID
                },
                recommendations.recs.map((rec) => ({id: rec.id}))
            )
        }
    }, [isOnScreen, recommendations])

    // The component should remove itself altogether if it has no recommendations
    // and we aren't loading any.
    if (!isLoading && (!recommendations || recommendations.length < 1)) {
        return null
    }

    // TODO: DRY this handler when intl provider is available globally
    const addItemToWishlist = async (product) => {
        try {
            if (!wishlist || !customerId) {
                return
            }
            await createCustomerProductListItem.mutateAsync({
                parameters: {
                    listId: wishlist.id,
                    customerId
                },
                body: {
                    quantity: 1,
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
            toast({
                title: formatMessage(API_ERROR_MESSAGE),
                status: 'error'
            })
        }
    }

    const removeItemFromWishlist = async (product) => {
        try {
            const wishlistItem = wishlist?.customerProductListItems?.find(
                (item) => item.productId === product.productId
            )
            if (!wishlistItem || !wishlist || !customerId) {
                return
            }
            await deleteCustomerProductListItem.mutateAsync({
                parameters: {
                    customerId,
                    itemId: wishlistItem.id,
                    listId: wishlist.id
                }
            })
            toast({
                title: formatMessage(TOAST_MESSAGE_REMOVED_FROM_WISHLIST),
                status: 'success',
                id: product.productId
            })
        } catch {
            toast({
                title: formatMessage(API_ERROR_MESSAGE),
                status: 'error'
            })
        }
    }

    return (
        <ProductScroller
            ref={ref}
            title={title || recommendations?.displayMessage}
            products={recommendations.recs}
            isLoading={isLoading}
            productTileProps={(product) => ({
                onClick: () => {
                    sendClickReco(
                        {
                            recommenderName: recommendations.recommenderName,
                            __recoUUID: recommendations.recoUUID
                        },
                        product
                    )
                },
                enableFavourite: true,
                isFavourite: wishlist?.customerProductListItems?.some(
                    (item) => item.productId === product?.productId
                ),
                onFavouriteToggle: (isFavourite) => {
                    const action = isFavourite ? removeItemFromWishlist : addItemToWishlist
                    return action(product)
                }
            })}
            {...props}
        />
    )
}

RecommendedProducts.propTypes = {
    /* The title to appear above the product scroller */
    title: PropTypes.any,

    /* The zone to request */
    zone: PropTypes.string,

    /* The recommender to request */
    recommender: PropTypes.string,

    /* The products to use for recommendation context */
    products: PropTypes.arrayOf(PropTypes.object),

    /* Callback to determine if the component should fetch results */
    shouldFetch: PropTypes.func
}

export default RecommendedProducts
