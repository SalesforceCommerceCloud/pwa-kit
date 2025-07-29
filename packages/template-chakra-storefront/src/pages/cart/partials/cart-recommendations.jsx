/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {useIntl} from 'react-intl'
import {Stack} from '@chakra-ui/react'
import RecommendedProducts from '../../../components/recommended-products'
import {EINSTEIN_RECOMMENDERS} from '../../../../config/constants'

/**
 * Cart recommendations component that displays product recommendations
 * @param {Object} basket - The current basket data
 * @returns {JSX.Element} The cart recommendations component
 */
const CartRecommendations = ({basket}) => {
    const {formatMessage} = useIntl()

    const messages = {
        recentlyViewed: formatMessage({
            id: "cart.recommended_products.title.recently_viewed",
            defaultMessage: "Recently Viewed"
        }),
        mayAlsoLike: formatMessage({
            id: "cart.recommended_products.title.may_also_like",
            defaultMessage: "You May Also Like"
        })
    }

    return (
        <Stack gap={16}>
            <RecommendedProducts
                title={messages.recentlyViewed}
                recommender={EINSTEIN_RECOMMENDERS.CART_RECENTLY_VIEWED}
                mx={{base: -4, sm: -6, lg: 0}}
            />

            <RecommendedProducts
                title={messages.mayAlsoLike}
                recommender={EINSTEIN_RECOMMENDERS.CART_MAY_ALSO_LIKE}
                products={basket?.productItems}
                shouldFetch={() => basket?.basketId && basket.productItems?.length > 0}
                mx={{base: -4, sm: -6, lg: 0}}
            />
        </Stack>
    )
}

CartRecommendations.propTypes = {
    basket: PropTypes.shape({
        basketId: PropTypes.string,
        productItems: PropTypes.arrayOf(
            PropTypes.shape({
                itemId: PropTypes.string,
                productId: PropTypes.string
            })
        )
    })
}

export default CartRecommendations
