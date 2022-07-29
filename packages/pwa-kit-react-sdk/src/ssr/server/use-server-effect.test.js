/**
 * @jest-environment node
 */
/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* eslint-disable header/header */
import {render, ALLOWLISTED_INLINE_SCRIPTS} from './react-rendering'
import {RemoteServerFactory} from 'pwa-kit-runtime/ssr/server/build-remote-server'
import request from 'supertest'
import {parse} from 'node-html-parser'
import path from 'path'
import {isRemote} from 'pwa-kit-runtime/utils/ssr-server'

const opts = (overrides = {}) => {
    const fixtures = path.join(__dirname, '..', '..', 'ssr', 'server', 'test_fixtures')
    const defaults = {
        buildDir: fixtures,
        mobify: {
            ssrEnabled: true,
            ssrParameters: {
                proxyConfigs: []
            },
            useServerEffect: true
        },
        protocol: 'http'
    }
    return {
        ...defaults,
        ...overrides
    }
}

const mobile =
    'Mozilla/5.0 (iPhone; U; CPU like Mac OS X; en) AppleWebKit/420+ (KHTML, like Gecko) Version/3.0 Mobile/1A543 Safari/419.3'
const tablet =
    'Mozilla/5.0 (iPad; CPU OS 6_1 like Mac OS X) AppleWebKit/536.26 (KHTML, like Gecko) Version/6.0 Mobile/10B141 Safari/8536.25'


jest.mock('../universal/routes', () => {
    const React = require('react')
    const PropTypes = require('prop-types')
    const errors = require('../universal/errors')
    const {Redirect} = require('react-router-dom')
    const {Helmet} = require('react-helmet')
    // const useServerEffect = require('../universal/hooks/use-server-effect')
    const createServerEffectContext = require('../universal/hooks/use-server-effect').createServerEffectContext
    
    let serverEffectContext = 0
    // Use a new `ServerEffectProvider` for each component to mimic the runtime having a new context per request.
    const withServerEffectProvider = (Component) => {
        const {ServerEffectProvider, useServerEffect} = createServerEffectContext((++serverEffectContext).toString())

        const WrappedComponent = () => {
            return (
                <ServerEffectProvider>
                    <Component useServerEffect={useServerEffect} />
                </ServerEffectProvider>
            )
        }

        return WrappedComponent
    }

    const UseServerEffectWorksWhenErrorIsThrown = 
        withServerEffectProvider(({useServerEffect}) => {
            const {error} = useServerEffect(async () => {
                throw new Error('This is an error')
            }, [])
    
            return <div>{error.message}</div>
        })

    const UseServerEffectWorks = 
        withServerEffectProvider(({useServerEffect}) => {
            const {data} = useServerEffect(async () => {
                return {prop: 'prop-value'}
            }, [])
    
            return <div>{data.prop}</div>
        })

    const UseServerEffectCanSetStatusCode = 
        withServerEffectProvider(({useServerEffect}) => {
            useServerEffect(async ({res}) => {
                res.status(418)
            }, [])
    
            return <div>418 - I am a Teapot</div>
        })

    return {
        __esModule: true,
        default: [
            {
                path: '/use-server-works-when-error-is-thrown/',
                component: UseServerEffectWorksWhenErrorIsThrown
            }, 
            {
                path: '/use-server-effect-works/',
                component: UseServerEffectWorks
            },
            {
                path: '/use-server-can-set-status-code/',
                component: UseServerEffectCanSetStatusCode
            }
        ]
    }
})

jest.mock('pwa-kit-runtime/utils/ssr-server', () => {
    const actual = jest.requireActual('pwa-kit-runtime/utils/ssr-server')
    return {
        ...actual,
        isRemote: jest.fn()
    }
})

jest.mock('@loadable/server', () => {
    const lodableServer = jest.requireActual('@loadable/server')
    return {
        ...lodableServer,

        // Tests aren't being run through webpack, therefore no chunks or `loadable-stats.json`
        // file is being created. ChunkExtractor causes a file read exception. For this
        // reason, we mock the implementation to do nothing.
        ChunkExtractor: function() {
            return {
                collectChunks: jest.fn().mockImplementation((x) => x),
                getScriptElements: jest.fn().mockReturnValue([])
            }
        }
    }
})

describe('The Node SSR Environment', () => {
    const OLD_ENV = process.env

    beforeAll(() => {
        // These values are not allowed to be `undefined` when `isRemote` returns true. So we mock them.
        process.env.BUNDLE_ID = '1'
        process.env.DEPLOY_TARGET = 'production'
        process.env.EXTERNAL_DOMAIN_NAME = 'test.com'
        process.env.MOBIFY_PROPERTY_ID = 'test'
    })

    afterAll(() => {
        process.env = OLD_ENV // Restore old environment
    })

    afterEach(() => {
        jest.restoreAllMocks()
    })

    const cases = [
        {
            description: `useServerEffect returns error when one is thrown`,
            req: {url: '/use-server-works-when-error-is-thrown/'},
            assertions: (res) => {
                expect(res.statusCode).toBe(200)
                const html = res.text
                const doc = parse(html)
                const include = ['<div>This is an error</div>']
                include.forEach((s) => expect(html).toEqual(expect.stringContaining(s)))
            }
        },
        {
            description: `useServerEffect returns object`,
            req: {url: '/use-server-effect-works/'},
            assertions: (res) => {
                expect(res.statusCode).toBe(200)
                const html = res.text
                const doc = parse(html)
                const include = ['<div>prop-value</div>']
                include.forEach((s) => expect(html).toEqual(expect.stringContaining(s)))
            }
        },
        {
            description: `useServerEffect can set status code`,
            req: {url: '/use-server-can-set-status-code/'},
            assertions: (res) => {
                expect(res.statusCode).toBe(418)
            }
        }
    ]

    // Run test cases
    cases.forEach(({description, req, assertions, mocks}) => {
        test(`renders PWA pages properly when remote (${description})`, () => {
            // Mock `isRemote` per test execution.
            isRemote.mockReturnValue(true)
            process.env.NODE_ENV = 'production'

            const {url, headers, query} = req
            const app = RemoteServerFactory._createApp(opts())
            app.get('/*', render)
            if (mocks) {
                mocks()
            }
            return request(app)
                .get(url)
                .set(headers || {})
                .query(query || {})
                .then((res) => assertions(res))
        })
    })
})
