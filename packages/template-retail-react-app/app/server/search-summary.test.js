/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {EventEmitter} from 'events'
import {TextDecoder} from 'util'
import {
    buildGatewayUrl,
    buildGrounding,
    buildSearchUrl,
    createSearchSummaryHandler,
    readGatewayEvents,
    registerSearchSummaryRoute
} from '@salesforce/retail-react-app/app/server/search-summary'

const config = {
    app: {
        searchSummary: {enabled: true, agentHandoff: true},
        commerceAPI: {parameters: {organizationId: 'f_ecom_test'}},
        sites: [
            {
                id: 'RefArchGlobal',
                l10n: {supportedLocales: [{id: 'en-GB'}], supportedCurrencies: ['GBP']}
            }
        ]
    },
    ssrParameters: {proxyConfigs: [{path: 'api', host: 'test.api.commercecloud.salesforce.com'}]}
}
const parameters = {
    q: 'shirt',
    siteId: 'RefArchGlobal',
    locale: 'en-GB',
    currency: 'GBP',
    refine: ['color=white', 'price=(10..100)'],
    expand: ['prices', 'images']
}
const products = {
    total: 1,
    currency: 'GBP',
    hits: [{productId: 'shirt-1', productName: 'White shirt', price: 20}]
}
const env = {
    LLM_GATEWAY_URL: 'https://test-gateway.sfproxy.example.sfdc.cl',
    LLM_GATEWAY_API_KEY: 'test-api-key',
    LLM_GATEWAY_SFDC_CORE_TENANT_ID: 'test-tenant',
    LLM_GATEWAY_MODEL: 'test-model',
    LLM_GATEWAY_CLIENT_FEATURE: 'test-feature',
    LLM_GATEWAY_APP_CONTEXT: 'EinsteinGPT'
}
const response = (value, status = 200) => ({ok: status === 200, status, json: async () => value})
const body = async function* (text) {
    yield Buffer.from(text)
}
const delta =
    'event: generation\ndata: {"generation_details":{"generations":[{"content":"White shirt."}]}}\n\n'
const gateway = (text = delta + 'data: [DONE]\n\n') => ({
    ok: true,
    status: 200,
    headers: {get: () => 'text/event-stream'},
    body: body(text)
})
const request = () =>
    Object.assign(new EventEmitter(), {
        body: {parameters},
        headers: {authorization: 'Bearer shopper-token'}
    })
const result = () => {
    const res = new EventEmitter()
    return Object.assign(res, {
        frames: [],
        statusCode: 200,
        destroyed: false,
        writableEnded: false,
        set: jest.fn(),
        flushHeaders() {
            this.headersSent = true
        },
        status(code) {
            this.statusCode = code
            return this
        },
        json(value) {
            this.value = value
            return this
        },
        write(text) {
            this.frames.push(text)
            return true
        },
        end() {
            this.writableEnded = true
        }
    })
}
const originalDecoder = global.TextDecoder
beforeAll(() => {
    global.TextDecoder = TextDecoder
})
afterAll(() => {
    global.TextDecoder = originalDecoder
})

test('SCAPI destination is fixed, repeated refinements and currency are preserved', () => {
    const url = buildSearchUrl(config, parameters)
    expect(url.host).toBe('test.api.commercecloud.salesforce.com')
    expect(url.searchParams.getAll('refine')).toEqual(parameters.refine)
    expect(url.searchParams.get('expand')).toBe('prices,images')
    expect(url.searchParams.get('currency')).toBe('GBP')
    expect(() => buildSearchUrl(config, {...parameters, url: 'https://evil.example'})).toThrow()
    expect(() => buildSearchUrl(config, {...parameters, siteId: 'another-store'})).toThrow()
})

test('grounding contains only a bounded subset of returned products', () => {
    const grounding = buildGrounding('shirt', {
        ...products,
        hits: Array.from({length: 25}, (_, i) => ({
            productId: String(i),
            productName: 'Shirt',
            price: 10,
            privateField: 'omit'
        }))
    })
    expect(grounding.products).toHaveLength(3)
    expect(grounding.scope).toContain('not the full result set')
    expect(grounding.products[0]).not.toHaveProperty('privateField')
})

test('Gateway uses the configured internal HTTPS URL and rejects unsafe destinations', () => {
    expect(buildGatewayUrl(env).href).toBe(
        'https://test-gateway.sfproxy.example.sfdc.cl/v1.0/chat/generations/stream'
    )
    expect(buildGatewayUrl({...env, LLM_GATEWAY_API_VERSION: 'v2.0'}).pathname).toBe(
        '/v2.0/chat/generations/stream'
    )
    for (const url of [
        'http://test-gateway.sfproxy.example.sfdc.cl',
        'https://sfdc.cl.evil.example',
        'https://evil.example',
        'https://user:pass@test-gateway.sfdc.cl',
        'https://test-gateway.sfdc.cl?redirect=elsewhere'
    ]) {
        expect(() => buildGatewayUrl({...env, LLM_GATEWAY_URL: url})).toThrow()
    }
    expect(() => buildGatewayUrl({...env, LLM_GATEWAY_API_VERSION: '../other'})).toThrow()
})

test('products flush before the API-key Gateway call and scoring text is not duplicated', async () => {
    const res = result()
    const fetchImpl = jest
        .fn()
        .mockResolvedValueOnce(response(products))
        .mockImplementationOnce(async () => {
            expect(res.frames.join('')).toContain('event: products')
            return gateway(
                delta +
                    'event: scores\ndata: {"generation_details":{"generations":[{"content":"duplicated"}]}}\n\ndata: [DONE]\n\n'
            )
        })
    await createSearchSummaryHandler({config, env, fetchImpl})(request(), res)
    expect(fetchImpl).toHaveBeenCalledTimes(2)
    const [url, options] = fetchImpl.mock.calls[1]
    expect(url.href).toBe(
        'https://test-gateway.sfproxy.example.sfdc.cl/v1.0/chat/generations/stream'
    )
    expect(options.redirect).toBe('error')
    expect(options.headers).toEqual({
        Authorization: 'API_KEY test-api-key',
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        'x-sfdc-core-tenant-id': 'test-tenant',
        'x-client-feature-id': 'test-feature',
        'x-sfdc-app-context': 'EinsteinGPT'
    })
    expect(JSON.parse(options.body)).toMatchObject({
        model: 'test-model',
        generation_settings: {num_generations: 1, max_tokens: 384},
        system_prompt_strategy: 'use_model_parameter'
    })
    expect(res.frames.join('')).toContain('event: content_delta')
    expect(res.frames.join('')).not.toContain('duplicated')
    expect(res.frames.join('')).not.toContain(env.LLM_GATEWAY_API_KEY)
    expect(res.frames.join('')).toContain('event: completed')
    expect(res.writableEnded).toBe(true)
})

test('grounding uses the same promotional price calculation as product tiles', () => {
    const grounding = buildGrounding('shirt', {
        currency: 'GBP',
        hits: [
            {
                productName: 'Modern Dress Shirt',
                hitType: 'master',
                price: 86.4,
                variants: [
                    {price: 86.4, productPromotions: [{promotionalPrice: 81.4}]},
                    {price: 86.4}
                ]
            }
        ]
    })
    expect(grounding.products[0].price).toBe('from 81.4')
    expect(grounding.currency).toBe('GBP')
})

test('request currency grounds the overview when SCAPI omits result currency', async () => {
    const res = result()
    const fetchImpl = jest
        .fn()
        .mockResolvedValueOnce(response({...products, currency: undefined}))
        .mockResolvedValueOnce(gateway())
    await createSearchSummaryHandler({config, env, fetchImpl})(request(), res)
    const prompt = JSON.parse(fetchImpl.mock.calls[1][1].body)
    expect(JSON.parse(prompt.messages[1].content).currency).toBe('GBP')
})

test('Gateway failure emits a summary error after preserving products', async () => {
    const res = result()
    const fetchImpl = jest
        .fn()
        .mockResolvedValueOnce(response(products))
        .mockResolvedValueOnce(response({}, 503))
    await createSearchSummaryHandler({config, env, fetchImpl})(request(), res)
    const frames = res.frames.join('')
    expect(frames).toContain('event: products')
    expect(frames).toContain('event: error')
    expect(frames).not.toContain('event: completed')
    expect(frames).not.toContain(env.LLM_GATEWAY_API_KEY)
})

test('Gateway quota exhaustion is identified without losing products', async () => {
    const res = result()
    const fetchImpl = jest
        .fn()
        .mockResolvedValueOnce(response(products))
        .mockResolvedValueOnce(response({}, 429))
    await createSearchSummaryHandler({config, env, fetchImpl})(request(), res)
    expect(res.frames.join('')).toContain('event: products')
    expect(res.frames.join('')).toContain('"code":"rate_limited"')
    expect(res.frames.join('')).not.toContain('event: completed')
})

test('zero results finish without a model call', async () => {
    const fetchImpl = jest.fn().mockResolvedValueOnce(response({total: 0, hits: []}))
    const res = result()
    await createSearchSummaryHandler({config, env, fetchImpl})(request(), res)
    expect(fetchImpl).toHaveBeenCalledTimes(1)
    expect(res.frames.join('')).toContain('event: completed')
})

test('SCAPI rejects an invalid shopper before any model call', async () => {
    const fetchImpl = jest.fn().mockResolvedValueOnce(response({}, 401))
    const res = result()
    await createSearchSummaryHandler({config, env, fetchImpl})(request(), res)
    expect(res.statusCode).toBe(401)
    expect(fetchImpl).toHaveBeenCalledTimes(1)
    expect(res.frames).toEqual([])
})

test('unexpected upstream EOF cannot be reported as successful completion', async () => {
    const res = result()
    const fetchImpl = jest
        .fn()
        .mockResolvedValueOnce(response(products))
        .mockResolvedValueOnce(gateway(delta))
    await createSearchSummaryHandler({config, env, fetchImpl})(request(), res)
    expect(res.frames.join('')).toContain('event: content_delta')
    expect(res.frames.join('')).toContain('event: error')
    expect(res.frames.join('')).not.toContain('event: completed')
})

test('Gateway parser preserves split UTF-8 and Unicode line separators', async () => {
    const bytes = Buffer.from(
        'event: generation\r\ndata: {"text":"Café\u2028shirt"}\r\n\r\ndata: [DONE]\r\n\r\n'
    )
    async function* chunks() {
        for (const byte of bytes) yield Buffer.from([byte])
    }
    const events = []
    for await (const event of readGatewayEvents(chunks())) events.push(event)
    expect(JSON.parse(events[0].data).text).toBe('Café\u2028shirt')
    expect(events[1]).toEqual({event: '', data: '[DONE]'})
})

test('invalid API keys are not retried and cannot remove the product results', async () => {
    const res = result()
    const fetchImpl = jest
        .fn()
        .mockResolvedValueOnce(response(products))
        .mockResolvedValueOnce(response({message: env.LLM_GATEWAY_API_KEY}, 401))
    await createSearchSummaryHandler({config, env, fetchImpl})(request(), res)
    expect(fetchImpl).toHaveBeenCalledTimes(2)
    expect(res.frames.join('')).toContain('event: products')
    expect(res.frames.join('')).toContain('"code":"summary_unavailable"')
    expect(res.frames.join('')).not.toContain(env.LLM_GATEWAY_API_KEY)
})

test('internal Gateway data-wrapped generation frames are streamed', async () => {
    const res = result()
    const fetchImpl = jest
        .fn()
        .mockResolvedValueOnce(response(products))
        .mockResolvedValueOnce(
            gateway(
                'event: generation\ndata: {"data":{"generation_details":{"generations":[{"content":"Internal model text"}]}}}\n\ndata: [DONE]\n\n'
            )
        )
    await createSearchSummaryHandler({config, env, fetchImpl})(request(), res)
    expect(res.frames.join('')).toContain('"text":"Internal model text"')
    expect(res.frames.join('')).toContain('event: completed')
})

test('disabled sites make no catalog or model request even when another site is enabled', async () => {
    const disabled = {
        ...config,
        app: {
            ...config.app,
            sites: [...config.app.sites, {id: 'disabled-site', searchSummary: {enabled: false}}]
        }
    }
    const req = request()
    req.body.parameters = {...parameters, siteId: 'disabled-site'}
    const fetchImpl = jest.fn()
    const res = result()
    await createSearchSummaryHandler({config: disabled, env, fetchImpl})(req, res)
    expect(res.statusCode).toBe(404)
    expect(fetchImpl).not.toHaveBeenCalled()
})
test('feature-off registers no routes and does not require Gateway credentials', () => {
    const app = {post: jest.fn()}
    registerSearchSummaryRoute(app, {
        ...config,
        app: {...config.app, searchSummary: {enabled: false}}
    })
    expect(app.post).not.toHaveBeenCalled()
})
