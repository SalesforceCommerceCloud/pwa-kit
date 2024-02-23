/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// a function is responsible for managing the process of adding an item to a basket.
// If a basket already exists, add the item to the basket immediately.
// If a basket does not exist, create a new basket using the createBasket mutation
// and then add the item to the newly created basket using the addItemToBasket mutation.
import {useCustomerBaskets, useCustomerId, useShopperBasketsMutation} from '../index'
import {onClient} from '../../utils'
// export const ShopperBasketsMutationHelpers = {
//     addItemToNewOrExistingBasket: 'addItemToNewOrExistingBasket'
// } as const

// export type ShopperBasketsMutationHelper =
//     (typeof ShopperBasketsMutationHelpers)[keyof typeof ShopperBasketsMutationHelpers]
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
        //@ts-ignore TODO add type here
        addItemToNewOrExistingBasket: async (body) => {
            const currentBasket = basketsData?.baskets?.[0]

            if (currentBasket && currentBasket.total > 0) {
                debugger
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

// export const addItemToNewOrExistingBasket = async () => {
//     const customerId = useCustomerId()
//     const {data: basketsData} = useCustomerBaskets(
//         {parameters: {customerId}},
//         {
//             enabled: !!customerId && onClient()
//         }
//     )
//
//     const createBasket = useShopperBasketsMutation('createBasket')
//     const addItemToBasketMutation = useShopperBasketsMutation('addItemToBasket')
//     if (basketsData && basketsData.total > 0) {
//         return () => addItemToBasketMutation
//     } else {
//         createBasket.mutate(
//             {
//                 body: {}
//             },
//             {
//                 onSuccess: (data) => {
//                     // need to test if this works?
//                     return {mutation: addItemToBasketMutation, basket}
//                 }
//             }
//         )
//     }
// }
