/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {FormattedMessage} from 'react-intl'
import {Stack} from '@chakra-ui/react'
import RecommendedProducts from '../../../components/recommended-products'
import {EINSTEIN_RECOMMENDERS} from '../../../constants'

/**
 * Cart recommendations component that displays product recommendations
 * @param {Object} basket - The current basket data
 * @returns {JSX.Element} The cart recommendations component
 */
const CartRecommendations = ({basket}) => {
    return (
        <Stack gap={16}>
            <RecommendedProducts
                title={
                    <FormattedMessage
                        defaultMessage="Recently Viewed"
                        id="cart.recommended_products.title.recently_viewed"
                    />
                }
                recommender={EINSTEIN_RECOMMENDERS.CART_RECENTLY_VIEWED}
                mx={{base: -4, sm: -6, lg: 0}}
            />

            <RecommendedProducts
                title={
                    <FormattedMessage
                        defaultMessage="You May Also Like"
                        id="cart.recommended_products.title.may_also_like"
                    />
                }
                recommender={EINSTEIN_RECOMMENDERS.CART_MAY_ALSO_LIKE}
                products={basket?.productItems}
                shouldFetch={() => basket?.basketId && basket.productItems?.length > 0}
                mx={{base: -4, sm: -6, lg: 0}}
            />
        </Stack>
    )
}

export default CartRecommendations 