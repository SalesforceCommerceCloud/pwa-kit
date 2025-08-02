/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useMemo} from 'react'
import PropTypes from 'prop-types'
import {useIntl} from 'react-intl'
import {Stack} from '@chakra-ui/react'
import RecommendedProducts from '../../../components/recommended-products'
import {EINSTEIN_RECOMMENDERS} from '../../../../config/constants'
import {useLocation} from 'react-router-dom'

const RecommendedProductsSection = ({product, isProductASet}) => {
    const location = useLocation()
    const {formatMessage} = useIntl()

    const messages = useMemo(
        () => ({
            completeSet: formatMessage({
                id: 'product_detail.recommended_products.title.complete_set',
                defaultMessage: 'Complete the Set'
            }),
            mightAlsoLike: formatMessage({
                id: 'product_detail.recommended_products.title.might_also_like',
                defaultMessage: 'You might also like'
            }),
            recentlyViewed: formatMessage({
                id: 'product_detail.recommended_products.title.recently_viewed',
                defaultMessage: 'Recently Viewed'
            })
        }),
        [formatMessage]
    )

    return (
        <Stack gap={16}>
            {!isProductASet && (
                <RecommendedProducts
                    title={messages.completeSet}
                    recommender={EINSTEIN_RECOMMENDERS.PDP_COMPLETE_SET}
                    products={[product]}
                    mx={{base: -4, md: -8, lg: 0}}
                    shouldFetch={() => product?.id}
                />
            )}
            <RecommendedProducts
                title={messages.mightAlsoLike}
                recommender={EINSTEIN_RECOMMENDERS.PDP_MIGHT_ALSO_LIKE}
                products={[product]}
                mx={{base: -4, md: -8, lg: 0}}
                shouldFetch={() => product?.id}
            />

            <RecommendedProducts
                // The Recently Viewed recommender doesn't use `products`, so instead we
                // provide a key to update the recommendations on navigation.
                key={location.key}
                title={messages.recentlyViewed}
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
