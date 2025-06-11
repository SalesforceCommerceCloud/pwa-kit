/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'

import {Heading, Skeleton, VStack} from '@salesforce/retail-react-app/app/components/shared/ui'

// project components
import Breadcrumb from '@salesforce/retail-react-app/app/components/breadcrumb'
import DisplayPrice from '@salesforce/retail-react-app/app/components/display-price'
import PromoCallout from '@salesforce/retail-react-app/app/components/product-tile/promo-callout'

const ProductViewHeader = ({
    name,
    currency,
    priceData,
    category,
    product,
    isProductPartOfBundle
}) => {
    return (
        <VStack mr={4} spacing={2} align="flex-start" marginBottom={[4, 4, 4, 0, 0]}>
            {category && (
                <Skeleton isLoaded={category} minWidth={64}>
                    <Breadcrumb categories={category} />
                </Skeleton>
            )}

            {/* Title */}
            <Skeleton isLoaded={name}>
                <Heading fontSize="2xl">{`${name}`}</Heading>
            </Skeleton>

            {!isProductPartOfBundle && (
                <>
                    <Skeleton isLoaded={priceData?.currentPrice}>
                        {priceData?.currentPrice && (
                            <DisplayPrice priceData={priceData} currency={currency} />
                        )}
                    </Skeleton>

                    <Skeleton isLoaded={product}>
                        {product?.productPromotions && <PromoCallout product={product} />}
                    </Skeleton>
                </>
            )}
        </VStack>
    )
}

ProductViewHeader.propTypes = {
    name: PropTypes.string,
    currency: PropTypes.string,
    category: PropTypes.array,
    priceData: PropTypes.object,
    product: PropTypes.object,
    isProductPartOfBundle: PropTypes.bool
}

export default ProductViewHeader
