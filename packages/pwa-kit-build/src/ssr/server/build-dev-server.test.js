import {makeErrorHandler, DevServerFactory} from './build-dev-server'
import path from "path";

const TEST_PORT = 3444
const testFixtures = path.resolve(__dirname, 'test_fixtures')

const opts = (overrides = {}) => {
    const defaults = {
        buildDir: testFixtures,
        mobify: {
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
        quiet: true,
        port: TEST_PORT,
        protocol: 'https',
        enableLegacyRemoteProxying: false
    }
    return {
        ...defaults,
        ...overrides
    }
}


describe('Error handlers returned from makeErrorHandler', () => {
    const testServerErrorHandler = (error, times) => {
        const exit = jest.fn()
        const proc = {exit}
        const close = jest.fn()
        const devserver = {close}
        const log = jest.fn()
        const handler = makeErrorHandler(proc, devserver, log)
        const e = {code: error}

        handler(e)
        expect(close).toHaveBeenCalledTimes(times)
    }

    test('should exit the current process if the requested port is in use', () => {
        testServerErrorHandler('EADDRINUSE', 1)
    })

    test('should ignore errors other than EADDRINUSE', () => {
        testServerErrorHandler('EACCES', 0)
    })
})

describe('The DevServer', () => {

    // Mock methods on the DevServerFactory to skip setting
    // up Webpack's dev middleware – a massive simplification
    // for testing.
    const NoWebpackDevServerFactory = {...DevServerFactory, ...{
        addSSRRenderer() {},
        addSDKInternalHandlers() {},
        getRequestProcessor() {}
    }}

    test(`createApp validates missing or invalid field "protocol"`, () => {
        expect(() => NoWebpackDevServerFactory.createApp(opts({protocol: 'ssl'}))).toThrow()
    })
})