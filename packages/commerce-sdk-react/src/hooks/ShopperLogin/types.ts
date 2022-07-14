/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {QueryParams} from '../types'

export interface UserInfoParams extends QueryParams {
    channel_id?: string
}

export interface UserInfoCreditQualityParams extends QueryParams {
    username: string
}

export enum ShopperLoginActions {
    // phase 1
    GetAccessToken = 'getAccessToken',
    LogoutCustomer = 'logoutCustomer',
    AuthorizeCustomer = 'authorizeCustomer',
    AuthenticateCustomer = 'authenticateCustomer',

    // phase 2
    AuthorizePasswordlessCustomer = 'authorizePasswordlessCustomer',
    GetTrustedSystemAccessToken = 'getTrustedSystemAccessToken',
    GetPasswordResetToken = 'getPasswordResetToken',
    ResetPassword = 'resetPassword',
    GetPasswordLessAccessToken = 'getPasswordLessAccessToken',
    RevokeToken = 'revokeToken',
    IntrospectToken = 'introspectToken',
}

export enum ShopperLoginHelpers {
    // phase 1
    LoginGuestUser = 'loginGuestUser',
    LoginRegisteredUserB2C = 'loginRegisteredUserB2C',
    Logout = 'logout',
    RefreshAccessToken = 'refreshAccessToken',

    // TODO: commerce-sdk-isomorphic doesn't have a register helper?
    // https://github.com/SalesforceCommerceCloud/commerce-sdk-isomorphic/issues/89
    register = 'register',
}
