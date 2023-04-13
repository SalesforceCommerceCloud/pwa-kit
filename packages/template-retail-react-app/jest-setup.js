/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {mockCustomerBaskets} from './app/mocks/mock-data'

const path = require('path')
const mockConfig = require(path.join(__dirname, 'config/mocks/default.js'))
require('raf/polyfill') // fix requestAnimationFrame issue with polyfill
require('@testing-library/jest-dom/extend-expect')
const {Crypto} = require('@peculiar/webcrypto')
const {setupServer} = require('msw/node')
const {rest} = require('msw')
import {registerUserToken} from './app/utils/test-utils'
const {configure: configureTestingLibrary} = require('@testing-library/react')

const {
    mockCategory,
    mockedRegisteredCustomer,
    exampleTokenReponse
} = require('./app/mocks/mock-data')

configureTestingLibrary({
    // Increase to: 6 x default timeout of 1 second
    ...(process.env.CI ? {asyncUtilTimeout: 6000} : {})
})

// Mock the application configuration to be used in all tests.
jest.mock('pwa-kit-runtime/utils/ssr-config', () => {
    return {
        getConfig: jest.fn().mockImplementation(() => {
            return mockConfig
        })
    }
})

// TextEncoder is a web API, need to import it
// from nodejs util in testing environment.
global.TextEncoder = require('util').TextEncoder

// This file consists of global mocks for jsdom.
class StorageMock {
    constructor() {
        this.store = {}
    }
    clear() {
        this.store = {}
    }
    getItem(key) {
        return this.store[key] || null
    }
    setItem(key, value) {
        this.store[key] = value?.toString()
    }
    removeItem(key) {
        delete this.store[key]
    }
}

Object.defineProperty(window, 'crypto', {
    value: new Crypto()
})

Object.defineProperty(window, 'localStorage', {
    value: new StorageMock()
})

Object.defineProperty(window, 'sessionStorage', {
    value: new StorageMock()
})

Object.defineProperty(window, 'scrollTo', {
    value: () => null
})

if (typeof window.matchMedia !== 'function') {
    Object.defineProperty(window, 'matchMedia', {
        enumerable: true,
        configurable: true,
        writable: true,
        value: jest.fn().mockImplementation((query) => ({
            matches: false,
            media: query,
            onchange: null,
            addListener: jest.fn(), // Deprecated
            removeListener: jest.fn(), // Deprecated
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            dispatchEvent: jest.fn()
        }))
    })
}

const defaultHandlers = [
    {
        path: '*/oauth2/authorize',
        method: 'post'
    },
    {
        path: '*/oauth2/authorize'
    },
    {
        path: '*/oauth2/login',
        method: 'post',
        res: () => {
            return mockedRegisteredCustomer
        }
    },
    {
        path: '*/oauth2/logout',
        res: () => {
            return exampleTokenReponse
        }
    },
    {
        path: '*/customers/:customerId',
        res: () => {
            return mockedRegisteredCustomer
        }
    },
    {
        path: '*/customers',
        res: () => {
            return mockedRegisteredCustomer
        }
    },
    {
        path: '*/customers/:customerId/baskets',
        res: () => {
            return mockCustomerBaskets
        }
    },
    {
        path: '*/sessions',
        method: 'post'
    },
    {
        path: '*/oauth2/token',
        method: 'post',
        res: () => {
            return {
                customer_id: 'customerid',
                access_token: registerUserToken,
                refresh_token: 'testrefeshtoken',
                usid: 'testusid',
                enc_user_id: 'testEncUserId',
                id_token: 'testIdToken'
            }
        }
    },
    {
        path: '*/categories/:categoryId',
        res: () => {
            return mockCategory
        }
    },
    {
        path: '*/baskets/actions/merge',
        method: 'post'
    },
    {
        path: '*/v3/activities/EinsteinTestSite/*',
        method: 'post',
        res: () => {
            return {}
        }
    },
    {
        path: '*/v3/personalization/recs/EinsteinTestSite/*',
        method: 'post',
        res: () => {
            return {}
        }
    }
]

const setupHandlers = (handlerConfig = [], defaultHandlers = []) => {
    return [...defaultHandlers, ...handlerConfig].map((config) => {
        return rest[config.method?.toLowerCase() || 'get'](config.path, (req, res, ctx) => {
            return res(
                ctx.delay(0),
                ctx.status(config.status || 200),
                config.res && ctx.json(config.res(req, res, ctx))
            )
        })
    })
}

// NOTE!!!: Never initialize the server in the global scope.
// call it within a test suite. e.g
// describe('test suite', () => {
//    createServer([
//       {
//            path: '*/oauth2/token',
//            method: 'post',
//            res: () => {
//            return {
//               customer_id: 'customerid_1',
//               access_token: registerUserToken,
//               refresh_token: 'testrefeshtoken_1',
//               usid: 'testusid_1',
//               enc_user_id: 'testEncUserId_1',
//               id_token: 'testIdToken_1'
//            }
//       }
//    ])
// })
export function createServer(handlerConfig) {
    const handlers = setupHandlers(handlerConfig, defaultHandlers)
    const server = setupServer(...handlers)

    const prependHandlersToServer = (handlerConfig = []) => {
        const handlers = setupHandlers(handlerConfig)
        server.use(...handlers)
    }

    beforeEach(() => {
        jest.spyOn(console, 'error')
        // jest.spyOn(console, 'warn')
        console.error.mockImplementation(() => {})
        // console.warn.mockImplementation(() => {})
    })
    beforeAll(() => {
        server.listen()
    })
    afterEach(() => {
        console.error.mockRestore()
        // console.warn.mockRestore()
        server.resetHandlers()
    })
    afterAll(() => {
        server.close()
    })

    return {server, prependHandlersToServer}
}
