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

jest.mock('../../auth/index.ts', () => {
    const {default: mockAuth} = jest.requireActual('../../auth/index.ts')
    mockAuth.prototype.ready = jest.fn().mockResolvedValue({access_token: 'access_token'})
    return mockAuth
})

type Client = ApiClients['shopperLogin']
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
    token_type: 'token_type',
    usid: 'usid',
    idp_access_token: 'idp_access_token',
    refresh_token_expires_in: 'refresh_token_expires_in'
}

// --- TEST CASES --- //
type Implemented = ShopperLoginMutation
// This is an object rather than an array to more easily ensure we cover all mutations
type TestMap = {[Mut in Implemented]: [Argument<Client[Mut]>, DataType<Client[Mut]>]}
const testMap: TestMap = {
    authorizePasswordlessCustomer: [OPTIONS, {}],
    authorizeCustomer: [OPTIONS, undefined],
    getAccessToken: [OPTIONS, TOKEN_RESPONSE],
    getPasswordResetToken: [OPTIONS, undefined],
    getPasswordLessAccessToken: [OPTIONS, TOKEN_RESPONSE],
    getSessionBridgeAccessToken: [OPTIONS, TOKEN_RESPONSE],
    getTrustedAgentAccessToken: [OPTIONS, TOKEN_RESPONSE],
    getTrustedSystemAccessToken: [OPTIONS, TOKEN_RESPONSE],
    introspectToken: [OPTIONS, {}],
    resetPassword: [OPTIONS, undefined],
    revokeToken: [OPTIONS, TOKEN_RESPONSE],
    logoutCustomer: [OPTIONS, TOKEN_RESPONSE]
}
// Type assertion is necessary because `Object.entries` is limited
const testCases = Object.entries(testMap) as Array<[Implemented, TestMap[Implemented]]>

describe('ShopperLogin mutations', () => {
    beforeEach(() => nock.cleanAll())
    test.each(testCases)('`%s` returns data on success', async (mutationName, [options, data]) => {
        mockMutationEndpoints(loginEndpoint, data ?? {}) // Fallback for `void` endpoints
        mockQueryEndpoint(loginEndpoint, data ?? {}) // `customerLogout` uses GET

        const {result} = renderHookWithProviders(() => {
            return useShopperLoginMutation(mutationName)
        })
        expect(result.current.data).toBeUndefined()
        act(() => result.current.mutate(options))
        await waitAndExpectSuccess(() => result.current)
        expect(result.current.data).toEqual(data)
    })
    test.each(testCases)('`%s` returns error on error', async (mutationName, [options]) => {
        mockMutationEndpoints(loginEndpoint, {error: true}, 400)
        mockQueryEndpoint(loginEndpoint, {error: true}, 400)

        const {result} = renderHookWithProviders(() => {
            return useShopperLoginMutation(mutationName)
        })
        expect(result.current.error).toBeNull()
        act(() => result.current.mutate(options))
        await waitAndExpectError(() => result.current)
        // Validate that we get a `ResponseError` from commerce-sdk-isomorphic. Ideally, we could do
        // `.toBeInstanceOf(ResponseError)`, but the class isn't exported. :\
        expect(result.current.error).toHaveProperty('response')
    })
})
