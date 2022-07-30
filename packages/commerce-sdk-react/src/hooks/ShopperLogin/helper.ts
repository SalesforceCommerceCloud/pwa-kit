/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {helpers} from 'commerce-sdk-isomorphic'

import {useAsyncCallback} from '../useAsync'
import useCommerceApi from '../useCommerceApi'

export enum ShopperLoginHelpers {
    LoginGuestUser = 'loginGuestUser',
    LoginRegisteredUserB2C = 'loginRegisteredUserB2C',
    Logout = 'logout',
}

/**
 * A hook for performing actions with the Shopper Login API.
 */
export function useShopperLoginHelper<Action extends ShopperLoginHelpers>(action: Action) {
    const {shopperLogin: client} = useCommerceApi()
    switch (action) {
        case ShopperLoginHelpers.LoginGuestUser: {
            const method = helpers.loginGuestUser
            return useAsyncCallback((parameters) => method.call(helpers, client, parameters))
        }
        case ShopperLoginHelpers.LoginRegisteredUserB2C: {
            const method = helpers.loginRegisteredUserB2C
            return useAsyncCallback((credentials, parameters) =>
                method.call(helpers, client, credentials, parameters)
            )
        }
        case ShopperLoginHelpers.Logout: {
            const method = helpers.logout
            return useAsyncCallback((parameters) => method.call(helpers, client, parameters))
        }
        default: {
            throw new Error(
                'Unknown helper. Avaliable options: loginGuestUser, loginRegisteredUserB2C and logout.'
            )
        }
    }

    // type Arg = Parameters<Helpers[Action]>
    // type Data = DataType<Helpers[Action]>
    // // Directly calling `client[action](arg)` doesn't work, because the methods don't fully
    // // overlap. Adding in this type assertion fixes that, but I don't understand why. I'm fairly
    // // confident, though, that it is safe, because it seems like we're mostly re-defining what we
    // // already have.
    // // In addition to the assertion required to get this to work, I have also simplified the
    // // overloaded SDK method to a single signature that just returns the data type. This makes it
    // // easier to work with when passing to other mapped types.
    // function assertMethod(fn: unknown): asserts fn is (arg: Arg) => Promise<Data> {
    //     if (typeof fn !== 'function') throw new Error(`Unknown action: ${action}`)
    // }
    // const {shopperLogin: client} = useCommerceApi()
    // const method = helpers[action]
    // assertMethod(method)

    // return useAsyncCallback((...arg: Arg) => method.call(client, arg))
}
