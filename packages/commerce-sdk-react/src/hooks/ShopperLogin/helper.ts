/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ActionResponse, Argument} from '../types'
import {useAsyncCallback} from '../useAsync'
import useAuth from '../useAuth'
import Auth from '../../auth'
import type {AuthData} from '../../auth'

export enum ShopperLoginHelpers {
    LoginGuestUser = 'loginGuestUser',
    LoginRegisteredUserB2C = 'loginRegisteredUserB2C',
    Logout = 'logout',
}

export function useShopperLoginHelper<Action extends ShopperLoginHelpers.LoginRegisteredUserB2C>(
    action: Action
): ActionResponse<Parameters<Auth['loginRegisteredUserB2C']>, AuthData>
export function useShopperLoginHelper<Action extends ShopperLoginHelpers.LoginGuestUser>(
    action: Action
): ActionResponse<never, AuthData>
export function useShopperLoginHelper<Action extends ShopperLoginHelpers.Logout>(
    action: Action
): ActionResponse<never, AuthData>
export function useShopperLoginHelper<Action extends ShopperLoginHelpers>(
    action: Action
): ActionResponse<any[], AuthData> {
    const auth = useAuth()
    if (action === ShopperLoginHelpers.LoginGuestUser) {
        return useAsyncCallback(() => auth.loginGuestUser())
    }
    if (action === ShopperLoginHelpers.Logout) {
        return useAsyncCallback(() => auth.logout())
    }
    if (action === ShopperLoginHelpers.LoginRegisteredUserB2C) {
        return useAsyncCallback((credentials: Argument<Auth['loginRegisteredUserB2C']>) =>
            auth.loginRegisteredUserB2C(credentials)
        )
    }

    throw new Error('Unknown ShopperLogin helper.')
}
