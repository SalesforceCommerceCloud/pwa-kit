/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// TODO: The methods tested in this file have been split from one file into
// multiple, so the tests should be split into multiple files as well.

// TODO: There are a lot batched tests with conditional assertions. Can they be
// split into smaller batches or otherwise refactored to avoid the conditionals?
/* eslint-disable jest/no-conditional-expect */

import sinon from 'sinon'

import {
    AGENT_OPTIONS_TO_COPY,
    CachedResponse,
    escapeJSText,
    getFullRequestURL,
    MetricsSender,
    outgoingRequestHook,
    parseCacheControl,
    parseEndParameters,
    processExpressResponse,
    processLambdaResponse,
    updateGlobalAgentOptions,
    wrapResponseWrite
} from './ssr-server'

import {
    getPackageMobify,
    getSSRParameters,
    proxyConfigs,
    reset,
    ssrFiles,
    updatePackageMobify,
    MAX_PROXY_CONFIGS
} from './ssr-shared'

import {
    CONTENT_ENCODING,
    CONTENT_TYPE,
    X_ORIGINAL_CONTENT_TYPE,
    APPLICATION_OCTET_STREAM
} from '../ssr/server/constants'

import {proxyBasePath} from './ssr-namespace-paths'

const baseMobify = {
    ssrEnabled: true,
    ssrOnly: ['main.js.map', 'ssr.js', 'ssr.js.map', 'vendor.js.map'],
    ssrShared: ['main.{js,css}', '!**/no-op.*', 'ssr-loader.js', 'vendor.js*', 'worker.js'],
    ssrParameters: {
        proxyConfigs: [
            {
                protocol: 'https',
                host: 'www.merlinspotions.com',
                path: 'base'
            },
            {
                protocol: 'https',
                host: 'api.merlinspotions.com',
                path: 'base2',
                caching: true
            }
        ]
    }
}

let consoleLog
let consoleWarn
let consoleError

const sandbox = sinon.createSandbox()
const originalConsoleLog = console.log
const originalConsoleWarn = console.warn
const originalConsoleError = console.error

beforeAll(() =>
    console.log(`
NOTICE: Console log, warn and error have been suppressed in these tests!

They are suppressed because the tests themselves produce large amounts
of logs. You may un-suppress console log, warn and error by commenting
out their suppression in the utils/ssr-server.test.js
`)
)

// You can comment out the `beforeEach()` and `afterAll()` below to
// unsuppress console logs, warnings and errors
beforeEach(() => {
    // Suppress test console logs
    consoleLog = sandbox.spy()
    console.log = consoleLog

    // Suppress test console warns
    consoleWarn = sandbox.spy()
    console.warn = consoleWarn

    // Suppress test console errors
    consoleError = sandbox.spy()
    console.error = consoleError
})

afterAll(() => {
    console.log = originalConsoleLog
    console.warn = originalConsoleWarn
    console.error = originalConsoleError
})

describe('utils/ssr-server tests', () => {
    test('getFullRequestURL', () => {
        expect(getFullRequestURL('https://a.b/c')).toBe('https://a.b/c')

        expect(() => getFullRequestURL('/somepath')).toThrow()

        updatePackageMobify(baseMobify)

        expect(getFullRequestURL(`${proxyBasePath}/base/somepath`)).toBe(
            'https://www.merlinspotions.com/somepath'
        )

        expect(getFullRequestURL(`${proxyBasePath}/base2/somepath`)).toBe(
            'https://api.merlinspotions.com/somepath'
        )
    })

    describe('updatePackageMobify tests', () => {
        afterEach(() => {
            // Clear environment of overrides
            for (let i = 1; i <= 9; i++) {
                delete process.env[`SSR_PROXY${i}`]
            }
        })

        const testCases = [
            {
                name: 'new format proxy configs',
                mobify: {},
                validate: () => {
                    const inputConfigs = baseMobify.ssrParameters.proxyConfigs
                    expect(proxyConfigs).toHaveLength(inputConfigs.length)
                    for (let i = 0; i < inputConfigs.length; i++) {
                        expect(proxyConfigs[i].protocol).toEqual(inputConfigs[i].protocol)
                        expect(proxyConfigs[i].host).toEqual(inputConfigs[i].host)
                        expect(proxyConfigs[i].path).toEqual(inputConfigs[i].path)
                        expect(proxyConfigs[i].proxyPath).toBe(
                            `/mobify/proxy/${inputConfigs[i].path}`
                        )
                        expect(proxyConfigs[i].cachingPath).toBe(
                            `/mobify/caching/${inputConfigs[i].path}`
                        )
                    }
                }
            },
            {
                name: 'new format proxy configs with overrides',
                mobify: {
                    ssrParameters: {
                        proxyConfigs: [
                            {
                                protocol: 'https',
                                host: 'www.merlinspotions.com'
                            },
                            {
                                protocol: 'https',
                                host: 'api.merlinspotions.com',
                                caching: true
                            },
                            {
                                host: 'extra.merlinspotions.com',
                                path: 'base3'
                            }
                        ]
                    }
                },
                environment: {
                    SSR_PROXY1: 'http://somewhere.else',
                    SSR_PROXY2: 'http://another.place/base9',
                    SSR_PROXY3: 'http://far.away/base8/caching'
                },
                validate: () => {
                    expect(proxyConfigs).toHaveLength(3)
                    expect(proxyConfigs.every((config) => config.protocol === 'http')).toBe(true)
                    expect(proxyConfigs[0].host).toBe('somewhere.else')
                    expect(proxyConfigs[1].host).toBe('another.place')
                    expect(proxyConfigs[2].host).toBe('far.away')
                    expect(proxyConfigs[0].path).toBe('base')
                    expect(proxyConfigs[1].path).toBe('base9')
                    expect(proxyConfigs[2].path).toBe('base8')
                    expect(proxyConfigs[0].proxyPath).toBe('/mobify/proxy/base')
                    expect(proxyConfigs[1].proxyPath).toBe('/mobify/proxy/base9')
                    expect(proxyConfigs[2].proxyPath).toBe('/mobify/proxy/base8')
                    expect(proxyConfigs[0].cachingPath).toBe('/mobify/caching/base')
                    expect(proxyConfigs[1].cachingPath).toBe('/mobify/caching/base9')
                    expect(proxyConfigs[2].cachingPath).toBe('/mobify/caching/base8')
                }
            },
            {
                name: 'old format proxy configs',
                mobify: {
                    ssrParameters: {
                        proxyProtocol1: 'https',
                        proxyHost1: 'www.merlinspotions.com',
                        proxyPath1: 'base',
                        proxyProtocol2: 'https',
                        proxyHost2: 'api.merlinspotions.com',
                        proxyPath2: 'base2'
                    }
                },
                validate: () => {
                    const inputConfigs = baseMobify.ssrParameters.proxyConfigs
                    expect(proxyConfigs).toHaveLength(inputConfigs.length)
                    for (let i = 0; i < inputConfigs.length; i++) {
                        expect(proxyConfigs[i].protocol).toEqual(inputConfigs[i].protocol)
                        expect(proxyConfigs[i].host).toEqual(inputConfigs[i].host)
                        expect(proxyConfigs[i].path).toEqual(inputConfigs[i].path)
                    }
                }
            },
            {
                name: 'too many proxy configs',
                mobify: {
                    ssrParameters: {
                        // Create an array that is one entry too long
                        proxyConfigs: Array.apply(null, {length: MAX_PROXY_CONFIGS + 1})
                            .map(Number.call, Number)
                            .map((index) => ({
                                host: `www.${index}.com`
                            }))
                    }
                }
            },
            {
                name: 'no proxy configs',
                mobify: {
                    ssrParameters: {}
                },
                validate: () => {
                    expect(proxyConfigs).toHaveLength(0)
                }
            },
            {
                name: 'conflicting proxy configs',
                mobify: {
                    ssrParameters: {
                        proxyProtocol1: 'https',
                        proxyHost1: 'www.merlinspotions.com',
                        proxyPath1: 'base',
                        proxyConfigs: [
                            {
                                protocol: 'https',
                                host: 'www.merlinspotions.com',
                                path: 'base'
                            }
                        ]
                    }
                }
            },
            {
                name: 'bad protocol',
                mobify: {
                    ssrParameters: {
                        proxyConfigs: [
                            {
                                protocol: 'file'
                            }
                        ]
                    }
                }
            },
            {
                name: 'missing host',
                mobify: {
                    ssrParameters: {
                        proxyConfigs: [
                            {
                                protocol: 'https'
                            }
                        ]
                    }
                }
            },
            {
                name: 'duplicate path',
                mobify: {
                    ssrParameters: {
                        proxyConfigs: [
                            {
                                protocol: 'https',
                                host: '1.com',
                                path: 'base'
                            },
                            {
                                protocol: 'https',
                                host: '2.com',
                                path: 'base'
                            }
                        ]
                    }
                }
            }
        ]

        testCases.forEach((testCase) =>
            test(`${testCase.name}`, () => {
                const newMobify = Object.assign({}, baseMobify, testCase.mobify || {})

                if (testCase.environment) {
                    Object.entries(testCase.environment).forEach(([key, value]) => {
                        process.env[key] = value
                    })
                }

                if (testCase.validate) {
                    updatePackageMobify(newMobify)
                    testCase.validate(getPackageMobify())
                    return
                }
                expect(() => updatePackageMobify(newMobify)).toThrow()
            })
        )
    })
})

describe('utils/ssr-shared tests', () => {
    beforeEach(reset)

    test('Initial setup', () => {
        expect(getPackageMobify()).toEqual({})
        expect(getSSRParameters()).toEqual({})

        updatePackageMobify()
        expect(getPackageMobify()).toEqual({})
        expect(getSSRParameters()).toEqual({})
    })

    test('Mobify update works', () => {
        updatePackageMobify(baseMobify)
        expect(getPackageMobify()).toEqual(baseMobify)
        expect(getSSRParameters()).toEqual(baseMobify.ssrParameters)
    })

    test('Mobify update validates and sets proxies', () => {
        const mobify = Object.assign({}, baseMobify)
        mobify.ssrParameters = {}

        updatePackageMobify(mobify)
        expect(getSSRParameters()).toEqual(mobify.ssrParameters)
        expect(proxyConfigs).toEqual([])

        mobify.ssrParameters = {
            proxyHost1: '1.merlinspotions.com',
            proxyHost2: '2.merlinspotions.com'
        }

        updatePackageMobify(mobify)
        expect(getSSRParameters()).toEqual(mobify.ssrParameters)
        expect(proxyConfigs).toEqual([
            {
                protocol: 'https',
                host: '1.merlinspotions.com',
                path: 'base',
                proxyPath: '/mobify/proxy/base',
                cachingPath: '/mobify/caching/base'
            },
            {
                protocol: 'https',
                host: '2.merlinspotions.com',
                path: 'base2',
                proxyPath: '/mobify/proxy/base2',
                cachingPath: '/mobify/caching/base2'
            }
        ])

        mobify.ssrParameters.proxyConfigs = [
            {
                host: '3.merlinspotions.com'
            }
        ]
        expect(() => updatePackageMobify(mobify)).toThrow(
            'Cannot use both proxyConfigs and old proxy declarations'
        )

        mobify.ssrParameters.proxyConfigs = [
            {
                protocol: 'file',
                host: '4.merlinspotions.com'
            }
        ]
        mobify.ssrParameters.proxyHost1 = undefined
        mobify.ssrParameters.proxyHost2 = undefined
        expect(() => updatePackageMobify(mobify)).toThrow('has invalid protocol')
    })

    test('Mobify update sets ssrFiles', () => {
        const mobify = Object.assign({}, baseMobify)
        mobify.ssrShared = mobify.ssrOnly = undefined

        updatePackageMobify(mobify)
        expect(ssrFiles).toEqual([])

        mobify.ssrShared = ['main.js']
        updatePackageMobify(mobify)
        expect(ssrFiles).toEqual(['main.js'])

        mobify.ssrOnly = ['ssr.js']
        updatePackageMobify(mobify)
        expect(ssrFiles).toEqual(['ssr.js', 'main.js'])
    })
})

test('escapeJSText', () => {
    expect(escapeJSText()).toBeUndefined()
    expect(escapeJSText('</script>')).toBe('\\x3c\\x2fscript>')
})

describe('MetricsSender', () => {
    const sandbox = sinon.createSandbox()

    afterEach(() => {
        sandbox.restore()
    })

    test('MetricsSender.send', () => {
        const sender = MetricsSender.getSender()
        const now = new Date()
        const nowISO = now.toISOString()
        const metrics1 = [
            {
                name: 'abc',
                value: 123,
                timestamp: now
            },
            {
                name: 'def',
                dimensions: {
                    project: 'whatever',
                    xyzzy: 'plugh'
                },
                timestamp: now
            }
        ]
        const metrics2 = [
            {
                name: 'xyz',
                value: 1.23,
                timestamp: now
            }
        ]
        const metrics3 = []

        // Add metrics until we get enough to cause multiple batches to
        // be sent.
        while (metrics1.length + metrics2.length + metrics3.length < 30) {
            metrics3.push({
                name: 'whatever',
                value: Date.now(),
                timestamp: now
            })
        }

        // Set up a fake CloudWatch client
        const calledParams = []
        let callCount = 0
        sender._CW = {
            putMetricData: (params, callback) => {
                callCount += 1
                // This returns a fake error on the first call, and then
                // accepts all subsequent calls.
                const err = calledParams.length ? null : new Error('imaginary error')
                params.MetricData.forEach((metric) => calledParams.push(metric))
                callback(err, null)
            }
        }

        // Send the params.
        sender.send(metrics1)
        sender.send(metrics2)
        sender.send(metrics3)
        expect(sender.queueLength).toEqual(metrics1.length + metrics2.length + metrics3.length)
        return sender.flush().then(() => {
            // Expect that the MetricsSender is now empty
            expect(sender.queueLength).toBe(0)

            // Expect that there was a console warning
            expect(consoleWarn.called).toBe(true)

            // Expect that two batches were sent
            expect(callCount).toBe(2)

            // Expect that the correct values were sent
            const expected = metrics1.concat(metrics2).concat(metrics3)
            expect(calledParams).toHaveLength(expected.length)
            expected.forEach((metric, index) => {
                const actual = calledParams[index]
                expect(actual).toBeDefined()
                expect(actual.MetricName).toEqual(metric.name)
                expect(actual.Value).toEqual(metric.value || 0)
                expect(actual.Timestamp).toEqual(nowISO)

                if (metric.dimensions) {
                    expect(actual.Dimensions).toBeDefined()
                    actual.Dimensions.forEach((dimension) => {
                        expect(dimension.Value).toEqual(metric.dimensions[dimension.Name])
                    })
                }
            })
        })
    })

    test('MetricsSender.throttling', () => {
        const sender = MetricsSender.getSender()
        const now = new Date()
        const metrics1 = [
            {
                name: 'abc',
                value: 123,
                timestamp: now
            },
            {
                name: 'def',
                dimensions: {
                    project: 'whatever',
                    xyzzy: 'plugh'
                },
                timestamp: now
            }
        ]

        // Set up a fake CloudWatch client that will return a Throttling
        // error every time it's called.
        sender._CW = {
            putMetricData: (params, callback) => {
                const err = new Error('Throttled')
                err.code = 'Throttling'
                callback(err)
            }
        }

        // Allow spying on the putMetricData calls
        sender._CW.putMetricData = sandbox.spy(sender._CW, 'putMetricData')

        // Send the params.
        sender.send(metrics1)
        expect(sender.queueLength).toEqual(metrics1.length)
        return sender.flush().then(() => {
            // Expect that we retried the correct number of times
            expect(sender._CW.putMetricData.callCount).toBe(1)
            expect(sender.queueLength).toBe(0)
        })
    })

    test('MetricsSender is a singleton', () => {
        MetricsSender._instance = null
        const sender = MetricsSender.getSender()
        expect(MetricsSender.getSender()).toBe(sender)
    })
})

describe('processLambdaResponse', () => {
    test('processLambdaResponse with no parameter', () => {
        expect(processLambdaResponse()).toBeUndefined()
        expect(processLambdaResponse(null)).toBeNull()
    })

    const testCases = [
        {
            name: 'valid correlation id header in event object',
            event: {headers: {'x-correlation-id': 'e46cd109-39b7-4173-963e-2c5de78ba087'}},
            validate: (headers) => {
                expect(headers['x-correlation-id']).toBe('e46cd109-39b7-4173-963e-2c5de78ba087')
            }
        },
        {
            name: 'no correlation id header in event object',
            event: {headers: {}},
            validate: (headers) => {
                expect(headers['x-correlation-id']).toBeFalsy()
            }
        }
    ]
    testCases.forEach((testCase) => {
        test(`${testCase.name}`, () => {
            const response = {}
            const res = processLambdaResponse(response, testCase.event)
            testCase.validate(res.headers)
        })
    })
})

describe('processExpressResponse', () => {
    const testCases = [
        {
            name: 'no change',
            headers: {
                [CONTENT_TYPE]: 'text/plain'
            },
            validate: (headers) => {
                expect(headers[CONTENT_TYPE]).toBe('text/plain')
                expect(headers[X_ORIGINAL_CONTENT_TYPE]).toBeFalsy()
            }
        },
        {
            name: 'flip content-type',
            headers: {
                [CONTENT_TYPE]: 'text/plain',
                [CONTENT_ENCODING]: 'gzip'
            },
            validate: (headers) => {
                expect(headers[CONTENT_TYPE]).toEqual(APPLICATION_OCTET_STREAM)
                expect(headers[CONTENT_ENCODING]).toBe('gzip')
                expect(headers[X_ORIGINAL_CONTENT_TYPE]).toBe('text/plain')
            }
        },
        {
            name: 'already flipped',
            headers: {
                [CONTENT_TYPE]: APPLICATION_OCTET_STREAM,
                [CONTENT_ENCODING]: 'gzip',
                [X_ORIGINAL_CONTENT_TYPE]: 'text/plain'
            },
            validate: (headers) => {
                expect(headers[CONTENT_TYPE]).toEqual(APPLICATION_OCTET_STREAM)
                expect(headers[CONTENT_ENCODING]).toBe('gzip')
                expect(headers[X_ORIGINAL_CONTENT_TYPE]).toBe('text/plain')
            }
        }
    ]

    const responseTypes = [
        {
            name: 'http.ServerResponse',
            create: (headers) => ({
                getHeader: (header) => headers[header],
                setHeader: (header, value) => {
                    headers[header] = value
                }
            })
        },
        {
            name: 'http.IncomingMessage',
            create: (headers) => ({headers})
        }
    ]

    responseTypes.forEach((responseType) =>
        testCases.forEach((testCase) =>
            // eslint-disable-next-line jest/expect-expect
            test(`${testCase.name} (${responseType.name})`, () => {
                const headers = Object.assign({}, testCase.headers)
                const response = responseType.create(headers)
                processExpressResponse(response)
                testCase.validate(headers)
            })
        )
    )

    test('null response', () => {
        expect(processExpressResponse()).toBeUndefined()
    })
})

describe('outgoingRequestHook tests', () => {
    const sandbox = sinon.createSandbox()
    const mockRequest = sandbox.stub()

    beforeEach(() => {
        mockRequest.reset()
    })

    const appHostname = 'localhost:3444'
    const otherHost = 'somewhere.com'
    const accessKey = 'abcdefghijklm'
    const fakeCallback = () => false

    test('fall-through when no getAppHost', () => {
        const hook = outgoingRequestHook(mockRequest)
        const args = ['a', {a: 123}, () => false]
        hook(...args)
        expect(mockRequest.calledWith(...args)).toBe(true)
    })

    test('fall-though when empty appHost', () => {
        const hook = outgoingRequestHook(mockRequest, {})
        const args = ['a', {a: 123}, () => false]
        hook(...args)
        expect(mockRequest.calledWith(...args)).toBe(true)
    })

    test('fall-though when no access key', () => {
        const hook = outgoingRequestHook(mockRequest, {appHostname})
        const args = ['a', {a: 123}, () => false]
        process.env.X_MOBIFY_ACCESS_KEY = undefined
        hook(...args)
        expect(mockRequest.calledWith(...args)).toBe(true)
    })

    const baseTestCases = [
        {
            name: 'non-loopback',
            hostname: otherHost,
            expectHeader: false
        },
        {
            name: 'loopback',
            hostname: appHostname,
            expectHeader: true
        }
    ]

    const testMethods = ['url', 'host', 'hostname']

    const withHeaders = [true, false]
    const withCallback = withHeaders
    const withProxyKeepAliveAgent = withCallback

    const testCases = []
    baseTestCases.forEach((baseTestCase) =>
        testMethods.forEach((testMethod) =>
            withHeaders.forEach((addHeaders) =>
                withCallback.forEach((addCallback) => {
                    withProxyKeepAliveAgent.forEach((addProxyKeepAliveAgent) => {
                        const testCase = {...baseTestCase}
                        testCase.name =
                            `${testCase.name} via ${testMethod} ` +
                            `${addHeaders ? 'with' : 'without'} headers, ` +
                            `${addCallback ? 'with' : 'without'} callback, ` +
                            `${addProxyKeepAliveAgent ? 'with' : 'without'} KeepAliveAgent`
                        testCase.testMethod = testMethod
                        testCase.addHeaders = addHeaders
                        testCase.addCallback = addCallback
                        testCase.addProxyKeepAliveAgent = addProxyKeepAliveAgent
                        testCases.push(testCase)
                    })
                })
            )
        )
    )

    testCases.forEach((testCase) =>
        test(`${testCase.name}`, () => {
            const createAppOptions = {appHostname}

            createAppOptions.proxyKeepAliveAgent = testCase.addProxyKeepAliveAgent

            const hook = outgoingRequestHook(mockRequest, createAppOptions)

            const args = []
            const hookOptions = {}
            let expectUrl
            let optionsPushed = false
            switch (testCase.testMethod) {
                case 'url':
                    args.push(`//${testCase.hostname}`)
                    expectUrl = true
                    break
                case 'host':
                    hookOptions.host = testCase.hostname
                    args.push(hookOptions)
                    optionsPushed = true
                    break
                case 'hostname':
                    hookOptions.hostname = testCase.hostname
                    args.push(hookOptions)
                    optionsPushed = true
                    break
                default:
                    throw new Error(`Bad testMethod ${testCase.testMethod}`)
            }

            if (testCase.addHeaders) {
                hookOptions.headers = {
                    'x-extra': '123'
                }
                if (!optionsPushed) {
                    args.push(hookOptions)
                    optionsPushed = true
                }
            }

            if (testCase.addCallback) {
                args.push(fakeCallback)
            }

            process.env.X_MOBIFY_ACCESS_KEY = accessKey
            hook(...args)
            expect(mockRequest.calledOnce).toBe(true)
            const called = mockRequest.getCall(0).args.slice()

            if (expectUrl) {
                const url = called.shift()
                expect(url).toBe(`//${testCase.hostname}`)
            }

            let calledOptions
            if (optionsPushed || testCase.expectHeader) {
                calledOptions = called.shift()
            }

            const calledHeaders = calledOptions && calledOptions.headers
            if (testCase.addHeaders) {
                expect(calledHeaders).toBeDefined()
                expect(calledHeaders['x-extra']).toBe('123')
            }

            if (testCase.expectHeader) {
                expect(calledHeaders).toBeDefined()
                expect(calledHeaders['x-mobify-access-key']).toEqual(accessKey)
            } else {
                if (calledHeaders) {
                    expect(calledHeaders['x-mobify-access-key']).toBeUndefined()
                }
            }

            if (testCase.addCallback) {
                expect(called[0]).toBe(fakeCallback)
            }

            if (testCase.name.startsWith('loopback')) {
                if (testCase.addProxyKeepAliveAgent) {
                    expect(calledOptions.agent).toBeDefined()
                    expect(calledOptions.agent.keepAlive).toBe(true)
                } else {
                    expect(calledOptions.agent).toBeUndefined()
                }
            }
        })
    )
})

describe('updateGlobalAgentOptions', () => {
    test('no-op', () => {
        const to = {
            options: {}
        }
        updateGlobalAgentOptions(undefined, to)
        expect(to.options).toEqual({})
    })

    test('overwrites', () => {
        const to = {}
        const from = {
            options: {}
        }
        AGENT_OPTIONS_TO_COPY.forEach((key) => {
            from.options[key] = key
        })
        updateGlobalAgentOptions(from, to)
        expect(to.options).toEqual(from.options)
    })

    test('preserves', () => {
        const to = {
            options: {
                xyzzy: 1
            }
        }
        const from = {
            options: {}
        }
        AGENT_OPTIONS_TO_COPY.forEach((key) => {
            from.options[key] = key
        })
        updateGlobalAgentOptions(from, to)
        expect(to.options.xyzzy).toBe(1)
        Object.entries(from.options).forEach(([key, value]) =>
            expect(to.options[key]).toEqual(value)
        )
    })
})

describe('parseCacheControl', () => {
    test('accepts undefined', () => {
        const result = parseCacheControl()
        expect(result).toBeDefined()
        expect(result['s-maxage']).toBeUndefined()
        expect(result['max-age']).toBeUndefined()
    })

    test('parses when no age values', () => {
        const result = parseCacheControl('nocache, nostore')
        expect(result).toBeDefined()
        expect(result['s-maxage']).toBeUndefined()
        expect(result['max-age']).toBeUndefined()
    })

    test('parses max-age', () => {
        const result = parseCacheControl('max-age=123, nocache, nostore, must-revalidate')
        expect(result).toBeDefined()
        expect(result['s-maxage']).toBeUndefined()
        expect(result['max-age']).toBe('123')
    })

    test('parses s-maxage', () => {
        const result = parseCacheControl('s-maxage=123, nocache, nostore, must-revalidate')
        expect(result).toBeDefined()
        expect(result['max-age']).toBeUndefined()
        expect(result['s-maxage']).toBe('123')
    })

    test('parses max-age and s-maxage', () => {
        const result = parseCacheControl(
            's-maxage=123, nocache, max-age=456, nostore, must-revalidate'
        )
        expect(result).toBeDefined()
        expect(result['max-age']).toBe('456')
        expect(result['s-maxage']).toBe('123')
    })
})

describe('parseEndParameters', () => {
    test('no parameters', () => {
        expect(parseEndParameters()).toEqual({
            data: undefined,
            encoding: undefined,
            callback: undefined
        })
    })
    test('data', () => {
        expect(parseEndParameters([123])).toEqual({
            data: 123,
            encoding: undefined,
            callback: undefined
        })
    })
    test('data, encoding', () => {
        expect(parseEndParameters([123, 456])).toEqual({
            data: 123,
            encoding: 456,
            callback: undefined
        })
    })
    test('data, callback', () => {
        const f = () => true
        expect(parseEndParameters([123, f])).toEqual({
            data: 123,
            encoding: undefined,
            callback: f
        })
    })
    test('data, encoding, callback', () => {
        const f = () => true
        expect(parseEndParameters([123, 456, f])).toEqual({
            data: 123,
            encoding: 456,
            callback: f
        })
    })
})

describe('wrapResponseWrite', () => {
    test('captures chunks', () => {
        const write = sinon.stub()
        const response = {
            locals: {
                responseCaching: {}
            },
            write
        }
        const caching = response.locals.responseCaching
        wrapResponseWrite(response)
        expect(caching.chunks).toEqual([])
        const chunks = caching.chunks

        // String without encoding
        response.write('12345')
        expect(chunks).toHaveLength(1)
        expect(chunks[0].toString()).toBe('12345')
        expect(write.calledWith('12345')).toBe(true)
        write.reset()

        // String with encoding
        response.write('67890', 'utf-8')
        expect(chunks).toHaveLength(2)
        expect(chunks[1].toString()).toBe('67890')
        expect(write.calledWith('67890', 'utf-8')).toBe(true)
        write.reset()

        // Buffer
        const chunk1 = Buffer.from('abcde')
        response.write(chunk1)
        expect(chunks).toHaveLength(3)
        expect(chunks[2].toString()).toBe('abcde')
        expect(write.calledWith(chunk1)).toBe(true)
        write.reset()

        expect(() => response.write({})).toThrow('unexpected type')
    })
})

describe('CachedResponse', () => {
    test('Empty create', () => {
        const cached = new CachedResponse({})
        expect(cached.found).toBe(false)
        expect(cached.data).toBeUndefined()
        expect(cached.status).toBe(200)
        expect(cached.headers).toEqual({})
        expect(cached.expiration).toBeUndefined()
    })

    test('Create', () => {
        const req = {a: 1}
        const res = {b: 2}
        const entry = {
            found: true,
            key: 'key',
            namespace: 'namespace',
            data: Buffer.from('123'),
            expiration: Date.now(),
            metadata: {
                status: 201,
                headers: {
                    'x-special': '1'
                }
            }
        }
        const cached = new CachedResponse({
            entry,
            req,
            res
        })
        expect(cached.found).toBe(true)
        expect(cached.key).toBe('key')
        expect(cached.namespace).toBe('namespace')
        expect(cached.data).toEqual(entry.data)
        expect(cached.headers).toEqual(entry.metadata.headers)
        expect(cached.status).toBe(201)
        expect(cached.expiration).toEqual(new Date(entry.expiration))
    })
})
