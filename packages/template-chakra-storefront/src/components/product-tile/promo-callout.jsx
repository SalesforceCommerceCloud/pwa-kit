/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useMemo} from 'react'
import PropTypes from 'prop-types'
import {findLowestPrice} from '../../utils/product-utils'

const PromoCallout = ({product, promotionId}) => {
    const {promotion, data} = useMemo(() => findLowestPrice(product), [product])

    // NOTE: API inconsistency - with getProduct call, a variant does not have productPromotions
    const promos = data?.productPromotions ?? product?.productPromotions ?? []

    const promo = useMemo(() => {
        // If promotionId is provided, find the specific promotion
        if (promotionId) {
            const specificPromo = promos.find((p) => p.promotionId === promotionId)
            return specificPromo || null
        }
        // Otherwise, use the default behavior (lowest price promotion or first promotion)
        return promotion ?? promos[0]
    }, [promotion, promos, promotionId])

    // calloutMsg can be html string or just plain text
    return <div data-testid="promo-callout" dangerouslySetInnerHTML={{__html: promo?.calloutMsg}} />
}

PromoCallout.propTypes = {
    product: PropTypes.object,
    promotionId: PropTypes.string
}

export default PromoCallout
