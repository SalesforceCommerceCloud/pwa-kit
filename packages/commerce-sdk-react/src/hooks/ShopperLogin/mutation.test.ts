/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {act} from '@testing-library/react'
import {ShopperLoginTypes} from 'commerce-sdk-isomorphic'
import nock from 'nock'
import {
    mockQueryEndpoint,
    mockMutationEndpoints,
    renderHookWithProviders,
    waitAndExpectError,
    waitAndExpectSuccess
} from '../../test-utils'
import {ApiClients, Argument, DataType} from '../types'
import {ShopperLoginMutation, useShopperLoginMutation} from './mutation'
import {CLIENT_KEYS} from '../../constant'

jest.mock('../../auth/index.ts', () => {
    const {default: mockAuth} = jest.requireActual('../../auth/index.ts')
    mockAuth.prototype.ready = jest.fn().mockResolvedValue({access_token: 'access_token'})
    return mockAuth
})

const CLIENT_KEY = CLIENT_KEYS.SHOPPER_LOGIN
type Client = NonNullable<ApiClients[typeof CLIENT_KEY]>

const loginEndpoint = '/shopper/auth/'
// Additional properties are ignored, so we can use this mega-options object for all endpoints
const OPTIONS = {
    parameters: {
        organizationId: 'organizationId',
        client_id: 'client_id',
        refresh_token: 'token',
        // These parameters are required in the query parameters for certain mutations, while in the request body for others.
        redirect_uri: 'redirect_uri',
        response_type: 'response_type',
        code_challenge: 'code_challenge'
    },
    body: {
        agent_id: 'agent_id',
        channel_id: 'channel_id',
        client_id: 'client_id',
        code: 'code',
        code_challenge: 'code_challenge',
        code_verifier: 'code_verifier',
        dwsid: 'dwsid',
        grant_type: 'grant_type',
        hint: 'hint',
        idp_origin: 'idp_origin',
        login_id: 'login_id',
        mode: 'mode',
        new_password: 'new_password',
        pwd_action_token: 'pwd_action_token',
        pwdless_login_token: 'pwdless_login_token',
        redirect_uri: 'redirect_uri',
        token: 'token',
        user_id: 'user_id'
    }
}
const TOKEN_RESPONSE: ShopperLoginTypes.TokenResponse = {
    access_token: 'access_token',
    customer_id: 'customer_id',
    enc_user_id: 'enc_user_id',
    expires_in: 0,
    id_token: 'id_token',
    refresh_token: 'refresh_tone',
    token_type: 'Bearer',
    usid: 'usid',
    idp_access_token: 'idp_access_token',
    refresh_token_expires_in: 30 * 24 * 3600
}

// --- TEST CASES --- //
type Implemented = ShopperLoginMutation
// This is an object rather than an array to more easily ensure we cover all mutations
type TestMap = {[Mut in Implemented]: [Argument<Client[Mut]>, DataType<Client[Mut]>]}
const testMap: TestMap = {
    authorizePasswordlessCustomer: [{parameters: {userid: 'test-user'}} as any, 'success' as any],
    authorizeCustomer: [{parameters: {redirectURI: 'test-uri', hint: 'test-hint'}} as any, undefined],
    getAccessToken: [{parameters: {grant_type: 'authorization_code' as const}, body: {code: 'test-code'}} as any, TOKEN_RESPONSE],
    getPasswordResetToken: [{parameters: {login: 'test-login'}} as any, undefined],
    getPasswordLessAccessToken: [{parameters: {grant_type: 'password' as const}, body: {login_id: 'test-login'}} as any, TOKEN_RESPONSE],
    getSessionBridgeAccessToken: [{parameters: {grant_type: 'password' as const}, body: {login_id: 'test-login'}} as any, TOKEN_RESPONSE],
    getTrustedAgentAccessToken: [{parameters: {grant_type: 'password' as const}, body: {login_id: 'test-login'}} as any, TOKEN_RESPONSE],
    getTrustedSystemAccessToken: [{parameters: {grant_type: 'password' as const}, body: {login_id: 'test-login'}} as any, TOKEN_RESPONSE],
    introspectToken: [{body: {token: 'test-token'}} as any, {token: 'test-token'} as any],
    resetPassword: [{body: {token: 'test-token', new_password: 'new-password'}} as any, undefined],
    revokeToken: [{body: {token: 'test-token'}} as any, {token: 'test-token'} as any],
    logoutCustomer: [{parameters: {refresh_token: 'test-token'}} as any, TOKEN_RESPONSE]
}
// Type assertion is necessary because `