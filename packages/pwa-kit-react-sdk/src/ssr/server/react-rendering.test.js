/**
 * @jest-environment node
 */
/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
// The @jest-environment comment block *MUST* be the first line of the file for the tests to pass.
// That conflicts with the monorepo header rule, so we must disable the rule!
/* eslint-disable header/header */
import {render, ALLOWLISTED_INLINE_SCRIPTS} from './react-rendering'
import {randomUUID} from 'crypto'
import {RemoteServerFactory} from '@salesforce/pwa-kit-runtime/ssr/server/build-remote-server'

import request from 'supertest'
import {parse} from 'node-html-parser'
import path from 'path'
import {isRemote} from '@salesforce/pwa-kit-runtime/utils/ssr-server'
import {getLocationSearch} from './react-rendering'

import {getAppConfig} from '../universal/compatibility'

const opts = (overrides = {}) => {
    const fixtures = path.join(__dirname, '..', '..', 'ssr', 'server', 'test_fixtures')
    const defaults = {
        buildDir: fixtures,
        mobify: {
            ssrEnabled: true,
            ssrParameters: {
                proxyConfigs: []
            }
        },
        protocol: 'http'
    }
    return {
        ...defaults,
        ...overrides
    }
}

jest.mock('../universal/compatibility', () => {
    const AppConfig = jest.requireActual('../universal/components/_app-config').default
    const {withReactQuery} = jest.requireActual('../universal/components/with-react-query')
    const {withLegacyGetProps} = jest.requireActual('../universal/components/with-legacy-get-props')

    const appConfig = withReactQuery(withLegacyGetProps(AppConfig))

    return {
        getAppConfig: () => appConfig
    }
})

jest.mock('../universal/routes', () => {
    // TODO: Can these requires be converted to top-level imports?
    /* eslint-disable @typescript-eslint/no-var-requires */
    const React = require('react')
    const PropTypes = require('prop-types')
    const errors = require('../universal/errors')
    const {Redirect} = require('react-router-dom')
    const {Helmet} = require('react-helmet')
    const {useQuery} = require('@tanstack/react-query')
    const {useServerContext} = require('../universal/hooks')
    /* eslint-enable @typescript-eslint/no-var-requires */

    // Test utility to exercise paths that work with @loadable/component.
    const fakeLoadable = (Wrapped) => {
        class FakeLoadable extends React.Component {
            static preload() {
                return Promise.resolve(Wrapped)
            }

            render() {
                return <Wrapped />
            }
        }
        return FakeLoadable
    }

    class PWAPage extends React.Component {
        static getProps() {
            return Promise.resolve()
        }

        static getTemplateName() {
            return 'templateName'
        }

        render() {
            return <div>This is a PWA</div>
        }
    }

    class UnknownErrorPage extends React.Component {
        static getProps() {
            throw new Error('This is an error')
        }

        render() {
            return <div>This should not be rendered</div>
        }
    }

    class ThrowStringErrorPage extends React.Component {
        static getProps() {
            throw 'This is an error'
        }

        render() {
            return <div>This should not be rendered</div>
        }
    }

    class KnownErrorPage extends React.Component {
        static getProps() {
            throw new errors.HTTPError(503, 'Service not available')
        }

        render() {
            return <div>This should not be rendered</div>
        }
    }

    class GetProps404ErrorPage extends React.Component {
        static getProps() {
            throw new errors.HTTPNotFound('Not found')
        }

        render() {
            return <div>This should not be rendered</div>
        }
    }

    class InitSetsStatusPage extends React.Component {
        static getProps({res}) {
            res.status(418)
            return Promise.resolve()
        }

        render() {
            return <div>418 - I am a Teapot</div>
        }
    }

    class GetPropsRejectsWithEmptyString extends React.Component {
        static getProps() {
            return Promise.reject('')
        }

        render() {
            return <div>This should not be rendered</div>
        }
    }

    class RenderThrowsError extends React.Component {
        static getProps() {
            return Promise.resolve()
        }
        // eslint-disable-next-line react/require-render-return
        render() {
            throw new Error('This is an error rendering')
        }
    }

    class GetPropsReturnsObject extends React.Component {
        static getProps() {
            return {prop: 'prop-value'}
        }

        render() {
            return <div>{this.props.prop}</div>
        }
    }

    class RedirectPage extends React.Component {
        static getProps() {
            return Promise.resolve()
        }

        render() {
            return <Redirect to="/elsewhere/" />
        }
    }

    class HelmetPage extends React.Component {
        static getProps() {
            return Promise.resolve()
        }

        static getTemplateName() {
            return 'templateName'
        }

        render() {
            return (
                <Helmet>
                    {/* html attributes */}
                    <html lang="helmet-html-attribute" />
                    {/* body attributes */}
                    <body className="helmet-body-attribute" />
                    {/* title attributes and value */}
                    <title>Helmet title</title>
                    {/* base element */}
                    <base target="_blank" href="http://mysite.com/" />
                    {/* multiple meta elements */}
                    <meta name="helmet-meta-1" content="helmet-meta-1" />
                    <meta property="helmet-meta-2" content="helmet-meta-2" />
                    {/* multiple link elements */}
                    <link rel="helmet-link-1" href="http://mysite.com/example" />
                    <link
                        rel="helmet-link-2"
                        href="http://mysite.com/img/apple-touch-icon-57x57.png"
                    />
                    {/* multiple script elements */}
                    <script src="http://include.com/pathtojs.js" type="text/javascript" />
                    {/* inline script elements */}
                    <script type="application/ld+json">{`
                        {
                            "@context": "http://schema.org"
                        }
                    `}</script>
                    {/* noscript elements */}
                    <noscript>{`
                        <link rel="stylesheet" type="text/css" href="foo.css" />
                    `}</noscript>
                    {/* inline style elements */}
                    <style type="text/css">{`
                        body {
                            background-color: blue;
                        }
                    `}</style>
                </Helmet>
            )
        }
    }

    class XSSPage extends React.Component {
        static getProps() {
            return {prop: '<script>alert("hey! give me your money")</script>'}
        }

        render() {
            return <div>XSS attack</div>
        }
    }

    const UseQueryResolvesObject = () => {
        const {data, isLoading} = useQuery(['use-query-resolves-object'], async () => ({
            prop: 'prop-value'
        }))
        return <div>{isLoading ? 'loading' : data.prop}</div>
    }

    const DisabledUseQueryIsntResolved = () => {
        const {data, isLoading} = useQuery(
            ['use-query-resolves-object'],
            async () => ({
                prop: 'prop-value'
            }),
            {
                enabled: false
            }
        )
        return <div>{isLoading ? 'loading' : data.prop}</div>
    }

    const GetServerContext = () => {
        const {res} = useServerContext()
        if (res) {
            console.log('--- isServerSide')
            res.status(404)
        }
        return <div />
    }

    GetPropsReturnsObject.propTypes = {
        prop: PropTypes.node
    }

    return {
        __esModule: true,
        default: [
            {
                path: '/pwa/',
                component: fakeLoadable(PWAPage)
            },
            {
                path: '/unknown-error/',
                component: UnknownErrorPage
            },
            {
                path: '/throw-string/',
                component: ThrowStringErrorPage
            },
            {
                path: '/known-error/',
                component: KnownErrorPage
            },
            {
                path: '/404-in-get-props-error/',
                component: GetProps404ErrorPage
            },
            {
                path: '/redirect/',
                component: RedirectPage
            },
            {
                path: '/init-sets-status/',
                component: InitSetsStatusPage
            },
            {
                path: '/get-props-returns-object/',
                component: GetPropsReturnsObject
            },
            {
                path: '/get-props-rejects-with-empty-string/',
                component: GetPropsRejectsWithEmptyString
            },
            {
                path: '/render-throws-error/',
                component: RenderThrowsError
            },
            {
                path: '/render-helmet/',
                component: fakeLoadable(HelmetPage)
            },
            {
                path: '/xss/',
                component: XSSPage
            },
            {
                path: '/use-query-resolves-object/',
                component: UseQueryResolvesObject
            },
            {
                path: '/disabled-use-query-isnt-resolved/',
                component: DisabledUseQueryIsntResolved
            },
            {
                path: '/server-context',
                component: GetServerContext
            }
        ]
    }
})

jest.mock('@salesforce/pwa-kit-runtime/utils/ssr-server', () => {
    const actual = jest.requireActual('@salesforce/pwa-kit-runtime/utils/ssr-server')
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
        ChunkExtractor: function () {
            return {
                collectChunks: jest.fn().mockImplementation((x) => x),
                getScriptElements: jest.fn().mockReturnValue([])
            }
        }
    }
})

jest.mock('@salesforce/pwa-kit-runtime/ssr/server/build-remote-server', () => {
    const actual = jest.requireActual('@salesforce/pwa-kit-runtime/ssr/server/build-remote-server')
    return {
        ...actual,
        RemoteServerFactory: {
            ...actual.RemoteServerFactory,
            _setRequestId: jest.fn()
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

    /**
     * Scripts are "safe" if they are external, not executable or on our allow list of
     * static, inline scripts.
     */
    const scriptsAreSafe = (doc) => {
        const scripts = Array.from(doc.querySelectorAll('script'))
        expect(scripts.length > 0).toBe(true)
        return scripts.every((script) => {
            const external = script.hasAttribute('src')
            const executable =
                !script.hasAttribute('type') ||
                script.getAttribute('type') === 'application/javascript'
            const allowlisted = ALLOWLISTED_INLINE_SCRIPTS.indexOf(script.innerHTML) >= 0
            return external || !executable || allowlisted
        })
    }

    const dataFromHTML = (doc) => JSON.parse(doc.querySelector('#mobify-data').innerHTML)

    const cases = [
        {
            description: `rendering PWA's for desktop`,
            req: {url: '/pwa/'},
            assertions: (res) => {
                expect(res.statusCode).toBe(200)
                const html = res.text
                console.error(html)
                const doc = parse(html)
                const include = ['<div>This is a PWA</div>']
                const dataScript = doc.querySelectorAll('script[id=mobify-data]')[0]
                expect(dataScript.innerHTML.split(/\r\n|\r|\n/)).toHaveLength(1)
                include.forEach((s) => expect(html).toEqual(expect.stringContaining(s)))
                expect(scriptsAreSafe(doc)).toBe(true)
            }
        },
        {
            description: `rendering PWA's for tablet`,
            req: {
                url: '/pwa/'
            },
            assertions: (res) => {
                expect(res.statusCode).toBe(200)
                const html = res.text
                const doc = parse(html)
                const include = ['<div>This is a PWA</div>']
                include.forEach((s) => expect(html).toEqual(expect.stringContaining(s)))
                expect(scriptsAreSafe(doc)).toBe(true)
            }
        },
        {
            description: `rendering PWA's for mobile`,
            req: {
                url: '/pwa/'
            },
            assertions: (res) => {
                expect(res.statusCode).toBe(200)
                const html = res.text
                const doc = parse(html)
                const include = ['<div>This is a PWA</div>']
                include.forEach((s) => expect(html).toEqual(expect.stringContaining(s)))
                expect(scriptsAreSafe(doc)).toBe(true)
            }
        },
        {
            description: `rendering PWA's in "mobify-server-only" mode should not execute scripts on the client`,
            req: {url: '/pwa/', query: {mobify_server_only: '1'}},
            assertions: (res) => {
                const html = res.text
                const doc = parse(html)
                const include = ['<div>This is a PWA</div>']
                include.forEach((s) => expect(html).toEqual(expect.stringContaining(s)))
                doc.querySelectorAll('script').forEach((script) => {
                    // application/json prevents execution!
                    expect(script.getAttribute('type')).toBe('application/json')
                })
            }
        },
        {
            description: `rendering PWA's in "__server-only" mode should not execute scripts on the client`,
            req: {url: '/pwa/', query: {__server_only: '1'}},
            assertions: (res) => {
                const html = res.text
                const doc = parse(html)
                const include = ['<div>This is a PWA</div>']
                include.forEach((s) => expect(html).toEqual(expect.stringContaining(s)))
                doc.querySelectorAll('script').forEach((script) => {
                    // application/json prevents execution!
                    expect(script.getAttribute('type')).toBe('application/json')
                })
            }
        },
        {
            description: `rendering PWA's with legacy "mobify_pretty" mode should print stylized global state`,
            req: {url: '/pwa/', query: {mobify_pretty: '1'}},
            assertions: (res) => {
                const html = res.text
                const doc = parse(html)
                const include = ['<div>This is a PWA</div>']
                include.forEach((s) => expect(html).toEqual(expect.stringContaining(s)))
                const script = doc.querySelectorAll('script[id=mobify-data]')[0]

                expect(script.innerHTML.split(/\r\n|\r|\n/).length).toBeGreaterThan(1)
            }
        },
        {
            description: `rendering PWA's with  "__pretty_print" mode should print stylized global state`,
            req: {url: '/pwa/', query: {__pretty_print: '1'}},
            assertions: (res) => {
                const html = res.text
                const doc = parse(html)
                const include = ['<div>This is a PWA</div>']
                include.forEach((s) => expect(html).toEqual(expect.stringContaining(s)))
                const script = doc.querySelectorAll('script[id=mobify-data]')[0]

                expect(script.innerHTML.split(/\r\n|\r|\n/).length).toBeGreaterThan(1)
            }
        },
        {
            description: `404 when no route matches`,
            req: {url: '/this-should-404/'},
            assertions: (res) => {
                expect(res.statusCode).toBe(404)
            }
        },
        {
            description: `404 when getProps method throws a 404`,
            req: {url: '/404-in-get-props-error/'},
            assertions: (res) => {
                expect(res.statusCode).toBe(404)
            }
        },
        {
            description: `supports react-routers redirect mechanism`,
            req: {url: '/redirect/'},
            assertions: (res) => {
                expect(res.statusCode).toBe(302)
            }
        },
        {
            description: `500 on unknown errors in getProps`,
            req: {url: '/unknown-error/'},
            assertions: (res) => {
                expect(res.statusCode).toBe(500)
            }
        },
        {
            description: `500 when string (not Error) thrown in getProps`,
            req: {url: '/throw-string/'},
            assertions: (res) => {
                expect(res.statusCode).toBe(500)
            }
        },
        {
            description: `5XX on known HTTP errors in getProps`,
            req: {url: '/known-error/'},
            assertions: (res) => {
                expect(res.statusCode).toBe(503)
            }
        },
        {
            description: `Respects HTTP status codes set in init() methods`,
            req: {url: '/init-sets-status/'},
            assertions: (res) => {
                expect(res.statusCode).toBe(418)
            }
        },
        {
            description: `Works if the user returns an Object of props, instead of a Promise`,
            req: {url: '/get-props-returns-object/'},
            assertions: (res) => {
                expect(res.statusCode).toBe(200)
                const html = res.text
                const include = ['<div>prop-value</div>']
                include.forEach((s) => expect(html).toEqual(expect.stringContaining(s)))
            }
        },
        {
            description: `Renders the error page if getProps rejects with an empty string`,
            req: {url: '/get-props-rejects-with-empty-string/'},
            assertions: (res) => {
                const html = res.text
                const doc = parse(html)
                const data = dataFromHTML(doc)

                expect(data.__ERROR__.message).toBe('Internal Server Error')
                expect(typeof data.__ERROR__.stack).toEqual(isRemote() ? 'undefined' : 'string')

                expect(data.__ERROR__.status).toBe(500)
            }
        },
        {
            description: `Renders the error page instead if there is an error during component rendering`,
            req: {url: '/render-throws-error/'},
            assertions: (res) => {
                const html = res.text
                const doc = parse(html)
                const data = dataFromHTML(doc)

                expect(data.__ERROR__.message).toBe('Internal Server Error')
                expect(typeof data.__ERROR__.stack).toEqual(isRemote() ? 'undefined' : 'string')
                expect(data.__ERROR__.status).toBe(500)
                expect(res.statusCode).toBe(500)
            }
        },
        {
            description: `Renders react-helmet tags`,
            req: {url: '/render-helmet/'},
            assertions: (res) => {
                expect(res.statusCode).toBe(200)
                const html = res.text
                const doc = parse(html)
                const head = doc.querySelector('head')
                expect(html).toContain('lang="helmet-html-attribute"')
                expect(doc.querySelector('body').getAttribute('class')).toBe(
                    'helmet-body-attribute'
                )
                expect(head.querySelector(`title`).innerHTML).toBe('Helmet title')
                expect(head.querySelector('base').getAttribute('target')).toBe('_blank')
                expect(doc.querySelector('style').innerHTML).toContain('background-color: blue;')
                expect(doc.querySelector('noscript').innerHTML).toContain(
                    '<link rel="stylesheet" type="text/css" href="foo.css" />'
                )
                expect(doc.querySelector('noscript').innerHTML).toEqual(
                    expect.stringContaining(
                        '<link rel="stylesheet" type="text/css" href="foo.css" />'
                    )
                )
                expect(head.querySelector('meta[name="helmet-meta-1"]')).not.toBeNull()
                expect(head.querySelector('meta[property="helmet-meta-2"]')).not.toBeNull()
                expect(head.querySelector('link[rel="helmet-link-1"]')).not.toBeNull()
                expect(head.querySelector('link[rel="helmet-link-2"]')).not.toBeNull()
                expect(
                    head.querySelector('script[src="http://include.com/pathtojs.js"]')
                ).not.toBeNull()
                expect(
                    head.querySelector('script[type="application/ld+json"]').innerHTML
                ).toContain(`"@context": "http://schema.org"`)
            }
        },
        {
            description: `Frozen state is escaped preventing injection attacks`,
            req: {url: '/xss/'},
            assertions: (res) => {
                const html = res.text
                const doc = parse(html)
                const scriptContent = doc.querySelector('#mobify-data').innerHTML

                expect(scriptContent).not.toContain('<script>')
            }
        },
        {
            description: `AppConfig errors are caught`,
            req: {url: '/pwa/'},
            mocks: () => {
                const AppConfig = getAppConfig()
                jest.spyOn(AppConfig.prototype, 'render').mockImplementation(() => {
                    throw new Error()
                })
            },
            assertions: (res) => {
                const html = res.text
                expect(res.statusCode).toBe(500)

                const shouldIncludeErrorStack = !isRemote()
                expect(html).toContain(
                    shouldIncludeErrorStack ? 'Error: ' : 'Internal Server Error'
                )
            }
        },
        {
            description: `Works if the user resolves an Object with useQuery`,
            req: {url: '/use-query-resolves-object/'},
            assertions: (res) => {
                expect(res.statusCode).toBe(200)
                const html = res.text
                expect(html).toEqual(expect.stringContaining('<div>prop-value</div>'))
            }
        },
        {
            description: `Disabled useQuery queries aren't run on the server`,
            req: {url: '/disabled-use-query-isnt-resolved/'},
            assertions: (res) => {
                expect(res.statusCode).toBe(200)
                const html = res.text
                expect(html).toEqual(expect.stringContaining('<div>loading</div>'))
            }
        },
        {
            description: 'Get the server context and set the response status to 404',
            req: {url: '/server-context'},
            mocks: () => {
                jest.spyOn(console, 'log')
            },
            assertions: (res) => {
                expect(res.statusCode).toBe(404)

                // Because of the prepass step we'll expect that this method is called twice.
                expect(console.log).toHaveBeenCalledTimes(2)
            }
        },
        {
            description: `Server-Timing header is present in the response`,
            req: {url: '/pwa/', query: {__server_timing: '1'}},
            assertions: (res) => {
                expect(res.headers['server-timing']).toContain('route-matching;dur=')
                expect(res.headers['server-timing']).toContain('render-to-string;dur=')
                expect(res.headers['server-timing']).toContain('total;dur=')
            }
        }
    ]

    const isRemoteValues = [true, false]
    RemoteServerFactory._setRequestId.mockImplementation((_app) => {
        _app.use((req, res, next) => {
            res.locals.requestId = randomUUID()
            next()
        })
    })
    isRemoteValues.forEach((isRemoteValue) => {
        // Rename `assertions` to `expectations` to pass linter rule
        cases.forEach(({description, req, assertions: expectations, mocks}) => {
            test(`renders PWA pages properly when ${
                isRemoteValue ? 'remote' : 'local'
            } (${description})`, async () => {
                // Mock `isRemote` per test execution.
                isRemote.mockReturnValue(isRemoteValue)
                process.env.NODE_ENV = isRemoteValue ? 'production' : 'development'

                const {url, headers, query} = req
                const app = RemoteServerFactory._createApp(opts())

                app.get('/*', render)
                if (mocks) {
                    mocks()
                }
                const res = await request(app)
                    .get(url)
                    .set(headers || {})
                    .query(query || {})
                expectations(res)
            })
        })
    })
})

describe('getLocationSearch', function () {
    test('interprets + sign as space when interpretsPlusSignAsSpace is set to true in config', () => {
        const req = {
            originalUrl: '/hello-word?q=mens+shirt%20dresses',
            query: {
                q: 'mens+shirt%20dresses'
            }
        }
        const output = getLocationSearch(req, {interpretPlusSignAsSpace: true})
        // we called URLSearchParam.toString for the output, any encoded/not encoded space will replace + with interpretsPlusSignAsSpace is true
        expect(output).toBe('?q=mens+shirt+dresses')
    })
    test('not interpret + sign as space when interpretsPlusSignAsSpace is set to false in config', () => {
        const req = {
            originalUrl: '/hello-word?q=mens+shirt',
            query: {
                q: 'mens+shirt'
            }
        }
        // we called URLSearchParam.toString for the output, with interpretsPlusSignAsSpace is false, it will encode literally + to %2B
        const output = getLocationSearch(req)
        expect(output).toBe('?q=mens%2Bshirt')
    })
})
