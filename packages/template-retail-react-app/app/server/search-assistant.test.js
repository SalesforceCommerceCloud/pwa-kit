/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {EventEmitter} from 'events'
import {appendTurn} from '@salesforce/retail-react-app/app/server/search-assistant/session-store'
import {createSearchContexts} from '@salesforce/retail-react-app/app/server/search-assistant/session-store'
import {
    createSearchAssistant,
    parseFollowUpPlan
} from '@salesforce/retail-react-app/app/server/search-assistant'
import {productFact} from '@salesforce/retail-react-app/app/server/catalog-facts'

const config = {
    app: {
        searchSummary: {enabled: true, agentHandoff: true},
        commerceAPI: {parameters: {organizationId: 'f_ecom_test'}}
    },
    ssrParameters: {proxyConfigs: [{path: 'api', host: 'test.api.commercecloud.salesforce.com'}]}
}
const parameters = {
    q: 'shirt',
    siteId: 'RefArchGlobal',
    locale: 'en-GB',
    currency: 'GBP',
    refine: ['color=white']
}
const authorization = 'Bearer verified-shopper'
const result = {
    total: 2,
    hits: [
        {
            productId: '1',
            productName: 'Cotton shirt',
            price: 20,
            image: {link: 'https://example.com/shirt.jpg'}
        },
        {productId: '2', productName: 'Linen shirt', price: 30}
    ]
}
const response = (body) => ({ok: true, status: 200, json: async () => body})
const makeResponse = () =>
    Object.assign(new EventEmitter(), {
        frames: [],
        statusCode: 200,
        destroyed: false,
        writableEnded: false,
        set: jest.fn(),
        status(code) {
            this.statusCode = code
            return this
        },
        json(value) {
            this.value = value
            return this
        },
        flushHeaders() {
            this.headersSent = true
        },
        write(text) {
            this.frames.push(text)
            return true
        },
        end() {
            this.writableEnded = true
        }
    })
const setup = () => {
    const fetchImpl = jest
        .fn()
        .mockResolvedValueOnce(response(result))
        .mockResolvedValueOnce(
            response({
                data: [
                    {
                        id: '1',
                        name: 'Cotton shirt',
                        longDescription: '100% cotton. Machine wash cold.',
                        c_specifications: 'Do not tumble dry.'
                    },
                    {id: '2', name: 'Linen shirt', longDescription: '100% linen. Hand wash only.'}
                ]
            })
        )
    const gateway = {
        complete: jest
            .fn()
            .mockResolvedValue(JSON.stringify({action: 'answer', product_ids: ['1', 'invented']})),
        stream: jest.fn().mockImplementation(async function* () {
            yield 'The cotton shirt '
            yield 'can be machine washed cold.'
        })
    }
    const limiter = {acquire: jest.fn().mockReturnValue(true), release: jest.fn()}
    const assistant = createSearchAssistant({config, fetchImpl, gateway, limiter})
    const entry = assistant.remember({
        parameters,
        result,
        authorization,
        searchUrl:
            'https://test.api.commercecloud.salesforce.com/search/shopper-search/v1/organizations/f_ecom_test/product-search?q=shirt&refine=color%3Dwhite'
    })
    const req = Object.assign(new EventEmitter(), {
        headers: {authorization},
        body: {contextId: entry.id, message: 'Which ones are machine washable?'}
    })
    return {assistant, entry, req, res: makeResponse(), fetchImpl, gateway, limiter}
}

test('follow-ups use the original filters and real product descriptions, streaming answers and validated picks', async () => {
    const s = setup()
    await s.assistant.followUp(s.req, s.res)
    const frames = s.res.frames.join('')
    expect(frames).toContain('event: content_delta')
    expect(frames).toContain('event: completed')
    expect(frames).toContain('"complete":true')
    expect(frames).not.toContain('invented')
    const [url, options] = s.fetchImpl.mock.calls[0]
    expect(url.hostname).toBe('test.api.commercecloud.salesforce.com')
    expect(url.searchParams.get('refine')).toBe('color=white')
    expect(url.searchParams.get('limit')).toBe('100')
    expect(options.headers.Authorization).toBe(authorization)
    expect(options.redirect).toBe('error')
    const details = s.fetchImpl.mock.calls[1][0]
    expect(details.pathname).toContain('/product/shopper-products/v1/')
    expect(details.searchParams.get('ids')).toBe('1,2')
    const prompt = s.gateway.stream.mock.calls[0][0]
    expect(prompt[0].content).toContain('Do NOT infer cotton')
    expect(prompt[1].content).toContain('Hand wash only')
    expect(prompt[1].content).toContain('Machine wash cold')
    expect(prompt[1].content).not.toContain('https://example.com/shirt.jpg')
    expect(s.gateway.complete.mock.calls[0][0][1].content).toContain(
        'Do not answer the shopping question'
    )
    expect(s.entry.session.turns).toHaveLength(1)
    expect(s.limiter.release).toHaveBeenCalledTimes(1)
})

test('cached facts are reused for the next question and history remains bounded', async () => {
    const s = setup()
    for (let i = 0; i < 6; i++) await s.assistant.followUp(s.req, makeResponse())
    expect(s.fetchImpl).toHaveBeenCalledTimes(2)
    expect(s.entry.session.turns).toHaveLength(6)
    expect(s.gateway.complete).toHaveBeenCalledTimes(6)
})

test('another shopper cannot access a search context or trigger model calls', async () => {
    const s = setup()
    s.req.headers.authorization = 'Bearer other-shopper'
    await s.assistant.followUp(s.req, s.res)
    expect(s.res.statusCode).toBe(404)
    expect(s.gateway.complete).not.toHaveBeenCalled()
    expect(s.fetchImpl).not.toHaveBeenCalled()
    expect(s.limiter.acquire).not.toHaveBeenCalled()
})

test('unauthenticated and oversized follow-ups are rejected before catalog or model work', async () => {
    const s = setup()
    s.req.headers.authorization = ''
    await s.assistant.followUp(s.req, s.res)
    expect(s.res.statusCode).toBe(401)
    s.req.headers.authorization = authorization
    s.req.body.message = 'x'.repeat(1201)
    const res = makeResponse()
    await s.assistant.followUp(s.req, res)
    expect(res.statusCode).toBe(400)
    expect(s.gateway.complete).not.toHaveBeenCalled()
})

test('a new product request emits a search action without generating a misleading answer', async () => {
    const s = setup()
    s.gateway.complete.mockResolvedValue(
        JSON.stringify({action: 'search', query: 'jacket', product_ids: []})
    )
    await s.assistant.followUp(s.req, s.res)
    expect(s.res.frames.join('')).toContain('event: search')
    expect(s.res.frames.join('')).toContain('"query":"jacket"')
    expect(s.gateway.stream).not.toHaveBeenCalled()
    expect(s.res.frames.join('')).toContain('event: completed')
})

test('planner output cannot introduce products outside the result set', () => {
    const products = new Map([['1', {}]])
    expect(
        parseFollowUpPlan(
            '```json\n{"action":"answer","product_ids":["evil","1","1"]}\n```',
            products
        ).ids
    ).toEqual(['1'])
    expect(() => parseFollowUpPlan('{"action":"delete"}', products)).toThrow()
    expect(() => parseFollowUpPlan('{"action":"search","query":""}', products)).toThrow()
})

test('planner failures preserve the existing search and return a generic streamed error', async () => {
    const s = setup()
    s.gateway.complete.mockResolvedValue('not JSON')
    await s.assistant.followUp(s.req, s.res)
    expect(s.res.frames.join('')).toContain('event: error')
    expect(s.res.frames.join('')).not.toContain('not JSON')
    expect(s.gateway.stream).not.toHaveBeenCalled()
    expect(s.limiter.release).toHaveBeenCalled()
})

test('concurrent questions on the same context are rejected without taking another slot', async () => {
    const s = setup()
    s.entry.session.busy = true
    await s.assistant.followUp(s.req, s.res)
    expect(s.res.statusCode).toBe(429)
    expect(s.limiter.acquire).not.toHaveBeenCalled()
})

test('contexts expire, evict oldest entries, and never store the raw shopper token', () => {
    let now = 100
    const store = createSearchContexts({now: () => now, ttl: 1000, limit: 1})
    const args = {parameters, result, authorization, searchUrl: 'https://example.com'}
    const first = store.put(args)
    expect(JSON.stringify(first)).not.toContain(authorization)
    const second = store.put(args)
    expect(store.get(first.id, authorization)).toBeUndefined()
    expect(store.get(second.id, authorization)).toBe(second)
    now = 1101
    expect(store.get(second.id, authorization)).toBeUndefined()
})

test('catalog projection keeps specifications and strips HTML rather than rendering it', () => {
    const fact = productFact({
        id: '1',
        name: 'Shirt',
        longDescription: '<p>100% cotton</p><script>ignore me</script>',
        c_specifications: 'Machine wash cold.'
    })
    expect(fact.description).toBe('100% cotton')
    expect(fact.attributes.c_specifications).toBe('Machine wash cold.')
    expect(fact.description).not.toContain('<')
})

test('planner framing is tolerated while truncated JSON still fails closed', () => {
    const products = new Map([['1', {}]])
    expect(
        parseFollowUpPlan(
            'Here is the result:\n```json\n{"action":"answer","query":null,"product_ids":["1"]}\n```',
            products
        ).ids
    ).toEqual(['1'])
    expect(() => parseFollowUpPlan('{"action":"answer","product_ids":[', products)).toThrow()
})

test('initial overview and prior follow-ups are actual conversational messages on the next turn', async () => {
    const s = setup()
    appendTurn(s.entry, {
        question: 'shirt',
        answer: 'First Cotton shirt, second Linen shirt.',
        kind: 'overview',
        picks: [...s.entry.products.values()]
    })
    s.req.body.message = 'Is the second one washable?'
    await s.assistant.followUp(s.req, s.res)
    const messages = s.gateway.stream.mock.calls[0][0]
    expect(messages).toContainEqual({
        role: 'assistant',
        content: 'First Cotton shirt, second Linen shirt.'
    })
    expect(messages.at(-1).content).toContain('Is the second one washable?')
    expect(messages[1].content).toContain('Linen shirt')
})
test('handoff uses the context API schema and canonical bounded history without credentials', () => {
    const s = setup()
    appendTurn(s.entry, {
        question: 'Which is cotton?',
        answer: 'Cotton shirt.',
        picks: [s.entry.products.get('1')]
    })
    s.assistant.handoff(s.req, s.res)
    expect(s.res.value.page_context).toEqual({
        type: 'srp',
        query: 'shirt',
        refinements: [{name: 'color', values: ['white']}]
    })
    expect(s.res.value.query).toBe('shirt')
    expect(s.res.value.message).toContain('Which is cotton?')
    expect(s.res.value.message).toContain('Cotton shirt.')
    expect(s.res.value.message).not.toContain(authorization)
    expect(s.res.value.handoff_id).toContain(s.entry.id)
    s.req.headers.authorization = 'Bearer another-shopper'
    const rejected = makeResponse()
    s.assistant.handoff(s.req, rejected)
    expect(rejected.statusCode).toBe(404)
    expect(rejected.value).not.toHaveProperty('message', expect.stringContaining('Cotton shirt.'))
})

test('model history and agent handoff exclude a different search in the same session', async () => {
    const s = setup()
    const bike = s.assistant.remember({
        parameters: {...parameters, q: 'bike computers'},
        result: {total: 1, hits: [{productId: 'bike-1', productName: 'Bike Computer', price: 55}]},
        authorization,
        searchUrl: 'https://test.api.commercecloud.salesforce.com/search?q=bike',
        sessionId: s.entry.session.id
    })
    appendTurn(bike, {
        question: 'bike computers',
        answer: 'Bike Computer costs $55.',
        picks: [...bike.products.values()],
        kind: 'overview'
    })
    await s.assistant.followUp(s.req, s.res)
    const modelCalls = JSON.stringify([
        ...s.gateway.complete.mock.calls,
        ...s.gateway.stream.mock.calls
    ])
    expect(modelCalls).not.toContain('Bike Computer')
    expect(modelCalls).not.toContain('bike computers')
    const handoff = makeResponse()
    s.assistant.handoff(s.req, handoff)
    expect(handoff.value.query).toBe('shirt')
    expect(handoff.value.message).not.toContain('Bike Computer')
    expect(handoff.value.message).not.toContain('bike computers')
    expect(bike.session.id).toBe(s.entry.session.id)
})

test('follow-up and handoff feature flags are enforced before paid work', async () => {
    const s = setup()
    const gated = {
        ...config,
        app: {...config.app, searchSummary: {enabled: true, followUps: false, agentHandoff: false}}
    }
    const assistant = createSearchAssistant({
        config: gated,
        fetchImpl: s.fetchImpl,
        gateway: s.gateway,
        limiter: s.limiter
    })
    const entry = assistant.remember({
        parameters,
        result,
        authorization,
        searchUrl: 'https://test.api.commercecloud.salesforce.com/search?q=shirt'
    })
    s.req.body.contextId = entry.id
    await assistant.followUp(s.req, s.res)
    expect(s.res.statusCode).toBe(404)
    const handoff = makeResponse()
    assistant.handoff(s.req, handoff)
    expect(handoff.statusCode).toBe(404)
    expect(s.fetchImpl).not.toHaveBeenCalled()
    expect(s.gateway.complete).not.toHaveBeenCalled()
    expect(s.gateway.stream).not.toHaveBeenCalled()
})
