/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useCustomerId, useShopperBasketsMutation} from '../index'
import {useCustomerBaskets} from '../ShopperCustomers'
import {onClient} from '../../utils'
import {ApiClients, Argument} from '../types'
type Client = ApiClients['shopperBaskets']

export function useShopperBasketsMutationHelper() {
    const customerId = useCustomerId()
    const {data: basketsData} = useCustomerBaskets(
        {parameters: {customerId}},
        {
            enabled: !!customerId && onClient()
        }
    )
    const createBasket = useShopperBasketsMutation('createBasket')
    const addItemToBasketMutation = useShopperBasketsMutation('addItemToBasket')
    return {
        // a function is responsible for managing the process of adding an item to a basket.
        // If a basket already exists, add the item to the basket immediately.
        // If a basket does not exist, create a new basket using the createBasket mutation
        // and then add the item to the newly created basket using the addItemToBasket mutation.
        addItemToNewOrExistingBasket: async (
            body: Argument<Client['addItemToBasket']> extends {body: infer B} ? B : undefined
        ) => {
            if (basketsData && basketsData.total > 0) {
                const currentBasket = basketsData?.baskets?.[0]!
                return await addItemToBasketMutation.mutateAsync({
                    parameters: {basketId: currentBasket.basketId!},
                    body
                })
            } else {
                const data = await createBasket.mutateAsync({
                    body: {}
                })
                const res = await addItemToBasketMutation.mutateAsync({
                    parameters: {basketId: data.basketId!},
                    body
                })
                return res
            }
        }
    }
}
