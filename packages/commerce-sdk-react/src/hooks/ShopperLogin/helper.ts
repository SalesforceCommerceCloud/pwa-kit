/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useMutation} from '../useMutation'
import useAuth from '../useAuth'
import {UseMutationResult} from '@tanstack/react-query'

export const ShopperLoginHelpers = {
    LoginGuestUser: 'loginGuestUser',
    LoginRegisteredUserB2C: 'loginRegisteredUserB2C',
    Register: 'register',
    Logout: 'logout'
} as const

type ShopperLoginHelpersType = (typeof ShopperLoginHelpers)[keyof typeof ShopperLoginHelpers]

/**
 * A hook for Public Client Shopper Login OAuth helpers.
 * The hook calls the SLAS helpers imported from commerce-sdk-isomorphic.
 * For more, see https://github.com/SalesforceCommerceCloud/commerce-sdk-isomorphic/#public-client-shopper-login-helpers
 *
 * Avaliable helpers:
 * - loginRegisteredUserB2C
 * - loginGuestUser
 * - register
 * - logout
 */
export function useShopperLoginHelper<Action extends ShopperLoginHelpersType>(
    action: Action
): UseMutationResult<
    // TODO: what's the better way for declaring the types?
    any,
    Error,
    any
> {
    const auth = useAuth()
    if (action === ShopperLoginHelpers.LoginGuestUser) {
        return useMutation(() => auth.loginGuestUser())
    }
    if (action === ShopperLoginHelpers.Logout) {
        return useMutation(() => auth.logout())
    }
    if (action === ShopperLoginHelpers.Register) {
        return useMutation((body) => auth.register(body))
    }
    if (action === ShopperLoginHelpers.LoginRegisteredUserB2C) {
        return useMutation((credentials) => auth.loginRegisteredUserB2C(credentials))
    }

    throw new Error('Unknown ShopperLogin helper.')
}
