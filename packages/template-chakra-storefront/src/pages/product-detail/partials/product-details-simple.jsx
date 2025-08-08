/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {Fragment} from 'react'
import PropTypes from 'prop-types'
import ProductView from '../../../components/product-view'
import InformationAccordion from './information-accordion'

const SimpleProductDetails = ({
    product,
    primaryCategory,
    isProductLoading,
    isBasketLoading,
    //@sfdc-extension-line SFDC_EXT_WISHLIST
    isWishlistLoading,
    handleAddToWishlist,
    handleAddToCart
}) => {
    return (
        <Fragment>
            <ProductView
                product={product}
                category={primaryCategory?.parentCategoryTree || []}
                addToCart={(variant, quantity) => handleAddToCart([{product, variant, quantity}])}
                //@sfdc-extension-line SFDC_EXT_WISHLIST
                addToWishlist={handleAddToWishlist}
                isProductLoading={isProductLoading}
                isBasketLoading={isBasketLoading}
                //@sfdc-extension-line SFDC_EXT_WISHLIST
                isWishlistLoading={isWishlistLoading}
            />
            <InformationAccordion product={product} />
        </Fragment>
    )
}

SimpleProductDetails.propTypes = {
    product: PropTypes.object,
    primaryCategory: PropTypes.object,
    isProductLoading: PropTypes.bool,
    isBasketLoading: PropTypes.bool,
    //@sfdc-extension-line SFDC_EXT_WISHLIST
    isWishlistLoading: PropTypes.bool,
    //@sfdc-extension-line SFDC_EXT_WISHLIST
    handleAddToWishlist: PropTypes.func,
    handleAddToCart: PropTypes.func
}

export default SimpleProductDetails
