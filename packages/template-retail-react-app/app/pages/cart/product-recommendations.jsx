/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import RecommendedProducts from '@salesforce/retail-react-app/app/components/recommended-products'
import {FormattedMessage} from 'react-intl'
import {EINSTEIN_RECOMMENDERS} from '@salesforce/retail-react-app/app/constants'
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'
import {Stack} from '@salesforce/retail-react-app/app/components/shared/ui/index'

const ProductRecommendations = ({...rest}) => {
    const {data: basket} = useCurrentBasket()
    return (
        <Stack spacing={16} {...rest}>
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

export default ProductRecommendations
