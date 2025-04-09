/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useContext} from 'react'
import {useProduct} from '@salesforce/commerce-sdk-react'
import {StoreSelectionContext} from '../../../../../components/provider'

const useProductDetailProduct = ({productId, urlParams}) => {
    const {selectedStore} = useContext(StoreSelectionContext)
    console.log('extension-chakra-store-locator: useProductDetailProduct')
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
                allImages: true,
                inventoryIds: selectedStore?.inventoryId || []
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
