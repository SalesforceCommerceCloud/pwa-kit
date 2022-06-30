/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useEffect, useRef, useState} from 'react'
import PropTypes from 'prop-types'
import {useIntl} from 'react-intl'
import {Button} from '@chakra-ui/react'
import ProductScroller from '../../components/product-scroller'
import useCustomer from '../../commerce-api/hooks/useCustomer'
import useEinstein from '../../commerce-api/hooks/useEinstein'
import useIntersectionObserver from '../../hooks/use-intersection-observer'
import useWishlist from '../../hooks/use-wishlist'
import {useToast} from '../../hooks/use-toast'
import useNavigation from '../../hooks/use-navigation'
import {
    API_ERROR_MESSAGE,
    TOAST_ACTION_VIEW_WISHLIST,
    TOAST_MESSAGE_ADDED_TO_WISHLIST,
    TOAST_MESSAGE_REMOVED_FROM_WISHLIST
} from '../../constants'

/**
 * A component for fetching and rendering product recommendations from the Einstein API
 * by a zone or a recommender name.
 */
const RecommendedProducts = ({zone, recommender, products, title, shouldFetch, ...props}) => {
    const {
        api,
        loading,
        recommendations,
        getZoneRecommendations,
        getRecommendations,
        sendClickReco,
        sendViewReco
    } = useEinstein()
    const {isInitialized} = useCustomer()
    const wishlist = useWishlist()
    const toast = useToast()
    const navigate = useNavigation()
    const {formatMessage} = useIntl()

    const ref = useRef()
    const isOnScreen = useIntersectionObserver(ref, {useOnce: true})
    const [_products, setProducts] = useState(products)

    useEffect(() => {
        // Return early if we have no Einstein API instance
        if (!api || !isInitialized) {
            return
        }

        // Create the expected args object for products when given
        const args = {products: _products?.map((id) => ({id}))}

        // Check if the component should fetch results or not. This is useful
        // when you are still waiting on additional data, like `products`.
        if (typeof shouldFetch === 'function' && !shouldFetch()) {
            return
        }

        // Fetch either zone or recommender, but not both. If a zone and recommender
        // name are both provided, `zone` takes precendence.
        if (zone) {
            getZoneRecommendations(zone, args)
            return
        }
        if (recommender) {
            getRecommendations(recommender, args)
            return
        }
    }, [zone, recommender, _products, isInitialized])

    useEffect(() => {
        // Return early if we have no Einstein API instance
        if (!api) {
            return
        }

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

    // Check if we have an Einstein API instance before attempting to render anything
    if (!api) {
        return null
    }

    // The component should remove itself altogether if it has no recommendations
    // and we aren't loading any.
    if (!loading && (!recommendations || recommendations.length < 1)) {
        return null
    }

    // TODO: DRY this handler when intl provider is available globally
    const addItemToWishlist = async (product) => {
        try {
            await wishlist.createListItem({
                id: product.productId,
                quantity: 1
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

    // TODO: DRY this handler when intl provider is available globally
    const removeItemFromWishlist = async (product) => {
        try {
            await wishlist.removeListItemByProductId(product.productId)
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
            isLoading={loading}
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
                isFavourite: !!wishlist.findItemByProductId(product?.productId),
                onFavouriteToggle: (isFavourite) => {
                    const action = isFavourite ? addItemToWishlist : removeItemFromWishlist
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

    /* The product IDs to use for recommendation context */
    products: PropTypes.arrayOf(PropTypes.string),

    /* Callback to determine if the component should fetch results */
    shouldFetch: PropTypes.func
}

export default RecommendedProducts
