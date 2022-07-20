/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ActionResponse, ShopperLoginInstance} from '../types'
import {ShopperLoginActions} from './types'

function useShopperLoginAction(
    action: ShopperLoginActions.AuthenticateCustomer
): ActionResponse<ShopperLoginInstance['authenticateCustomer']>
function useShopperLoginAction(
    action: ShopperLoginActions.AuthorizeCustomer
): ActionResponse<ShopperLoginInstance['authorizeCustomer']>
function useShopperLoginAction(
    action: ShopperLoginActions.AuthorizePasswordlessCustomer
): ActionResponse<ShopperLoginInstance['authorizePasswordlessCustomer']>
function useShopperLoginAction(
    action: ShopperLoginActions.GetAccessToken
): ActionResponse<ShopperLoginInstance['getAccessToken']>
function useShopperLoginAction(
    action: ShopperLoginActions.GetPasswordLessAccessToken
): ActionResponse<ShopperLoginInstance['getPasswordLessAccessToken']>
function useShopperLoginAction(
    action: ShopperLoginActions.GetPasswordResetToken
): ActionResponse<ShopperLoginInstance['getPasswordResetToken']>
function useShopperLoginAction(
    action: ShopperLoginActions.GetTrustedSystemAccessToken
): ActionResponse<ShopperLoginInstance['getTrustedSystemAccessToken']>
function useShopperLoginAction(
    action: ShopperLoginActions.IntrospectToken
): ActionResponse<ShopperLoginInstance['introspectToken']>
function useShopperLoginAction(
    action: ShopperLoginActions.LogoutCustomer
): ActionResponse<ShopperLoginInstance['logoutCustomer']>
function useShopperLoginAction(
    action: ShopperLoginActions.ResetPassword
): ActionResponse<ShopperLoginInstance['resetPassword']>
function useShopperLoginAction(
    action: ShopperLoginActions.RevokeToken
): ActionResponse<ShopperLoginInstance['revokeToken']>
function useShopperLoginAction(action: ShopperLoginActions): ActionResponse<() => Promise<any>> {
    // @ts-ignore TODO: how to declare the type for dynamic key name [action]?
    return {
        [action]: () => Promise.resolve(),
        isLoading: true,
        error: undefined
    }
}

export default useShopperLoginAction
