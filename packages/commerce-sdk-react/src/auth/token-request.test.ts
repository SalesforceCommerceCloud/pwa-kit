/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import nock from 'nock'
import {ResponseError} from 'commerce-sdk-isomorphic'
import Auth from './index'

const host = 'http://localhost:8888'
const config = {
    clientId: 'clientId',
    organizationId: 'organizationId',
    shortCode: 'shortCode',
    siteId: 'siteId',
    redirectURI: `${host}/callback`,
    logger: console
}
const body = {
    grant_type: 'client_credentials' as const,
    code: 'code',
    code_verifier: 'verifier',
    channel_id: 'siteId',
    client_id: 'clientId'
}

describe.each([
    ['standard', {proxy: `${host}/mobify/proxy/api`}, '/mobify/proxy/api'],
    [
        'private HttpOnly',
        {
            proxy: host,
            enablePWAKitPrivateClient: true,
            enableHttpOnlySessionCookies: true,
            privateClientProxyEndpoint: `${host}/mobify/slas/private`
        },
        '/mobify/slas/private'
    ],
    [
        'public HttpOnly',
        {
            proxy: host,
            enableHttpOnlySessionCookies: true,
            publicClientProxyEndpoint: `${host}/mobify/slas/public`
        },
        '/mobify/slas/public'
    ]
] as const)('%s token requests', (_name, options, prefix) => {
    test.each([
        ['getAccessToken', '/oauth2/token'],
        ['getTrustedAgentAccessToken', '/oauth2/trusted-agent/token']
    ] as const)('%s sends the nonce through the real SDK', async (method, endpoint) => {
        const auth = new Auth({...config, ...options})
        const response = {access_token: 'test-token'}
        const scope = nock(host)
            .post(`${prefix}/shopper/auth/v1/organizations/organizationId${endpoint}`)
            .query((query) => {
                expect(query.c_nonce).toEqual(expect.any(String))
                expect(query.c_custom).toBe('keep')
                return true
            })
            .reply(200, response)
        // @ts-expect-error private client
        await expect(auth.client[method]({body, parameters: {c_custom: 'keep'}})).resolves.toEqual(
            response
        )
        expect(scope.isDone()).toBe(true)
    })

    test('preserves raw responses and SDK error response bodies', async () => {
        const auth = new Auth({...config, ...options})
        const path = `${prefix}/shopper/auth/v1/organizations/organizationId/oauth2/token`
        const response = {message: 'invalid refresh_token'}
        const scope = nock(host)
            .post(path)
            .query(true)
            .reply(401, response)
            .post(path)
            .query(true)
            .reply(401, response)
        // @ts-expect-error private client
        const raw = await auth.client.getAccessToken({body}, true)
        expect(raw.status).toBe(401)
        expect(await raw.json()).toEqual(response)
        // @ts-expect-error private client
        const error = await auth.client.getAccessToken({body}).catch((error: unknown) => error)
        expect(error).toBeInstanceOf(ResponseError)
        const responseError = error as ResponseError
        expect(responseError.response.status).toBe(401)
        expect(await responseError.response.json()).toEqual(response)
        expect(scope.isDone()).toBe(true)
    })
})
