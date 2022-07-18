/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import type {ShopperLogin} from 'commerce-sdk-isomorphic'
import {ActionResponse} from '../types'
import {ShopperLoginHelpers} from './types'

// The useShopperLoginHelper hook builds on top of the
// SLAS helpers from commerce-sdk-isomorphic. The actions
// have one to one relationship with the helpers from
// commerce-sdk-isomorphic.
//
// On top of sending the HTTP response, these helpers will be
// responsible for managing tokens.

function useShopperLoginHelper(
    action: ShopperLoginHelpers.LoginGuestUser
): ActionResponse<ShopperLogin<any>['getAccessToken']>
function useShopperLoginHelper(
    action: ShopperLoginHelpers.LoginRegisteredUserB2C
): ActionResponse<ShopperLogin<any>['getAccessToken']>
function useShopperLoginHelper(
    action: ShopperLoginHelpers.RefreshAccessToken
): ActionResponse<ShopperLogin<any>['getAccessToken']>
function useShopperLoginHelper(
    action: ShopperLoginHelpers.Logout
): ActionResponse<ShopperLogin<any>['logoutCustomer']>
function useShopperLoginHelper(action: ShopperLoginHelpers): ActionResponse<() => Promise<any>> {
    // TODO: think about the helper APIs, it doesn't have to follow the action hook signature
    // since it does more than sending request, it also manages tokens
    // @ts-ignore TODO: how to declare the type for dynamic key name [action]?
    return {
        [action]: () => Promise.resolve(),
        isLoading: true,
        error: undefined
    }
}

export default useShopperLoginHelper
