/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useCustomerBaskets, useCustomerId} from '@salesforce/commerce-sdk-react'

import {isServer} from '@salesforce/retail-react-app/app/utils/utils'

export const selectExpressPaymentBasket = (baskets = []) =>
    baskets.find((candidate) => !candidate.temporaryBasket)

/**
 * Provider-neutral access to the shopper's active, non-temporary basket.
 *
 * Unlike the storefront's useCurrentBasket hook, this helper has no Salesforce
 * Payments state or derived storefront behavior. Providers can use the returned
 * basket when needed; the public iframe context exposes only its id and readiness.
 */
const useExpressPaymentBasket = ({enabled = true} = {}) => {
    const customerId = useCustomerId()
    const shouldResolveBasket = enabled && Boolean(customerId)
    const query = useCustomerBaskets(
        {parameters: {customerId}},
        {enabled: shouldResolveBasket && !isServer}
    )
    const basket = selectExpressPaymentBasket(query.data?.baskets)
    let status = 'empty'

    if (basket) {
        status = 'ready'
    } else if (query.isError) {
        status = 'error'
    } else if (shouldResolveBasket && (isServer || query.isLoading)) {
        status = 'loading'
    }

    return {
        ...query,
        data: basket,
        basketId: basket?.basketId || null,
        status
    }
}

export default useExpressPaymentBasket
