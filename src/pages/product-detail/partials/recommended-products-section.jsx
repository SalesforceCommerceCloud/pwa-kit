/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {FormattedMessage} from 'react-intl'
import {Stack} from '@chakra-ui/react'
import RecommendedProducts from '../../../components/recommended-products'
import {EINSTEIN_RECOMMENDERS} from '../../../constants'
import {useLocation} from 'react-router-dom'

const RecommendedProductsSection = ({product, isProductASet}) => {
    const location = useLocation()

    return (
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
    )
}

RecommendedProductsSection.propTypes = {
    product: PropTypes.object,
    isProductASet: PropTypes.bool
}

export default RecommendedProductsSection 