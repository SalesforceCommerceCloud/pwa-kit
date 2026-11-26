/*
 * Copyright (c) 2026, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {EventEmitter} from 'node:events'
import {
    createCommerceAgentSearch,
    registerCommerceAgentSearch
} from '@salesforce/retail-react-app/app/server/commerce-agent-search'

const siteId = 'ExampleSite'
const apiOrigin = 'https://commerce-agent.example.com'
const config = {
    app: {
        commerceAPI: {parameters: {organizationId: 'f_ecom_example', shortCode: 'example'}},
        sites: [{id: siteId}]
    }
}
const headers = {authorization: 'Bearer shopper'}
const res = () => {
    const output = new EventEmitter()
    return Object.assign(output, {
        set: jest.fn(),
        status: jest.fn(() => output),
        json: jest.fn()
    })
}

test.each([
    {
        organizationId: 'f_ecom_example',
        shortCode: 'example',
        activeSite: 'ExampleSite',
        type: 'search'
    },
    {organizationId: 'f_ecom_second', shortCode: 'second', activeSite: 'OtherSite', type: 'agent'}
])(
    'classifies for $organizationId at the configured API origin',
    async ({organizationId, shortCode, activeSite, type}) => {
        const fetchImpl = jest.fn().mockResolvedValue({ok: true, json: async () => ({type})})
        const output = res()
        const storefrontConfig = {
            app: {
                commerceAPI: {parameters: {organizationId, shortCode}},
                sites: [{id: activeSite}]
            }
        }
        const searchQuestion = 'Shoes for men & women?'
        await createCommerceAgentSearch({config: storefrontConfig, apiOrigin, fetchImpl})(
            {
                headers,
                query: {
                    siteId: activeSite,
                    query: searchQuestion,
                    organizationId: 'f_ecom_unconfigured',
                    shortCode: 'unconfigured'
                }
            },
            output
        )
        const [[url, init]] = fetchImpl.mock.calls
        expect(url.origin).toBe(apiOrigin)
        expect(url.pathname).toBe(`/api/v1/agent/organizations/${organizationId}/classify`)
        expect([...url.searchParams]).toEqual([
            ['siteId', activeSite],
            ['shortCode', shortCode],
            ['query', searchQuestion]
        ])
        expect(init).toEqual(
            expect.objectContaining({
                method: 'GET',
                redirect: 'error',
                headers: {Authorization: 'Bearer shopper', Accept: 'application/json'}
            })
        )
        expect(init).not.toHaveProperty('body')
        expect(output.set).toHaveBeenCalledWith('Cache-Control', 'no-store')
        expect(output.json).toHaveBeenCalledWith({type})
    }
)

test.each([
    ['x'.repeat(501), siteId, headers, 400],
    [['shoes', 'hats'], siteId, headers, 400],
    ['shoes', 'different-site', headers, 400],
    ['shoes', siteId, {}, 401]
])(
    'rejects invalid classification requests before contacting QA',
    async (query, site, auth, status) => {
        const fetchImpl = jest.fn()
        const output = res()
        await createCommerceAgentSearch({config, apiOrigin, fetchImpl})(
            {headers: auth, query: {siteId: site, query}},
            output
        )
        expect(fetchImpl).not.toHaveBeenCalled()
        expect(output.status).toHaveBeenCalledWith(status)
    }
)

test('reports invalid classification verdicts as an upstream failure', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({ok: true, json: async () => ({route: 'agent'})})
    const output = res()
    await createCommerceAgentSearch({config, apiOrigin, fetchImpl})(
        {headers, query: {siteId, query: 'shoes'}},
        output
    )
    expect(output.status).toHaveBeenCalledWith(502)
})

test('registers only the classification route when enabled', () => {
    const app = {post: jest.fn(), get: jest.fn()}
    registerCommerceAgentSearch(
        app,
        {app: {...config.app, commerceAgentSearch: {enabled: true}}},
        apiOrigin
    )
    expect(app.get.mock.calls).toEqual([['/api/commerce-agent/classify', expect.any(Function)]])
    expect(app.post).not.toHaveBeenCalled()
})

test('leaves the classification route unregistered by default', () => {
    const app = {get: jest.fn()}
    registerCommerceAgentSearch(app, config, apiOrigin)
    expect(app.get).not.toHaveBeenCalled()
})

test.each([
    undefined,
    'http://commerce-agent.example.com',
    'https://user@commerce-agent.example.com',
    'https://commerce-agent.example.com/v1',
    'https://commerce-agent.example.com?access_token=test'
])('rejects an invalid server API origin (%s)', (apiOrigin) => {
    expect(() => createCommerceAgentSearch({config, apiOrigin})).toThrow(
        'requires an HTTPS API origin'
    )
})
