/*
 * Copyright (c) 2026, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {PassThrough} from 'node:stream'
import {ReadableStream} from 'node:stream/web'
import {
    createCommerceAgentSearch,
    registerCommerceAgentSearch
} from '@salesforce/retail-react-app/app/server/commerce-agent-search'

const siteId = 'ExampleSite'
const apiOrigin = 'https://commerce-agent.example.com'
const config = {
    app: {
        commerceAPI: {parameters: {organizationId: 'f_ecom_example', shortCode: 'example'}},
        sites: [
            {id: siteId, l10n: {supportedLocales: [{id: 'en-US'}], supportedCurrencies: ['USD']}}
        ]
    }
}
const headers = {authorization: 'Bearer shopper'}
const res = () => {
    const output = new PassThrough()
    return Object.assign(output, {
        set: jest.fn(),
        status: jest.fn(() => output),
        json: jest.fn(),
        flushHeaders: jest.fn()
    })
}

test.each([
    {
        organizationId: 'f_ecom_example',
        shortCode: 'example',
        activeSite: 'ExampleSite',
        locale: 'en-US',
        currency: 'USD'
    },
    {
        organizationId: 'f_ecom_second',
        shortCode: 'second',
        activeSite: 'OtherSite',
        locale: 'en-GB',
        currency: 'GBP'
    }
])(
    'uses the shared API origin for $organizationId',
    async ({organizationId, shortCode, activeSite, locale, currency}) => {
        const outcome = {
            route: 'search',
            initialContent: {type: 'search', productSearchResult: {total: 1}}
        }
        const fetchImpl = jest.fn().mockResolvedValue({ok: true, json: async () => outcome})
        const output = res()
        const storefrontConfig = {
            app: {
                commerceAPI: {parameters: {organizationId, shortCode}},
                sites: [
                    {
                        id: activeSite,
                        l10n: {supportedLocales: [{id: locale}], supportedCurrencies: [currency]}
                    }
                ]
            }
        }
        await createCommerceAgentSearch({config: storefrontConfig, apiOrigin, fetchImpl}).query(
            {
                headers,
                body: {
                    siteId: activeSite,
                    query: 'vest',
                    locale,
                    currency,
                    organizationId: 'f_ecom_unconfigured',
                    shortCode: 'unconfigured',
                    limit: 25,
                    sort: 'best-matches'
                }
            },
            output
        )
        const [[url, init]] = fetchImpl.mock.calls
        expect(url.origin).toBe(apiOrigin)
        expect(url.pathname).toBe(`/api/v1/agent/organizations/${organizationId}/query`)
        expect(url.searchParams.get('siteId')).toBe(activeSite)
        expect(url.searchParams.get('shortCode')).toBe(shortCode)
        expect(url.searchParams.get('locale')).toBe(locale)
        expect(url.searchParams.get('currency')).toBe(currency)
        expect(init).toEqual(
            expect.objectContaining({
                method: 'POST',
                redirect: 'error',
                body: JSON.stringify({query: 'vest'}),
                headers: {
                    Authorization: 'Bearer shopper',
                    Accept: 'application/json',
                    'Content-Type': 'application/json'
                }
            })
        )
        expect(output.json).toHaveBeenCalledWith(outcome)
    }
)

test('flushes SSE before the upstream stream closes', async () => {
    let source
    const body = new ReadableStream({
        start(controller) {
            source = controller
        }
    })
    const fetchImpl = jest
        .fn()
        .mockResolvedValue({ok: true, headers: {get: () => 'text/event-stream'}, body})
    const output = res()
    const first = new Promise((resolve) => output.once('data', (data) => resolve(data.toString())))
    const done = createCommerceAgentSearch({config, apiOrigin, fetchImpl}).events(
        {
            headers,
            query: {siteId},
            params: {turnId: 'turn_test'}
        },
        output
    )
    source.enqueue(Buffer.from(': ok\n\n'))
    expect(await first).toBe(': ok\n\n')
    expect(output.flushHeaders).toHaveBeenCalled()
    expect(output.writableEnded).toBe(false)
    expect(fetchImpl.mock.calls[0][0].pathname).toBe(
        '/api/v1/agent/organizations/f_ecom_example/turns/turn_test/events'
    )
    source.close()
    await done
})

test('leaves the proxy routes unregistered by default', () => {
    const app = {post: jest.fn(), get: jest.fn()}
    registerCommerceAgentSearch(app, config, apiOrigin)
    expect(app.post).not.toHaveBeenCalled()
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
