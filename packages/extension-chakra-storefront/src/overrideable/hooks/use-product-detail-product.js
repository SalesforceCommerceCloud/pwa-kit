/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useProduct} from '@salesforce/commerce-sdk-react'

const useProductDetailProduct = ({productId, urlParams}) => {
    return useProduct(
        {
            parameters: {
                id: urlParams.get('pid') || productId,
                perPricebook: true,
                expand: [
                    'availability',
                    'promotions',
                    'options',
                    'images',
                    'prices',
                    'variations',
                    'set_products',
                    'bundled_products'
                ],
                allImages: true
            }
        },
        {
            // When shoppers select a different variant (and the app fetches the new data),
            // the old data is still rendered (and not the skeletons).
            keepPreviousData: true
        }
    )
}

export default useProductDetailProduct
