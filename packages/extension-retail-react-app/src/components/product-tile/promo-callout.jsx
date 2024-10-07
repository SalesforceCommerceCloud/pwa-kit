/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useMemo} from 'react'
import PropTypes from 'prop-types'
import {findLowestPrice} from '@salesforce/retail-react-app/app/utils/product-utils'

const PromoCallout = ({product}) => {
    const {promotion, data} = useMemo(() => findLowestPrice(product), [product])

    // NOTE: API inconsistency - with getProduct call, a variant does not have productPromotions
    const promos = data?.productPromotions ?? product?.productPromotions ?? []
    const promo = promotion ?? promos[0]

    // calloutMsg can be html string or just plain text
    return <div data-testid="promo-callout" dangerouslySetInnerHTML={{__html: promo?.calloutMsg}} />
}

PromoCallout.propTypes = {
    product: PropTypes.object
}

export default PromoCallout
