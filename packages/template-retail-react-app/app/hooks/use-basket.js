/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useCustomerBaskets, useCustomerId, useProducts} from 'commerce-sdk-react-preview'

/**
 * This hook combine some commerce-react-sdk hooks to provide more derived data for Retail App baskets
 * @param id - basket id to get the current used basket among baskets returned, use first basket in the array if not defined
 * @param shouldFetchProductDetail - boolean to indicate if the baskets should fetch product details based on basket items
 */
export const useBasket = ({id = '', shouldFetchProductDetail = false} = {}) => {
    const customerId = useCustomerId() || ''
    const {
        data: basketsData,
        isLoading: isBasketsLoading,
        error: isBasketsError,
        ...restOfBasketsQuery
    } = useCustomerBaskets({customerId})
    // if id is not defined, by default use the first basket in the list
    const basket =
        basketsData?.baskets?.find((basket) => basket.basketId === id) || basketsData?.baskets?.[0]
    const productIds = basket?.productItems?.map(({productId}) => productId).join(',') ?? ''
    const {data: products, isLoading: isProductsLoading, ...restOfProductQuery} = useProducts(
        {
            ids: productIds,
            allImages: true
        },
        {
            enabled: shouldFetchProductDetail && !!productIds
        }
    )

    return {
        baskets: basketsData,
        isBasketsLoading,
        isBasketsError,
        ...restOfBasketsQuery,
        // current picked basket
        basket,
        isLoading: isBasketsLoading || isProductsLoading,
        isProductsLoading,
        productDetails: products,
        ...restOfProductQuery,
        hasBasket: basketsData?.total > 0,
        totalItems: basket?.productItems?.reduce((acc, item) => acc + item.quantity, 0)
    }
}
