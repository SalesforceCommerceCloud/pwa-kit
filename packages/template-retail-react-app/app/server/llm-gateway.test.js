/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/** @jest-environment node */
import {
    createGatewayClient,
    buildGatewayUrl
} from '@salesforce/retail-react-app/app/server/llm-gateway'
import {createEcaAuth} from '@salesforce/retail-react-app/app/server/llm-gateway/auth/eca'

const env = {
    LLM_GATEWAY_AUTH_MODE: 'eca',
    LLM_GATEWAY_ECA_TOKEN_URL: 'https://shop.my.salesforce.com/services/oauth2/token',
    LLM_GATEWAY_ECA_CLIENT_ID: 'test-client',
    LLM_GATEWAY_ECA_CLIENT_SECRET: 'test-secret',
    // An old development profile must not bleed into ECA.
    LLM_GATEWAY_URL: 'https://internal.sfdc.cl',
    LLM_GATEWAY_MODEL: 'internal-model',
    LLM_GATEWAY_API_KEY: 'test-key',
    LLM_GATEWAY_SFDC_CORE_TENANT_ID: 'internal-tenant'
}
const jwt = (exp, id = 1) =>
    `header.${Buffer.from(JSON.stringify({exp, id})).toString('base64url')}.signature`
const json = (payload, status = 200) => ({ok: status === 200, status, json: async () => payload})
const sseResponse = (text) => ({
    ok: true,
    status: 200,
    headers: {get: () => 'text/event-stream'},
    body: (async function* () {
        yield Buffer.from(text)
    })()
})
const stream = (text = 'A real match.') =>
    sseResponse(
        `event: generation\ndata: ${JSON.stringify({
            generation_details: {generations: [{content: text}]}
        })}\n\ndata: [DONE]\n\n`
    )
const collect = async (client) => {
    let text = ''
    for await (const delta of client.stream([{role: 'user', content: 'shirt'}])) text += delta
    return text
}
test('one auth-mode switch selects ECA OAuth, Bearer and the public Gateway request shape', async () => {
    const token = jwt(Date.now() / 1000 + 1800)
    const fetchImpl = jest
        .fn()
        .mockResolvedValueOnce(json({access_token: token}))
        .mockResolvedValueOnce(stream())
    expect(await collect(createGatewayClient({env, fetchImpl}))).toBe('A real match.')
    const [tokenUrl, options] = fetchImpl.mock.calls[0]
    expect(tokenUrl.href).toBe(env.LLM_GATEWAY_ECA_TOKEN_URL)
    expect(options.redirect).toBe('error')
    expect(Object.fromEntries(new URLSearchParams(options.body))).toEqual({
        grant_type: 'client_credentials',
        client_id: 'test-client',
        client_secret: 'test-secret'
    })
    const [url, gateway] = fetchImpl.mock.calls[1]
    expect(url.href).toBe('https://api.salesforce.com/ai/gpt/v1/chat/generations/stream')
    expect(gateway.headers.Authorization).toBe(`Bearer ${token}`)
    expect(gateway.headers).not.toHaveProperty('x-sfdc-core-tenant-id')
    expect(JSON.parse(gateway.body)).toMatchObject({
        model: 'sfdc_ai__DefaultGPT4Omni',
        generation_settings: {parameters: {}}
    })
    expect(gateway.body).not.toContain('internal-model')
})
test('API-key remains the default and a 401 never retries this fixed credential', async () => {
    const fetchImpl = jest.fn().mockResolvedValue(json({error: 'denied'}, 401))
    const client = createGatewayClient({env: {...env, LLM_GATEWAY_AUTH_MODE: undefined}, fetchImpl})
    await expect(collect(client)).rejects.toThrow('Gateway request failed')
    expect(fetchImpl).toHaveBeenCalledTimes(1)
    expect(fetchImpl.mock.calls[0][1].headers.Authorization).toBe('API_KEY test-key')
})
test('ECA refreshes a rejected token once before reading the stream', async () => {
    const fetchImpl = jest
        .fn()
        .mockResolvedValueOnce(json({access_token: jwt(Date.now() / 1000 + 1800, 1)}))
        .mockResolvedValueOnce(json({}, 401))
        .mockResolvedValueOnce(json({access_token: jwt(Date.now() / 1000 + 1800, 2)}))
        .mockResolvedValueOnce(stream())
    expect(await collect(createGatewayClient({env, fetchImpl}))).toBe('A real match.')
    expect(fetchImpl).toHaveBeenCalledTimes(4)
    const rejected = jest
        .fn()
        .mockResolvedValueOnce(json({access_token: jwt(Date.now() / 1000 + 1800, 1)}))
        .mockResolvedValueOnce(json({}, 401))
        .mockResolvedValueOnce(json({access_token: jwt(Date.now() / 1000 + 1800, 2)}))
        .mockResolvedValueOnce(json({}, 401))
    await expect(collect(createGatewayClient({env, fetchImpl: rejected}))).rejects.toThrow(
        'Gateway request failed'
    )
    expect(rejected).toHaveBeenCalledTimes(4)
})
test('ECA exchange is single-flight, cached and renewed before expiry; stale invalidations keep the new token', async () => {
    let now = 1000000
    let release
    const fetchImpl = jest.fn().mockImplementationOnce(
        () =>
            new Promise((resolve) => {
                release = resolve
            })
    )
    const auth = createEcaAuth({env, fetchImpl, now: () => now})
    const pending = Promise.all([auth.authorize(), auth.authorize(), auth.authorize()])
    expect(fetchImpl).toHaveBeenCalledTimes(1)
    release(json({access_token: jwt(1100, 1)}))
    const [first] = await pending
    await auth.authorize()
    expect(fetchImpl).toHaveBeenCalledTimes(1)
    now = 1091000
    fetchImpl.mockResolvedValueOnce(json({access_token: jwt(1200, 2)}))
    const second = await auth.authorize()
    first.invalidate()
    expect((await auth.authorize()).headers).toEqual(second.headers)
    expect(fetchImpl).toHaveBeenCalledTimes(2)
})
test('OAuth failures contain no secret or response body and release the in-flight exchange', async () => {
    const fetchImpl = jest
        .fn()
        .mockResolvedValueOnce(json({error: env.LLM_GATEWAY_ECA_CLIENT_SECRET}, 400))
        .mockResolvedValueOnce(json({access_token: jwt(Date.now() / 1000 + 1800)}))
    const auth = createEcaAuth({env, fetchImpl})
    await expect(auth.authorize()).rejects.toThrow('ECA token exchange failed')
    expect((await auth.authorize()).headers.Authorization).toMatch(/^Bearer /)
    expect(fetchImpl).toHaveBeenCalledTimes(2)
})
test.each(['opaque-token', jwt(1), 'header.eyJleHAiOiJudWxsIn0.signature'])(
    'ECA requires a JWT expiry for safe caching (%s)',
    async (access_token) => {
        const auth = createEcaAuth({
            env,
            fetchImpl: jest.fn().mockResolvedValue(json({access_token}))
        })
        await expect(auth.authorize()).rejects.toThrow(
            'ECA must issue an unexpired JWT access token'
        )
    }
)
test.each([
    'http://shop.my.salesforce.com/services/oauth2/token',
    'https://salesforce.com.evil.example/services/oauth2/token',
    'https://shop.my.salesforce.com/other',
    'https://user:secret@shop.my.salesforce.com/services/oauth2/token',
    'https://shop.my.salesforce.com:8443/services/oauth2/token',
    'https://shop.my.salesforce.com/services/oauth2/token?redirect=elsewhere'
])('ECA rejects unsafe token destinations', (url) => {
    expect(() => createEcaAuth({env: {...env, LLM_GATEWAY_ECA_TOKEN_URL: url}})).toThrow(
        'Invalid ECA token endpoint'
    )
})
test('Gateway rejects unknown modes and unsafe ECA origins', () => {
    expect(() => buildGatewayUrl({...env, LLM_GATEWAY_AUTH_MODE: 'other'})).toThrow(
        'LLM_GATEWAY_AUTH_MODE'
    )
    expect(() => buildGatewayUrl({...env, LLM_GATEWAY_ECA_ORIGIN: 'https://evil.example'})).toThrow(
        'Invalid ECA Gateway origin'
    )
})
test('errors after partial output never restart generation or duplicate text', async () => {
    const fetchImpl = jest
        .fn()
        .mockResolvedValueOnce(json({access_token: jwt(Date.now() / 1000 + 1800)}))
        .mockResolvedValueOnce(
            sseResponse(
                'event: generation\ndata: {"generation_details":{"generations":[{"content":"First"}]}}\n\nevent: error\ndata: {}\n\n'
            )
        )
    const client = createGatewayClient({env, fetchImpl})
    const iterator = client.stream([])
    expect((await iterator.next()).value).toBe('First')
    await expect(iterator.next()).rejects.toThrow('Gateway stream failed')
    expect(fetchImpl).toHaveBeenCalledTimes(2)
})
