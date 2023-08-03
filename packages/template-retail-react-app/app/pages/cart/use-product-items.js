/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'
import {useProducts} from '@salesforce/commerce-sdk-react'

export const useProductItems = () => {
    const currentBasket = useCurrentBasket()
    const {data: basket} = currentBasket
    const productIds = basket?.productItems?.map(({productId}) => productId).join(',') ?? ''

    const productItems = useProducts(
        {
            parameters: {
                ids: productIds,
                allImages: true
            }
        },
        {
            enabled: Boolean(productIds),
            select: (result) => {
                // Convert array into key/value object with key is the product id
                return result?.data?.reduce((result, item) => {
                    const key = item.id
                    result[key] = item
                    return result
                }, {})
            }
        }
    )

    return {currentBasket, productItems}
}
