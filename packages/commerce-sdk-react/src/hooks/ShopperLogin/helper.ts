/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ShopperLoginTypes} from 'commerce-sdk-isomorphic'
import {Argument} from '../types'
import {useMutation} from '../useMutation'
import useAuth from '../useAuth'
import Auth from '../../auth'
import {UseMutationResult} from '@tanstack/react-query'

export const ShopperLoginHelpers = {
    LoginGuestUser: 'loginGuestUser',
    LoginRegisteredUserB2C: 'loginRegisteredUserB2C',
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
 * - logout
 */
export function useShopperLoginHelper<Action extends ShopperLoginHelpersType>(
    action: Action
): UseMutationResult<
    ShopperLoginTypes.TokenResponse,
    Error,
    void | Argument<Auth['loginRegisteredUserB2C']>
> {
    const auth = useAuth()
    if (action === ShopperLoginHelpers.LoginGuestUser) {
        return useMutation(() => auth.loginGuestUser())
    }
    if (action === ShopperLoginHelpers.Logout) {
        return useMutation(() => auth.logout())
    }
    if (action === ShopperLoginHelpers.LoginRegisteredUserB2C) {
        return useMutation((credentials) => {
            if (!credentials) {
                throw new Error('Missing registered user credentials.')
            }
            return auth.loginRegisteredUserB2C(credentials)
        })
    }

    throw new Error('Unknown ShopperLogin helper.')
}
