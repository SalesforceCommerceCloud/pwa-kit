/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {Box, Stack} from '@chakra-ui/react'
import ProductDetails from './partials/product-details'
import RecommendedProductsSection from './partials/recommended-products-section'
import Metadata from './metadata'
import {useProductDetailData} from './use-product-detail-data'

const ProductDetail = () => {
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

                <RecommendedProductsSection product={product} isProductASet={isProductASet} />
            </Stack>
        </Box>
    )
}

ProductDetail.getTemplateName = () => 'product-detail'

export default ProductDetail
