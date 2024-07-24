/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import request from 'supertest'
import {once, RemoteServerFactory} from './build-remote-server'

const opts = (overrides = {}) => {
    const defaults = {
        buildDir: './src/ssr/server/test_fixtures',
        mobify: {
            app: {
                extensions: ['test-extension']
            },
            ssrEnabled: true,
            ssrOnly: ['main.js.map', 'ssr.js', 'ssr.js.map'],
            ssrShared: ['main.js', 'ssr-loader.js', 'worker.js'],
            ssrParameters: {
                proxyConfigs: [
                    {
                        protocol: 'https',
                        host: 'test.proxy.com',
                        path: 'base'
                    },
                    {
                        protocol: 'https',
                        // This is intentionally an unreachable host
                        host: '0.0.0.0',
                        path: 'base2'
                    },
                    {
                        protocol: 'https',
                        host: 'test.proxy.com',
                        path: 'base3',
                        caching: true
                    }
                ]
            }
        },
        sslFilePath: './src/ssr/server/test_fixtures/localhost.pem',
        quiet: true
    }
    return {
        ...defaults,
        ...overrides
    }
}

describe('the once function', () => {
    test('should prevent a function being called more than once', () => {
        const fn = jest.fn(() => ({test: 'test'}))
        const wrapped = once(fn)
        expect(fn.mock.calls).toHaveLength(0)
        const v1 = wrapped()
        expect(fn.mock.calls).toHaveLength(1)
        const v2 = wrapped()
        expect(fn.mock.calls).toHaveLength(1)
        expect(v1).toBe(v2) // The exact same instance
    })
})

describe('remote server factory test coverage', () => {
    test('getSlasEndpoint returns undefined if useSLASPrivateClient is false', () => {
        const endpoint = RemoteServerFactory._getSlasEndpoint({})
        expect(endpoint).toBeUndefined()
    })

    test('getSlasEndpoint returns endpoint if useSLASPrivateClient is true', () => {
        const endpoint = RemoteServerFactory._getSlasEndpoint({useSLASPrivateClient: true})
        expect(endpoint).toBeDefined()
    })
})

describe('extensions', () => {
    test('can register extensions properly via _setupExtensions', () => {
        const app = RemoteServerFactory._createApp(opts())
        expect(app.__extensions).toBeDefined()
        return request(app)
            .get('/test-extension')
            .expect(200)
            .then((res) => {
                expect(res.text).toBe('test')
            })
    })
})
