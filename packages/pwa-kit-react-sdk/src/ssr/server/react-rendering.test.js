/**
 * @jest-environment node
 */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * *
 * Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. *
 * * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* eslint-disable header/header */
import {render, ALLOWLISTED_INLINE_SCRIPTS} from './react-rendering'
import {createApp} from './express'
import request from 'supertest'
import {parse} from 'node-html-parser'
import path from 'path'

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
        sslFilePath: path.join(fixtures, 'localhost.pem')
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

    // eslint-disable-next-line react/require-render-return
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
            }
        ]
    }
})

describe('The Node SSR Environment', () => {
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
                const data = dataFromHTML(doc)
                expect(data.__DEVICE_TYPE__).toEqual('DESKTOP')
                include.forEach((s) => expect(html).toEqual(expect.stringContaining(s)))
                expect(scriptsAreSafe(doc)).toBe(true)
            }
        },
        {
            description: `rendering PWA's for tablet`,
            req: {
                url: '/pwa/',
                headers: {
                    'User-Agent': tablet
                }
            },
            assertions: (res) => {
                expect(res.statusCode).toBe(200)
                const html = res.text
                const doc = parse(html)
                const data = dataFromHTML(doc)
                expect(data.__DEVICE_TYPE__).toEqual('TABLET')
                const include = ['<div>This is a PWA</div>']
                include.forEach((s) => expect(html).toEqual(expect.stringContaining(s)))
                expect(scriptsAreSafe(doc)).toBe(true)
            }
        },
        {
            description: `rendering PWA's for mobile`,
            req: {
                url: '/pwa/',
                headers: {
                    'User-Agent': mobile
                }
            },
            assertions: (res) => {
                expect(res.statusCode).toBe(200)
                const html = res.text
                const doc = parse(html)
                const data = dataFromHTML(doc)
                expect(data.__DEVICE_TYPE__).toEqual('PHONE')
                const include = ['<div>This is a PWA</div>']
                include.forEach((s) => expect(html).toEqual(expect.stringContaining(s)))
                expect(scriptsAreSafe(doc)).toBe(true)
            }
        },
        {
            description: `rendering PWA's in mobify-server-only mode should not execute scripts on the client`,
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

                expect(data.__ERROR__.message).toEqual('Internal Server Error')
                expect(typeof data.__ERROR__.stack).toEqual('string')
                expect(data.__ERROR__.status).toEqual(500)
            }
        },
        {
            description: `Renders the error page instead if there is an error during component rendering`,
            req: {url: '/render-throws-error/'},
            assertions: (res) => {
                const html = res.text
                const doc = parse(html)
                const data = dataFromHTML(doc)

                expect(data.__ERROR__.message).toEqual('Internal Server Error')
                expect(typeof data.__ERROR__.stack).toEqual('string')
                expect(data.__ERROR__.status).toEqual(500)
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
                expect(html.includes('lang="helmet-html-attribute"')).toBe(true)
                expect(doc.querySelector('body').getAttribute('class')).toEqual(
                    'helmet-body-attribute'
                )
                expect(head.querySelector(`title`).innerHTML).toEqual('Helmet title')
                expect(head.querySelector('base').getAttribute('target')).toEqual('_blank')
                expect(
                    doc.querySelector('style').innerHTML.includes('background-color: blue;')
                ).toBe(true)
                expect(
                    doc
                        .querySelector('noscript')
                        .innerHTML.includes(
                            '<link rel="stylesheet" type="text/css" href="foo.css" />'
                        )
                ).toBe(true)
                expect(doc.querySelector('noscript').innerHTML).toEqual(
                    expect.stringContaining(
                        '<link rel="stylesheet" type="text/css" href="foo.css" />'
                    )
                )
                expect(head.querySelector('meta[name="helmet-meta-1"]')).not.toBe(null)
                expect(head.querySelector('meta[property="helmet-meta-2"]')).not.toBe(null)
                expect(head.querySelector('link[rel="helmet-link-1"]')).not.toBe(null)
                expect(head.querySelector('link[rel="helmet-link-2"]')).not.toBe(null)
                expect(head.querySelector('script[src="http://include.com/pathtojs.js"]')).not.toBe(
                    null
                )
                expect(
                    head
                        .querySelector('script[type="application/ld+json"]')
                        .innerHTML.includes(`"@context": "http://schema.org"`)
                ).toBe(true)
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
        }
    ]

    cases.forEach(({description, req, assertions}) => {
        test(`renders PWA pages properly (${description})`, () => {
            const {url, headers, query} = req
            const app = createApp(opts())
            app.get('/*', render)
            return request(app)
                .get(url)
                .set(headers || {})
                .query(query || {})
                .then((res) => assertions(res))
        })
    })
})
