/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {helpers} from 'commerce-sdk-isomorphic'

import {ActionResponse, DataType} from '../types'
import {useAsyncCallback} from '../useAsync'
import useCommerceApi from '../useCommerceApi'
import useAuth from '../useAuth'
import type {AuthData} from '../../auth'

type Helpers = typeof helpers

export enum ShopperLoginHelpers {
    LoginGuestUser = 'loginGuestUser',
    LoginRegisteredUserB2C = 'loginRegisteredUserB2C',
    Logout = 'logout',
}

// // The first argument of the isomorphic SLAS helpers
// // is always the ShopperLogin client, we pass the client to helpers internally
// // so users don't need to do that. This makes the interface better.
// // TODO: the login helpers require users to pass in redirectURI and usid
// // 1. for redirectURI, we can move it as a config value for Provider
// // 2. for usid, the library should manage usid internally
// type Tail<T extends any[]> = T extends [infer A, ...infer R] ? R : never

// /**
//  * A hook for performing actions with the Shopper Login API.
//  */
// export function useShopperLoginHelper<Action extends ShopperLoginHelpers>(
//     action: Action
// ): ActionResponse<Tail<Parameters<Helpers[Action]>>, DataType<Helpers[Action]>> {
//     type Arg = Tail<Parameters<Helpers[Action]>>
//     type Data = DataType<Helpers[Action]>
//     // Directly calling `client[action](arg)` doesn't work, because the methods don't fully
//     // overlap. Adding in this type assertion fixes that, but I don't understand why. I'm fairly
//     // confident, though, that it is safe, because it seems like we're mostly re-defining what we
//     // already have.
//     // In addition to the assertion required to get this to work, I have also simplified the
//     // overloaded SDK method to a single signature that just returns the data type. This makes it
//     // easier to work with when passing to other mapped types.
//     function assertMethod(fn: unknown): asserts fn is (arg: Arg) => Promise<Data> {
//         if (typeof fn !== 'function') throw new Error(`Unknown action: ${action}`)
//     }
//     const {shopperLogin: client} = useCommerceApi()
//     const method = helpers[action]
//     assertMethod(method)

//     return useAsyncCallback((...args: Arg) =>
//         // @ts-ignore how to deal with the typescript error
//         // that args potentially have different length?
//         method(client, ...args)
//     )
// }
export function useShopperLoginHelper<Action extends ShopperLoginHelpers>(action: Action) {
    const auth = useAuth()
    if (action === ShopperLoginHelpers.Logout) {
        return useAsyncCallback(() => auth.logout())
    }
    if (action === ShopperLoginHelpers.LoginRegisteredUserB2C) {
        return useAsyncCallback((credentials: Parameters<Helpers['loginRegisteredUserB2C']>[1]) =>
            auth.loginRegisteredUserB2C(credentials)
        )
    }

    throw new Error('Unknown ShopperLogin helper.')
}
// const a = useShopperLoginHelper(ShopperLoginHelpers.LoginRegisteredUserB2C)
// const a = useShopperLoginHelper(ShopperLoginHelpers.Logout)
// a.execute()
// a.execute({username: '1', password: '2'}, {redirectURI: '1'})
