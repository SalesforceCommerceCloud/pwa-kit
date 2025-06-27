/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import SimpleProductDetails from './product-details-simple'
import CompositeProductDetails from './product-details-composite'

const ProductDetails = (props) => {
    const {isProductASet, isProductABundle} = props

    if (isProductASet || isProductABundle) {
        return <CompositeProductDetails {...props} />
    }

    return <SimpleProductDetails {...props} />
}

ProductDetails.propTypes = {
    product: PropTypes.object,
    primaryCategory: PropTypes.object,
    isProductASet: PropTypes.bool,
    isProductABundle: PropTypes.bool,
    isProductLoading: PropTypes.bool,
    isBasketLoading: PropTypes.bool,
    isWishlistLoading: PropTypes.bool,
    handleAddToWishlist: PropTypes.func,
    handleAddToCart: PropTypes.func,
    handleProductSetAddToCart: PropTypes.func,
    handleProductBundleAddToCart: PropTypes.func,
    handleChildProductValidation: PropTypes.func,
    childProductOrderability: PropTypes.object,
    setSelectedBundleQuantity: PropTypes.func,
    comboProduct: PropTypes.object,
    childProductRefs: PropTypes.object,
    selectedBundleQuantity: PropTypes.number,
    setChildProductSelection: PropTypes.func,
    childProductSelection: PropTypes.object,
    setChildProductOrderability: PropTypes.func
}

export default ProductDetails 