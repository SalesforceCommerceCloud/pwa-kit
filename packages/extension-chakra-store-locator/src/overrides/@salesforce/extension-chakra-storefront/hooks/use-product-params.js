/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useContext} from 'react'
import {StoreSelectionContext} from '../../../../components/provider'

export const useProductParamsInPDP = ({productId, urlParams}) => {
    const {selectedStore} = useContext(StoreSelectionContext)
    console.log('JINSU useProductParamsInPDP in chakra-store-locator')
    return {
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
            'bundled_products',
            'page_meta_tags'
        ],
        allImages: true,
        inventoryIds: selectedStore?.inventoryId || []
    }
}
