/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useCustomerBaskets} from './ShopperCustomers'
import {useCustomerId} from '.'

function useBasket() {
    const customerId = useCustomerId() || ''
    const baskets = useCustomerBaskets(
        {customerId},
        {enabled: !!customerId}
    )
    return {
        baskets
    }
}

export default useBasket