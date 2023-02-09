/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// Temp test file to validate that types are working as expected

import {cacheUpdateMatrix} from './config'
import {useShopperBasketsMutation} from './mutation'
import {useBasket} from './query'

const query = useBasket({
    parameters: {
        basketId: 'basketId'
    }
})
const queryData = query.data

const updates = cacheUpdateMatrix.removeItemFromBasket?.(
    'customerId',
    {
        headers: {},
        parameters: {
            shortCode: 'shortCode',
            clientId: 'clientId',
            siteId: 'siteId',
            organizationId: 'organizationId',
            basketId: 'basketId',
            itemId: 'itemId'
        }
    },
    {basketId: 'basketId'}
)
if (updates) {
    const {invalidate} = updates
}

const mutation = useShopperBasketsMutation('addCouponToBasket')
const {data: mutationData, mutate} = mutation
mutate({
    body: {code: 'code'},
    parameters: {basketId: 'basketId'}
})
