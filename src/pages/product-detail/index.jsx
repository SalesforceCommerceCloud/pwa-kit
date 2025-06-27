/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'
import {FormattedMessage} from 'react-intl'

// Components
import {Box, Stack} from '@chakra-ui/react'

// Project Components
import RecommendedProducts from '../../components/recommended-products'
import ProductDetails from './partials/product-details'

// constant
import {EINSTEIN_RECOMMENDERS} from '../../constants'
import {useLocation} from 'react-router-dom'
import Metadata from './metadata'
import {useProductDetailData} from './use-product-detail-data'

const ProductDetail = () => {
    const location = useLocation()
    const {
        product,
        isProductLoading,
        primaryCategory,
        isProductASet,
        isProductABundle,
        comboProduct,
        childProductRefs,
        childProductSelection,
        setChildProductSelection,
        childProductOrderability,
        setChildProductOrderability,
        selectedBundleQuantity,
        setSelectedBundleQuantity,
        handleAddToCart,
        handleAddToWishlist,
        handleProductSetAddToCart,
        handleProductBundleAddToCart,
        handleChildProductValidation,
        isBasketLoading,
        isWishlistLoading
    } = useProductDetailData()

    return (
        <Box
            className="sf-product-detail-page"
            layerStyle="page"
            data-testid="product-details-page"
        >
            <Metadata product={product} />

            <Stack gap={16}>
                <ProductDetails
                    product={product}
                    primaryCategory={primaryCategory}
                    isProductASet={isProductASet}
                    isProductABundle={isProductABundle}
                    comboProduct={comboProduct}
                    childProductRefs={childProductRefs}
                    childProductSelection={childProductSelection}
                    setChildProductSelection={setChildProductSelection}
                    childProductOrderability={childProductOrderability}
                    setChildProductOrderability={setChildProductOrderability}
                    selectedBundleQuantity={selectedBundleQuantity}
                    setSelectedBundleQuantity={setSelectedBundleQuantity}
                    // Handlers
                    handleAddToCart={handleAddToCart}
                    handleAddToWishlist={handleAddToWishlist}
                    handleProductSetAddToCart={handleProductSetAddToCart}
                    handleProductBundleAddToCart={handleProductBundleAddToCart}
                    handleChildProductValidation={handleChildProductValidation}
                    // Loading states
                    isProductLoading={isProductLoading}
                    isBasketLoading={isBasketLoading}
                    isWishlistLoading={isWishlistLoading}
                />

                {/* Product Recommendations */}
                <Stack gap={16}>
                    {!isProductASet && (
                        <RecommendedProducts
                            title={
                                <FormattedMessage
                                    defaultMessage="Complete the Set"
                                    id="product_detail.recommended_products.title.complete_set"
                                />
                            }
                            recommender={EINSTEIN_RECOMMENDERS.PDP_COMPLETE_SET}
                            products={[product]}
                            mx={{base: -4, md: -8, lg: 0}}
                            shouldFetch={() => product?.id}
                        />
                    )}
                    <RecommendedProducts
                        title={
                            <FormattedMessage
                                defaultMessage="You might also like"
                                id="product_detail.recommended_products.title.might_also_like"
                            />
                        }
                        recommender={EINSTEIN_RECOMMENDERS.PDP_MIGHT_ALSO_LIKE}
                        products={[product]}
                        mx={{base: -4, md: -8, lg: 0}}
                        shouldFetch={() => product?.id}
                    />

                    <RecommendedProducts
                        // The Recently Viewed recommender doesn't use `products`, so instead we
                        // provide a key to update the recommendations on navigation.
                        key={location.key}
                        title={
                            <FormattedMessage
                                defaultMessage="Recently Viewed"
                                id="product_detail.recommended_products.title.recently_viewed"
                            />
                        }
                        recommender={EINSTEIN_RECOMMENDERS.PDP_RECENTLY_VIEWED}
                        mx={{base: -4, md: -8, lg: 0}}
                    />
                </Stack>
            </Stack>
        </Box>
    )
}

ProductDetail.getTemplateName = () => 'product-detail'

ProductDetail.propTypes = {
    /**
     * The current react router match object. (Provided internally)
     */
    match: PropTypes.object
}

export default ProductDetail