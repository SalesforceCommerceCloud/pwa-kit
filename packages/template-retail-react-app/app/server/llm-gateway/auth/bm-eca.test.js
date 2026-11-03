/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {TextDecoder} from 'util'
import {
    createBmEcaAuth,
    bmBrokerEndpoint
} from '@salesforce/retail-react-app/app/server/llm-gateway/auth/bm-eca'
import {createGatewayClient} from '@salesforce/retail-react-app/app/server/llm-gateway'
const AM_URL = 'https://account.demandware.com/dwsso/oauth2/access_token'
const env = {
    LLM_GATEWAY_AUTH_MODE: 'eca',
    LLM_GATEWAY_BM_TOKEN_URL:
        'https://test-shortcode.api.commercecloud.salesforce.com/merchant/llm-auth/v1/organizations/f_ecom_test_001/access-tokens',
    LLM_GATEWAY_BM_AM_CLIENT_ID: '11111111-2222-4333-8444-555555555555',
    LLM_GATEWAY_BM_AM_CLIENT_SECRET: 'test-am-secret',
    // A populated old development profile must never supply credentials for BM mode.
    LLM_GATEWAY_API_KEY: 'unused-api-key',
    LLM_GATEWAY_URL: 'https://internal.sfdc.cl',
    LLM_GATEWAY_ECA_CLIENT_ID: 'unused-eca-id',
    LLM_GATEWAY_ECA_CLIENT_SECRET: 'unused-eca-secret',
    LLM_GATEWAY_ECA_TENANT_ID: 'unused-tenant'
}
const jwt = (exp = 1300, id = 1, header = {}) =>
    [
        Buffer.from(JSON.stringify({alg: 'RS256', ...header})).toString('base64url'),
        Buffer.from(JSON.stringify({exp: Math.floor(exp), id})).toString('base64url'),
        'signature'
    ].join('.')
const json = (payload, status = 200) => ({ok: status === 200, status, json: async () => payload})
const machineToken = () =>
    json({access_token: 'am-service-token', token_type: 'Bearer', expires_in: 1800})
const brokerToken = (token = jwt(), extra = {}) =>
    json({access_token: token, token_type: 'Bearer', ...extra})
const now = () => 1000000
const create = (fetchImpl, options = {}) => createBmEcaAuth({env, fetchImpl, now, ...options})
const savedDecoder = global.TextDecoder
beforeAll(() => {
    global.TextDecoder = TextDecoder
})
afterAll(() => {
    global.TextDecoder = savedDecoder
})
afterEach(() => {
    jest.useRealTimers()
})

test('eca mode gets a BM-minted JWT using AM machine authentication, without local ECA credentials', async () => {
    const fetchImpl = jest
        .fn()
        .mockResolvedValueOnce(machineToken())
        .mockResolvedValueOnce(brokerToken(jwt(Date.now() / 1000 + 1800)))
        .mockResolvedValueOnce({
            ok: true,
            status: 200,
            headers: {get: () => 'text/event-stream'},
            body: (async function* () {
                yield Buffer.from(
                    'event: generation\ndata: {"generation_details":{"generations":[{"content":"BM-backed overview"}]}}\n\ndata: [DONE]\n\n'
                )
            })()
        })
    const settings = {
        ...env,
        LLM_GATEWAY_ECA_CLIENT_ID: undefined,
        LLM_GATEWAY_ECA_CLIENT_SECRET: undefined
    }
    const client = createGatewayClient({env: settings, fetchImpl})
    let text = ''
    for await (const delta of client.stream([{role: 'user', content: 'shopper query'}]))
        text += delta
    expect(text).toBe('BM-backed overview')
    const [amUrl, amOptions] = fetchImpl.mock.calls[0]
    expect(amUrl).toBe(AM_URL)
    expect(amOptions.headers.Authorization).toBe(
        `Basic ${Buffer.from(
            `${env.LLM_GATEWAY_BM_AM_CLIENT_ID}:${env.LLM_GATEWAY_BM_AM_CLIENT_SECRET}`
        ).toString('base64')}`
    )
    expect(Object.fromEntries(new URLSearchParams(amOptions.body))).toEqual({
        grant_type: 'client_credentials',
        scope: 'SALESFORCE_COMMERCE_API:test_001 sfcc.llm-auth'
    })
    const [url, broker] = fetchImpl.mock.calls[1]
    expect(url.href).toBe(env.LLM_GATEWAY_BM_TOKEN_URL)
    expect(broker).toMatchObject({
        method: 'POST',
        redirect: 'error',
        headers: {Authorization: 'Bearer am-service-token', 'Cache-Control': 'no-store'}
    })
    expect(broker.body).toBeUndefined()
    expect(JSON.stringify(broker)).not.toContain('shopper query')
    expect(JSON.stringify(broker)).not.toContain('unused-eca')
    const [gatewayUrl, request] = fetchImpl.mock.calls[2]
    expect(gatewayUrl.href).toBe('https://api.salesforce.com/ai/gpt/v1/chat/generations/stream')
    expect(request.headers.Authorization).toMatch(/^Bearer /)
    expect(request.headers).not.toHaveProperty('x-sfdc-core-tenant-id')
    expect(JSON.stringify(request)).not.toContain('am-service-token')
    expect(JSON.stringify(request)).not.toContain('test-am-secret')
    expect(JSON.parse(request.body).generation_settings).toEqual({parameters: {}})
})
test('concurrent shoppers share one exchange, token cache and refresh; stale invalidation keeps a newer token', async () => {
    let clock = now()
    let release
    const fetchImpl = jest
        .fn()
        .mockResolvedValueOnce(machineToken())
        .mockImplementationOnce(
            () =>
                new Promise((resolve) => {
                    release = resolve
                })
        )
    const auth = create(fetchImpl, {now: () => clock})
    const pending = Promise.all([auth.authorize(), auth.authorize(), auth.authorize()])
    // Allow the AM exchange to finish before resolving the shared BM request.
    for (let step = 0; step < 30 && !release; step++) await Promise.resolve()
    expect(release).toEqual(expect.any(Function))
    release(brokerToken())
    const leases = await pending
    expect(fetchImpl).toHaveBeenCalledTimes(2)
    expect((await auth.authorize()).headers).toEqual(leases[0].headers)
    clock = 1275000
    fetchImpl.mockResolvedValueOnce(brokerToken(jwt(1600, 2)))
    const fresh = await auth.authorize()
    leases[0].invalidate()
    expect((await auth.authorize()).headers).toEqual(fresh.headers)
    expect(fetchImpl).toHaveBeenCalledTimes(3)
    // Gateway rejection evicts only the leased JWT; the valid AM service token is reused.
    fresh.invalidate()
    fetchImpl.mockResolvedValueOnce(brokerToken(jwt(1700, 3)))
    expect((await auth.authorize()).headers.Authorization).toContain(jwt(1700, 3))
    expect(fetchImpl).toHaveBeenCalledTimes(4)
})
test('expired AM service credentials renew before the next broker exchange', async () => {
    let clock = now()
    const fetchImpl = jest
        .fn()
        .mockResolvedValueOnce(machineToken())
        .mockResolvedValueOnce(brokerToken())
    const auth = create(fetchImpl, {now: () => clock})
    await auth.authorize()
    clock = 3000000
    fetchImpl.mockResolvedValueOnce(machineToken()).mockResolvedValueOnce(brokerToken(jwt(3500)))
    await auth.authorize()
    expect(fetchImpl.mock.calls.filter(([url]) => String(url) === AM_URL)).toHaveLength(2)
})
test('broker 401 refreshes AM authentication once; 403 fails without retry or fallback', async () => {
    const fetchImpl = jest
        .fn()
        .mockResolvedValueOnce(machineToken())
        .mockResolvedValueOnce(json({}, 401))
        .mockResolvedValueOnce(machineToken())
        .mockResolvedValueOnce(brokerToken())
    await create(fetchImpl).authorize()
    expect(fetchImpl).toHaveBeenCalledTimes(4)
    const denied = jest
        .fn()
        .mockResolvedValueOnce(machineToken())
        .mockResolvedValueOnce(json({client_secret: 'do-not-echo'}, 403))
    await expect(create(denied).authorize()).rejects.toMatchObject({
        message: 'BM credential broker request failed',
        status: 403
    })
    expect(denied).toHaveBeenCalledTimes(2)
    const rejected = jest
        .fn()
        .mockResolvedValueOnce(machineToken())
        .mockResolvedValueOnce(json({}, 401))
        .mockResolvedValueOnce(machineToken())
        .mockResolvedValueOnce(json({}, 401))
    await expect(create(rejected).authorize()).rejects.toMatchObject({status: 401})
    expect(rejected).toHaveBeenCalledTimes(4)
})
test('Gateway 401 obtains one fresh BM token before restarting the request, with no local ECA exchange', async () => {
    const token = jwt(Date.now() / 1000 + 1800)
    const fetchImpl = jest
        .fn()
        .mockResolvedValueOnce(machineToken())
        .mockResolvedValueOnce(brokerToken(token))
        .mockResolvedValueOnce(json({}, 401))
        .mockResolvedValueOnce(brokerToken(token))
        .mockResolvedValueOnce(
            json({generation_details: {generations: [{content: 'Refreshed answer'}]}})
        )
    const client = createGatewayClient({env, fetchImpl})
    expect(await client.complete([])).toBe('Refreshed answer')
    expect(fetchImpl).toHaveBeenCalledTimes(5)
    expect(
        fetchImpl.mock.calls.filter(([url]) => String(url) === env.LLM_GATEWAY_BM_TOKEN_URL)
    ).toHaveLength(2)
    expect(fetchImpl.mock.calls.filter(([url]) => String(url) === AM_URL)).toHaveLength(1)
})
test('only broker/token tenancy is used; an inconsistent tenant is rejected', async () => {
    const tenant = 'core/prod/00D000000000001AAA'
    const fetchImpl = jest
        .fn()
        .mockResolvedValueOnce(machineToken())
        .mockResolvedValueOnce(brokerToken(jwt(1300, 1, {tnk: tenant}), {core_tenant_id: tenant}))
    expect((await create(fetchImpl).authorize()).headers['x-sfdc-core-tenant-id']).toBe(tenant)
    const invalid = jest
        .fn()
        .mockResolvedValueOnce(machineToken())
        .mockResolvedValueOnce(
            brokerToken(jwt(1300, 1, {tnk: tenant}), {
                core_tenant_id: 'core/prod/00D000000000002AAA'
            })
        )
    await expect(create(invalid).authorize()).rejects.toThrow('Invalid BM broker token response')
})
test.each([
    'http://test.api.commercecloud.salesforce.com/merchant/llm-auth/v1/organizations/f_ecom_test_001/access-tokens',
    env.LLM_GATEWAY_BM_TOKEN_URL.replace('salesforce.com', 'salesforce.com.evil.example'),
    env.LLM_GATEWAY_BM_TOKEN_URL.replace('/access-tokens', '/access-tokens?redirect=other'),
    env.LLM_GATEWAY_BM_TOKEN_URL + '#fragment',
    env.LLM_GATEWAY_BM_TOKEN_URL.replace('https://', 'https://user:pass@'),
    env.LLM_GATEWAY_BM_TOKEN_URL.replace('.com/', '.com:8443/'),
    'https://test.api.commercecloud.salesforce.com/on/demandware.store/ViewAgentforcePreferences-Show',
    'https://test.api.commercecloud.salesforce.com/anc/access_tokens'
])('rejects unsafe or unrelated broker URLs before any network call', (url) => {
    expect(() => bmBrokerEndpoint(url)).toThrow('Invalid BM token broker configuration')
})
test('BM mode requires its own service identity and never silently falls back to API key or direct ECA', () => {
    expect(() => create(jest.fn(), {env: {...env, LLM_GATEWAY_BM_AM_CLIENT_SECRET: ''}})).toThrow(
        'LLM_GATEWAY_BM_AM_CLIENT_SECRET'
    )
    expect(() => createGatewayClient({env: {...env, LLM_GATEWAY_BM_TOKEN_URL: undefined}})).toThrow(
        'Invalid BM token broker configuration'
    )
})
test.each([
    {access_token: 'opaque-session', token_type: 'Bearer'},
    {access_token: jwt(1), token_type: 'Bearer'},
    {access_token: jwt(), token_type: 'Basic'},
    {access_token: jwt(), token_type: 'Bearer', client_secret: 'never-export-this'},
    {access_token: jwt(), token_type: 'Bearer', core_tenant_id: 'bad\r\nheader'}
])('rejects expired/malformed tokens and credential-shaped broker responses', async (payload) => {
    const fetchImpl = jest
        .fn()
        .mockResolvedValueOnce(machineToken())
        .mockResolvedValueOnce(json(payload))
    await expect(create(fetchImpl).authorize()).rejects.toThrow('Invalid BM broker token response')
})
test('failed exchanges expose no response/transport secrets and release the shared promise', async () => {
    const fetchImpl = jest
        .fn()
        .mockRejectedValueOnce(new Error('raw secret transport detail'))
        .mockResolvedValueOnce(machineToken())
        .mockResolvedValueOnce(brokerToken())
    const auth = create(fetchImpl)
    await expect(auth.authorize()).rejects.toThrow('BM broker service authentication failed')
    expect((await auth.authorize()).headers.Authorization).toMatch(/^Bearer /)
})
test('token acquisition has a deadline, cancels the network request and releases its timer', async () => {
    jest.useFakeTimers()
    const fetchImpl = jest.fn(
        (url, {signal}) =>
            new Promise((resolve, reject) => {
                signal.addEventListener('abort', () =>
                    reject(new Error('transport details must stay private'))
                )
            })
    )
    const pending = create(fetchImpl)
        .authorize()
        .catch((error) => error)
    jest.advanceTimersByTime(10000)
    expect(await pending).toMatchObject({message: 'BM broker service authentication failed'})
    expect(fetchImpl.mock.calls[0][1].signal.aborted).toBe(true)
    expect(jest.getTimerCount()).toBe(0)
})

test('one shopper cancellation does not abort a shared BM exchange needed by another shopper', async () => {
    let release
    const token = jwt(Date.now() / 1000 + 1800)
    const fetchImpl = jest
        .fn()
        .mockResolvedValueOnce(machineToken())
        .mockImplementationOnce(
            () =>
                new Promise((resolve) => {
                    release = resolve
                })
        )
        .mockResolvedValueOnce(
            json({generation_details: {generations: [{content: 'Other shopper answer'}]}})
        )
    const client = createGatewayClient({env, fetchImpl})
    const controller = new AbortController()
    const cancelled = client.complete([], controller.signal).catch((error) => error)
    const other = client.complete([])
    for (let step = 0; step < 30 && !release; step++) await Promise.resolve()
    expect(release).toEqual(expect.any(Function))
    controller.abort()
    release(brokerToken(token))
    expect(await cancelled).toMatchObject({message: 'Gateway request cancelled'})
    expect(await other).toBe('Other shopper answer')
    expect(fetchImpl).toHaveBeenCalledTimes(3)
})
test('invalid machine-token expiry or excessive Gateway token lifetime fails closed', async () => {
    const invalidAm = jest
        .fn()
        .mockResolvedValueOnce(
            json({access_token: 'am-token', token_type: 'Bearer', expires_in: 0})
        )
    await expect(create(invalidAm).authorize()).rejects.toThrow('Invalid BM service token response')
    expect(invalidAm).toHaveBeenCalledTimes(1)
    const invalidJwt = jest
        .fn()
        .mockResolvedValueOnce(machineToken())
        .mockResolvedValueOnce(brokerToken(jwt(1000000)))
    await expect(create(invalidJwt).authorize()).rejects.toThrow('Invalid BM broker token response')
})
