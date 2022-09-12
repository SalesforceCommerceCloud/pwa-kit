/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ShopperLoginTypes} from 'commerce-sdk-isomorphic'
import {ActionResponse, Argument} from '../types'
import {useAsyncCallback} from '../useAsync'
import useAuth from '../useAuth'
import Auth from '../../auth'

export enum ShopperLoginHelpers {
    LoginGuestUser = 'loginGuestUser',
    LoginRegisteredUserB2C = 'loginRegisteredUserB2C',
    Logout = 'logout'
}

/**
 * A hook for Public Client Shopper Login OAuth helpers.
 * The hook calls the SLAS helpers imported from commerce-sdk-isomorphic.
 * For more, see https://github.com/SalesforceCommerceCloud/commerce-sdk-isomorphic/#public-client-shopper-login-helpers
 *
 * Avaliable helpers:
 * - loginRegisteredUserB2C
 * - loginGuestUser
 * - logout
 */
export function useShopperLoginHelper(
    action: ShopperLoginHelpers.LoginRegisteredUserB2C
): ActionResponse<Parameters<Auth['loginRegisteredUserB2C']>, ShopperLoginTypes.TokenResponse>
export function useShopperLoginHelper(
    action: ShopperLoginHelpers.LoginGuestUser
): ActionResponse<[], ShopperLoginTypes.TokenResponse>
export function useShopperLoginHelper(
    action: ShopperLoginHelpers.Logout
): ActionResponse<[], ShopperLoginTypes.TokenResponse>
export function useShopperLoginHelper(
    action: ShopperLoginHelpers
): ActionResponse<Parameters<Auth['loginRegisteredUserB2C']>, ShopperLoginTypes.TokenResponse> {
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
