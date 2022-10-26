/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {useCustomerBaskets, useCustomerId} from 'commerce-sdk-react'

// This is a simple hook that combined the logic of useCustomerId and useCustomerBaskets to keep the code DRY
// We can either have this hook later after finishing page integrations or during the integration,
// this does not have to be a blockers to do page by page integration
function useBasket(id) {
    console.log('%c useBasketHook=============================', 'background: red')
    const customerId = useCustomerId() || ''
    const baskets = useCustomerBaskets({customerId}, {enabled: !!customerId})
    // if id is not defined use the first basket in the list
    const basket = baskets?.data?.baskets?.[id || 0]
    // TODO: should we fetch product details here
    return {
        baskets,
        // current picked basket
        basket,
        hasBasket: baskets.data?.total !== 0,
        totalItems: basket?.productItems?.reduce((prev, next) => prev + next.quantity, 0) || 0
    }
}

export {useBasket}
