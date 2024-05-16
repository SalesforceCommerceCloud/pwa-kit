/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {getVariantWithLowestPrice} from '@salesforce/retail-react-app/app/utils/product-utils'

// TODO: support other product types (other than master/variants)
// - variant.productPromotions
// - product.productPromotions
const PromoCallout = ({product}) => {
    const {variants} = product
    const {minPrice, variant} = getVariantWithLowestPrice(variants) ?? {}
    if (!variant?.productPromotions) {
        return
    }

    const promo =
        variant.productPromotions.find((promo) => promo.promotionalPrice === minPrice) ??
        variant.productPromotions[0]
    // calloutMsg can be html string or just plain text
    return promo.calloutMsg && <div dangerouslySetInnerHTML={{__html: promo.calloutMsg}} />
}

PromoCallout.propTypes = {
    product: PropTypes.object
}

export default PromoCallout
