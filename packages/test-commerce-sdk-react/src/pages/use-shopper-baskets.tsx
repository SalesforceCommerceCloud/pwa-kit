/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {
    useCustomerBaskets,
    useShopperBasketsMutation,
    useCustomerId
} from '@salesforce/commerce-sdk-react'
import {UseBasket} from '../components/use-shopper-baskets/use-basket'
import {UsePaymentMethodsForBasket} from '../components/use-shopper-baskets/use-payment-method-for-basket'

function UseShopperBaskets() {
    const customerId = useCustomerId() || ''
    const baskets = useCustomerBaskets({parameters: {customerId}})
    const createBasket = useShopperBasketsMutation('createBasket')
    const updateBasket = useShopperBasketsMutation('updateBasket')

    const hasBasket = baskets.data?.total !== 0
    const basketId = baskets.data?.baskets ? baskets.data?.baskets[0].basketId : ''

    return (
        <>
            {!hasBasket && (
                <>
                    <h2>You have no basket.</h2>
                    <button onClick={() => createBasket.mutate({body: {}})}>create basket</button>
                </>
            )}
            {basketId && <UseBasket basketId={basketId} />}
            <hr />
            {basketId && <UsePaymentMethodsForBasket basketId={basketId} />}
            <hr />
            {basketId && (
                <>
                    <h2>useShopperBasketsMutation - updateBasket</h2>
                    <button
                        onClick={() => {
                            updateBasket.mutate({parameters: {basketId}, body: {currency: 'USD'}})
                        }}
                    >
                        Change Basket Currency to USD
                    </button>
                    <button
                        onClick={() => {
                            updateBasket.mutate({parameters: {basketId}, body: {currency: 'GBP'}})
                        }}
                    >
                        Change Basket Currency to GBP
                    </button>
                    <hr />
                </>
            )}
        </>
    )
}

UseShopperBaskets.getTemplateName = () => 'UseShopperBaskets'

export default UseShopperBaskets
