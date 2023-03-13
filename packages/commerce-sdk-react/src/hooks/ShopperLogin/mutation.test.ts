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
    mockMutationEndpoints,
    renderHookWithProviders,
    waitAndExpectError,
    waitAndExpectSuccess
} from '../../test-utils'
import {ApiClients, Argument, DataType} from '../types'
import {NotImplementedError} from '../utils'
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
    usid: 'usid'
}

// --- TEST CASES --- //
type Implemented = Exclude<ShopperLoginMutation, 'logoutCustomer'>
// This is an object rather than an array to more easily ensure we cover all mutations
type TestMap = {[Mut in Implemented]: [Argument<Client[Mut]>, DataType<Client[Mut]>]}
const testMap: TestMap = {
    authorizePasswordlessCustomer: [OPTIONS, {}],
    getAccessToken: [OPTIONS, TOKEN_RESPONSE],
    getPasswordLessAccessToken: [OPTIONS, TOKEN_RESPONSE],
    getSessionBridgeAccessToken: [OPTIONS, TOKEN_RESPONSE],
    getTrustedAgentAccessToken: [OPTIONS, TOKEN_RESPONSE],
    getTrustedSystemAccessToken: [OPTIONS, TOKEN_RESPONSE],
    introspectToken: [OPTIONS, {}],
    resetPassword: [OPTIONS, undefined],
    revokeToken: [OPTIONS, TOKEN_RESPONSE]
}
// Type assertion is necessary because `Object.entries` is limited
const testCases = Object.entries(testMap) as Array<[Implemented, TestMap[Implemented]]>

// Not implemented checks are temporary to make sure we don't forget to add tests when adding
// implentations. When all mutations are added, the "not implemented" tests can be removed,
// and the `TestMap` type can be changed from optional keys to required keys. Doing so will
// leverage TypeScript to enforce having tests for all mutations.
const notImplTestCases = ['logoutCustomer'] as const

describe('ShopperLogin mutations', () => {
    beforeEach(() => nock.cleanAll())
    test.each(testCases)('`%s` returns data on success', async (mutationName, [options, data]) => {
        mockMutationEndpoints(loginEndpoint, data ?? {}) // Fallback for `void` endpoints
        const {result, waitForValueToChange: wait} = renderHookWithProviders(() => {
            return useShopperLoginMutation(mutationName)
        })
        expect(result.current.data).toBeUndefined()
        act(() => result.current.mutate(options))
        await waitAndExpectSuccess(wait, () => result.current)
        expect(result.current.data).toEqual(data)
    })
    test.each(testCases)('`%s` returns error on error', async (mutationName, [options]) => {
        mockMutationEndpoints(loginEndpoint, {error: true}, 400)
        const {result, waitForValueToChange: wait} = renderHookWithProviders(() => {
            return useShopperLoginMutation(mutationName)
        })
        expect(result.current.error).toBeNull()
        act(() => result.current.mutate(options))
        await waitAndExpectError(wait, () => result.current)
        // Validate that we get a `ResponseError` from commerce-sdk-isomorphic. Ideally, we could do
        // `.toBeInstanceOf(ResponseError)`, but the class isn't exported. :\
        expect(result.current.error).toHaveProperty('response')
    })
    test.each(notImplTestCases)('`%s` is not yet implemented', (mutationName) => {
        expect(() => useShopperLoginMutation(mutationName)).toThrow(NotImplementedError)
    })
})
