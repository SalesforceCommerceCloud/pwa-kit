/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ShopperLoginTypes} from 'commerce-sdk-isomorphic'
import {ActionResponse} from '../types'
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
// eslint-disable-next-line prettier/prettier
export function useShopperLoginHelper<Action extends `${ShopperLoginHelpers}`>(
    action: Action
): ActionResponse<Parameters<Auth[Action]>, ShopperLoginTypes.TokenResponse> {
    const auth = useAuth()
    if (action === ShopperLoginHelpers.LoginGuestUser) {
        return useAsyncCallback(() => auth.loginGuestUser())
    }
    if (action === ShopperLoginHelpers.Logout) {
        return useAsyncCallback(() => auth.logout())
    }
    if (action === ShopperLoginHelpers.LoginRegisteredUserB2C) {
        return useAsyncCallback((...args) => {
            const credentials = args[0]
            if (!credentials) {
                throw new Error('Missing registered user credentials.')
            }
            return auth.loginRegisteredUserB2C(credentials)
        })
    }

    throw new Error('Unknown ShopperLogin helper.')
}
