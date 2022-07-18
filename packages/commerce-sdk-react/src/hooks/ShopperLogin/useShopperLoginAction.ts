/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import type {ShopperLogin} from 'commerce-sdk-isomorphic'
import {ActionResponse} from '../types'
import {ShopperLoginActions} from './types'

function useShopperLoginAction(
    action: ShopperLoginActions.AuthenticateCustomer
): ActionResponse<ShopperLogin<any>['authenticateCustomer']>
function useShopperLoginAction(
    action: ShopperLoginActions.AuthorizeCustomer
): ActionResponse<ShopperLogin<any>['authorizeCustomer']>
function useShopperLoginAction(
    action: ShopperLoginActions.AuthorizePasswordlessCustomer
): ActionResponse<ShopperLogin<any>['authorizePasswordlessCustomer']>
function useShopperLoginAction(
    action: ShopperLoginActions.GetAccessToken
): ActionResponse<ShopperLogin<any>['getAccessToken']>
function useShopperLoginAction(
    action: ShopperLoginActions.GetPasswordLessAccessToken
): ActionResponse<ShopperLogin<any>['getPasswordLessAccessToken']>
function useShopperLoginAction(
    action: ShopperLoginActions.GetPasswordResetToken
): ActionResponse<ShopperLogin<any>['getPasswordResetToken']>
function useShopperLoginAction(
    action: ShopperLoginActions.GetTrustedSystemAccessToken
): ActionResponse<ShopperLogin<any>['getTrustedSystemAccessToken']>
function useShopperLoginAction(
    action: ShopperLoginActions.IntrospectToken
): ActionResponse<ShopperLogin<any>['introspectToken']>
function useShopperLoginAction(
    action: ShopperLoginActions.LogoutCustomer
): ActionResponse<ShopperLogin<any>['logoutCustomer']>
function useShopperLoginAction(
    action: ShopperLoginActions.ResetPassword
): ActionResponse<ShopperLogin<any>['resetPassword']>
function useShopperLoginAction(
    action: ShopperLoginActions.RevokeToken
): ActionResponse<ShopperLogin<any>['revokeToken']>
function useShopperLoginAction(action: ShopperLoginActions): ActionResponse<() => Promise<any>> {
    // @ts-ignore TODO: how to declare the type for dynamic key name [action]?
    return {
        [action]: () => Promise.resolve(),
        isLoading: true,
        error: undefined
    }
}

export default useShopperLoginAction
