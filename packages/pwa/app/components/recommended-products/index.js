import React, {useEffect, useState} from 'react'
import PropTypes from 'prop-types'
import ProductScroller from '../../components/product-scroller'
import useEinstein from '../../commerce-api/hooks/useEinstein'

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
        sendClickReco
    } = useEinstein()
    const [_products, setProducts] = useState(products)

    useEffect(() => {
        // Return early if we have no Einstein API instance
        if (!api) {
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
    }, [zone, recommender, _products])

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

    // Check if we have an Einstein API instance before attempting to render anything
    if (!api) {
        return null
    }

    // The component should remove itself altogether if it has no recommendations
    // and we aren't loading any.
    if (!loading && (!recommendations || recommendations.length < 1)) {
        return null
    }

    return (
        <ProductScroller
            title={title || recommendations?.displayMessage}
            products={recommendations.recs}
            onProductClick={(product) =>
                sendClickReco(
                    {
                        recommenderName: recommendations.recommenderName,
                        __recoUUID: recommendations.recoUUID
                    },
                    product
                )
            }
            isLoading={loading}
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
