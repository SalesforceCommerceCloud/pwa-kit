/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

/* global jest expect */
/* eslint-env jest */
/* eslint import/no-commonjs:0 */
/* eslint max-nested-callbacks:0 */

const sinon = require('sinon')

import {
    AGENT_OPTIONS_TO_COPY,
    CachedResponse,
    escapeJSText,
    getFullRequestURL,
    MetricsSender,
    outgoingRequestHook,
    parseCacheControl,
    parseEndParameters,
    PerformanceTimer,
    processExpressResponse,
    processLambdaResponse,
    updateGlobalAgentOptions,
    wrapResponseWrite,
    detectDeviceType,
    DESKTOP,
    PHONE,
    TABLET
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
    APPLICATION_OCTET_STREAM,
    PROXY_PATH_PREFIX
} from '../ssr/server/constants'

const baseMobify = {
    pageNotFoundURL: '/page-not-found',
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

const userAgents = {
    phone: {
        iphone5orSE:
            'Mozilla/5.0 (iPhone; CPU iPhone OS 10_3_1 like Mac OS X) AppleWebKit/603.1.30 (KHTML, like Gecko) Version/10.0 Mobile/14E304 Safari/602.1',
        iphone6or7or8:
            'Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1',
        iphone6or7or8plus:
            'Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1',
        iphoneX:
            'Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1',
        nexus4:
            'Mozilla/5.0 (Linux; Android 4.4.2; Nexus 4 Build/KOT49H) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3598.0 Mobile Safari/537.36',
        nexus5:
            'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3598.0 Mobile Safari/537.36',
        nexus6:
            'Mozilla/5.0 (Linux; Android 7.1.1; Nexus 6 Build/N6F26U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3598.0 Mobile Safari/537.36',
        galaxyS5:
            'Mozilla/5.0 (Linux; Android 5.0; SM-G900P Build/LRX21T) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3598.0 Mobile Safari/537.36',
        pixel2:
            'Mozilla/5.0 (Linux; Android 8.0; Pixel 2 Build/OPD3.170816.012) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3598.0 Mobile Safari/537.36',
        pixel2XL:
            'Mozilla/5.0 (Linux; Android 8.0.0; Pixel 2 XL Build/OPD1.170816.004) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3598.0 Mobile Safari/537.36'
    },
    tablet: {
        nexus7:
            'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 7 Build/MOB30X) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3598.0 Safari/537.36',
        nexus10:
            'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 10 Build/MOB31T) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3598.0 Safari/537.36',
        ipad:
            'Mozilla/5.0 (iPad; CPU OS 11_0 like Mac OS X) AppleWebKit/604.1.34 (KHTML, like Gecko) Version/11.0 Mobile/15A5341f Safari/604.1',
        ipadAir:
            'Mozilla/5.0 (iPad; CPU OS 11_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/11.0 Mobile/15E148 Safari/604.1',
        ipadPro:
            'Mozilla/5.0 (iPad; CPU OS 11_0 like Mac OS X) AppleWebKit/604.1.34 (KHTML, like Gecko) Version/11.0 Mobile/15A5341f Safari/604.1'
    },
    desktop: {
        chrome72:
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3598.0 Safari/537.36',
        firefox63:
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.13; rv:63.0) Gecko/20100101 Firefox/63.0',
        safari11:
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/11.1.2 Safari/605.1.15',
        edge17:
            'Mozilla/5.0 (Windows NT 10.0; WebView/3.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.140 Safari/537.36 Edge/17.17134',
        ie11: 'Mozilla/5.0 (Windows NT 6.3; Trident/7.0; rv:11.0) like Gecko'
    }
}

let consoleLog
let consoleWarn
let consoleError

const sandbox = sinon.sandbox.create()
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
        expect(getFullRequestURL('https://a.b/c')).toEqual('https://a.b/c')

        expect(() => getFullRequestURL('/somepath')).toThrow()

        updatePackageMobify(baseMobify)

        expect(getFullRequestURL(`${PROXY_PATH_PREFIX}/base/somepath`)).toEqual(
            'https://www.merlinspotions.com/somepath'
        )

        expect(getFullRequestURL(`${PROXY_PATH_PREFIX}/base2/somepath`)).toEqual(
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
                    expect(proxyConfigs.length).toBe(inputConfigs.length)
                    for (let i = 0; i < inputConfigs.length; i++) {
                        expect(proxyConfigs[i].protocol).toEqual(inputConfigs[i].protocol)
                        expect(proxyConfigs[i].host).toEqual(inputConfigs[i].host)
                        expect(proxyConfigs[i].path).toEqual(inputConfigs[i].path)
                        expect(proxyConfigs[i].proxyPath).toEqual(
                            `/mobify/proxy/${inputConfigs[i].path}`
                        )
                        expect(proxyConfigs[i].cachingPath).toEqual(
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
                    expect(proxyConfigs.length).toBe(3)
                    expect(
                        proxyConfigs.every((config) => config.protocol === 'http'),
                        'Expected all configs to be http'
                    ).toBe(true)
                    expect(proxyConfigs[0].host).toEqual('somewhere.else')
                    expect(proxyConfigs[1].host).toEqual('another.place')
                    expect(proxyConfigs[2].host).toEqual('far.away')
                    expect(proxyConfigs[0].path).toEqual('base')
                    expect(proxyConfigs[1].path).toEqual('base9')
                    expect(proxyConfigs[2].path).toEqual('base8')
                    expect(proxyConfigs[0].proxyPath).toEqual('/mobify/proxy/base')
                    expect(proxyConfigs[1].proxyPath).toEqual('/mobify/proxy/base9')
                    expect(proxyConfigs[2].proxyPath).toEqual('/mobify/proxy/base8')
                    expect(proxyConfigs[0].cachingPath).toEqual('/mobify/caching/base')
                    expect(proxyConfigs[1].cachingPath).toEqual('/mobify/caching/base9')
                    expect(proxyConfigs[2].cachingPath).toEqual('/mobify/caching/base8')
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
                    expect(proxyConfigs.length).toBe(inputConfigs.length)
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
                        proxyConfigs: Array.apply(
                            // eslint-disable-line prefer-spread
                            null,
                            {length: MAX_PROXY_CONFIGS + 1}
                        )
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
                    expect(proxyConfigs.length).toBe(0)
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
            test(testCase.name, () => {
                const newMobify = Object.assign({}, baseMobify, testCase.mobify || {})

                if (testCase.environment) {
                    Object.entries(testCase.environment).forEach(([key, value]) => {
                        process.env[key] = value
                    })
                }

                if (testCase.validate) {
                    updatePackageMobify(newMobify)
                    testCase.validate(getPackageMobify())
                } else {
                    expect(() => updatePackageMobify(newMobify)).toThrow()
                }
            })
        )
    })

    describe('detectDeviceType', () => {
        const tests = [
            // Test all mobile user agents
            ...Object.keys(userAgents.phone).map((key) => ({
                name: `test for user agent key ${key}`,
                headers: {'user-agent': userAgents.phone[key]},
                expected: PHONE
            })),

            // Test all tablet user agents
            ...Object.keys(userAgents.tablet).map((key) => ({
                name: `test for user agent key ${key}`,
                headers: {'user-agent': userAgents.tablet[key]},
                expected: TABLET
            })),

            // Test all desktop user agents
            ...Object.keys(userAgents.desktop).map((key) => ({
                name: `test for user agent key ${key}`,
                headers: {'user-agent': userAgents.desktop[key]},
                expected: DESKTOP
            })),
            {
                name: 'iphone CloudFront header',
                headers: {
                    'CloudFront-Is-Mobile-Viewer': 'true'
                },
                expected: PHONE
            },
            {
                name: 'ipad CloudFront header',
                headers: {
                    'CloudFront-Is-Mobile-Viewer': 'true', // Tablets are also mobile devices
                    'CloudFront-Is-Tablet-Viewer': 'true'
                },
                expected: TABLET
            },
            {
                name: 'desktop CloudFront header',
                headers: {
                    'CloudFront-Is-Desktop-Viewer': 'true'
                },
                expected: DESKTOP
            }
        ]

        tests.forEach((testConfig) => {
            test(`detectDeviceTypes (${testConfig.name})`, () => {
                const req = {
                    get: (key) => testConfig.headers[key],
                    query: {}
                }
                expect(detectDeviceType(req)).toEqual(testConfig.expected)
            })
        })

        test('should allow users to force a device type, using the "mobify_devicetype" query param', () => {
            const headers = {'user-agent': userAgents.phone.iphoneX}
            const req = {
                get: (key) => headers[key],
                query: {
                    mobify_devicetype: TABLET
                }
            }
            expect(detectDeviceType(req)).toEqual(TABLET)
        })
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
    expect(escapeJSText()).toEqual(undefined)
    expect(escapeJSText('</script>')).toEqual('\\x3c\\x2fscript>')
})

describe('MetricsSender', () => {
    const sandbox = sinon.sandbox.create()

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
            expect(calledParams.length).toBe(expected.length)
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
            const expectedAttempts = sender._retries

            // Expect that we retried the correct number of times
            expect(sender._CW.putMetricData.callCount).toBe(expectedAttempts)

            // Expect that there was a console warning for each retry
            expect(consoleWarn.callCount).toBe(expectedAttempts)

            // Expect that the MetricsSender is now empty
            expect(sender.queueLength).toBe(0)
        })
    })

    test('MetricsSender is a singleton', () => {
        MetricsSender._instance = null
        const sender = MetricsSender.getSender()
        expect(MetricsSender.getSender()).toBe(sender)
    })
})

test('processLambdaResponse with no parameter', () => {
    expect(processLambdaResponse()).toBeUndefined()
    expect(processLambdaResponse(null)).toBe(null)
})

describe('processExpressResponse', () => {
    const testCases = [
        {
            name: 'no change',
            headers: {
                [CONTENT_TYPE]: 'text/plain'
            },
            validate: (headers) => {
                expect(headers[CONTENT_TYPE]).toEqual('text/plain')
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
                expect(headers[CONTENT_ENCODING]).toEqual('gzip')
                expect(headers[X_ORIGINAL_CONTENT_TYPE]).toEqual('text/plain')
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
                expect(headers[CONTENT_ENCODING]).toEqual('gzip')
                expect(headers[X_ORIGINAL_CONTENT_TYPE]).toEqual('text/plain')
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
    const sandbox = sinon.sandbox.create()
    const mockRequest = sandbox.stub()

    beforeEach(() => {
        mockRequest.reset()
    })

    const appHost = 'localhost:3444'
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
        const hook = outgoingRequestHook(mockRequest, () => null)
        const args = ['a', {a: 123}, () => false]
        hook(...args)
        expect(mockRequest.calledWith(...args)).toBe(true)
    })

    test('fall-though when no access key', () => {
        const hook = outgoingRequestHook(mockRequest, () => appHost)
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
            hostname: appHost,
            expectHeader: true
        }
    ]

    const testMethods = ['url', 'host', 'hostname']

    const withHeaders = [true, false]
    const withCallback = withHeaders

    const testCases = []
    baseTestCases.forEach((baseTestCase) =>
        testMethods.forEach((testMethod) =>
            withHeaders.forEach((addHeaders) =>
                withCallback.forEach((addCallback) => {
                    const testCase = {...baseTestCase}
                    testCase.name =
                        `${testCase.name} via ${testMethod} ` +
                        `${addHeaders ? 'with' : 'without'} headers, ` +
                        `${addCallback ? 'with' : 'without'} callback`
                    testCase.testMethod = testMethod
                    testCase.addHeaders = addHeaders
                    testCase.addCallback = addCallback
                    testCases.push(testCase)
                })
            )
        )
    )

    testCases.forEach((testCase) =>
        test(testCase.name, () => {
            const hook = outgoingRequestHook(mockRequest, () => appHost)

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
                expect(url).toEqual(`//${testCase.hostname}`)
            }

            let calledOptions
            if (optionsPushed || testCase.expectHeader) {
                calledOptions = called.shift()
            }

            const calledHeaders = calledOptions && calledOptions.headers
            if (testCase.addHeaders) {
                expect(calledHeaders).toBeDefined()
                expect(calledHeaders['x-extra']).toEqual('123')
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
        expect(to.options.xyzzy).toEqual(1)
        Object.entries(from.options).forEach(([key, value]) =>
            expect(to.options[key]).toEqual(value)
        )
    })
})

describe('PerformanceTimer tests', () => {
    const timeFailureTest = test('time() function', () => {
        const timer = new PerformanceTimer(timeFailureTest.description)
        const func = sinon.stub()
        timer.time('test1', func, 1)
        expect(func.callCount).toBe(1)
        expect(func.calledWith(1)).toBe(true)

        func.reset()
        func.throws('Error', 'intentional error')
        expect(() => timer.time('test2', func, 1)).toThrow('intentional error')
        expect(func.callCount).toBe(1)
        timer._observer.disconnect()
    })

    const timerTest = test('start() and end()', () => {
        const timer = new PerformanceTimer(timerTest.description)

        return new Promise((resolve) => {
            timer.start('test3')
            setTimeout(resolve, 10)
        })
            .then(() => timer.end('test3'))
            .then(() => {
                const summary = timer.summary
                expect(summary.length).toBe(1)
                const entry = summary[0]
                expect(entry.name).toEqual('test3')
                expect(entry.duration).toBeGreaterThanOrEqual(5)
                expect(entry.duration).toBeLessThanOrEqual(30)
                timer._observer.disconnect()
            })
    })

    const idTest = test('operationId tests', () => {
        const timer = new PerformanceTimer(idTest.description)
        expect(timer.operationId).toBe(1)
        expect(timer.operationId).toBe(2)
        timer._observer.disconnect()
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
        expect(result['max-age']).toEqual('123')
    })

    test('parses s-maxage', () => {
        const result = parseCacheControl('s-maxage=123, nocache, nostore, must-revalidate')
        expect(result).toBeDefined()
        expect(result['max-age']).toBeUndefined()
        expect(result['s-maxage']).toEqual('123')
    })

    test('parses max-age and s-maxage', () => {
        const result = parseCacheControl(
            's-maxage=123, nocache, max-age=456, nostore, must-revalidate'
        )
        expect(result).toBeDefined()
        expect(result['max-age']).toEqual('456')
        expect(result['s-maxage']).toEqual('123')
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
        expect(chunks.length).toEqual(1)
        expect(chunks[0].toString()).toEqual('12345')
        expect(write.calledWith('12345'))
        write.reset()

        // String with encoding
        response.write('67890', 'utf-8')
        expect(chunks.length).toEqual(2)
        expect(chunks[1].toString()).toEqual('67890')
        expect(write.calledWith('12345', 'utf-8'))
        write.reset()

        // Buffer
        const chunk1 = Buffer.from('abcde')
        response.write(chunk1)
        expect(chunks.length).toEqual(3)
        expect(chunks[2].toString()).toEqual('abcde')
        expect(write.calledWith(chunk1))
        write.reset()

        expect(() => response.write({})).toThrow('unexpected type')
    })
})

describe('CachedResponse', () => {
    test('Empty create', () => {
        const cached = new CachedResponse({})
        expect(cached.found).toBe(false)
        expect(cached.data).toBeUndefined()
        expect(cached.status).toEqual(200)
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
        expect(cached.key).toEqual('key')
        expect(cached.namespace).toEqual('namespace')
        expect(cached.data).toEqual(entry.data)
        expect(cached.headers).toEqual(entry.metadata.headers)
        expect(cached.status).toEqual(201)
        expect(cached.expiration).toEqual(new Date(entry.expiration))
    })
})
