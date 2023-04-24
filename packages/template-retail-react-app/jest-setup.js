/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* eslint-env jest */
/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path')
const mockConfig = require(path.join(__dirname, 'config/mocks/default.js'))
require('raf/polyfill') // fix requestAnimationFrame issue with polyfill
require('@testing-library/jest-dom/extend-expect')
const {configure: configureTestingLibrary} = require('@testing-library/react')
const {Crypto} = require('@peculiar/webcrypto')
const {setupServer} = require('msw/node')
const {rest} = require('msw')
const {
    mockCategory,
    mockedRegisteredCustomer,
    exampleTokenReponse,
    mockCustomerBaskets
} = require('./app/mocks/mock-data')

configureTestingLibrary({
    // Increase to: 6 x default timeout of 1 second
    ...(process.env.CI ? {asyncUtilTimeout: 6000} : {})
})

/**
 * Set up an API mocking server for testing purposes.
 * This mock server includes the basic oauth flow endpoints.
 */

// Mock the application configuration to be used in all tests.
jest.mock('pwa-kit-runtime/utils/ssr-config', () => {
    return {
        getConfig: () => mockConfig
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
                access_token:
                    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdXQiOiJHVUlEIiwic2NwIjoic2ZjYy5zaG9wcGVyLW15YWNjb3VudC5iYXNrZXRzIHNmY2Muc2hvcHBlci1teWFjY291bnQuYWRkcmVzc2VzIHNmY2Muc2hvcHBlci1wcm9kdWN0cyBzZmNjLnNob3BwZXItZGlzY292ZXJ5LXNlYXJjaCBzZmNjLnNob3BwZXItbXlhY2NvdW50LnJ3IHNmY2Muc2hvcHBlci1teWFjY291bnQucGF5bWVudGluc3RydW1lbnRzIHNmY2Muc2hvcHBlci1jdXN0b21lcnMubG9naW4gc2ZjYy5zaG9wcGVyLWV4cGVyaWVuY2Ugc2ZjYy5zaG9wcGVyLW15YWNjb3VudC5vcmRlcnMgc2ZjYy5zaG9wcGVyLWN1c3RvbWVycy5yZWdpc3RlciBzZmNjLnNob3BwZXItYmFza2V0cy1vcmRlcnMgc2ZjYy5zaG9wcGVyLW15YWNjb3VudC5hZGRyZXNzZXMucncgc2ZjYy5zaG9wcGVyLW15YWNjb3VudC5wcm9kdWN0bGlzdHMucncgc2ZjYy5zaG9wcGVyLXByb2R1Y3RsaXN0cyBzZmNjLnNob3BwZXItcHJvbW90aW9ucyBzZmNjLnNob3BwZXItYmFza2V0cy1vcmRlcnMucncgc2ZjYy5zaG9wcGVyLW15YWNjb3VudC5wYXltZW50aW5zdHJ1bWVudHMucncgc2ZjYy5zaG9wcGVyLWdpZnQtY2VydGlmaWNhdGVzIHNmY2Muc2hvcHBlci1wcm9kdWN0LXNlYXJjaCBzZmNjLnNob3BwZXItbXlhY2NvdW50LnByb2R1Y3RsaXN0cyBzZmNjLnNob3BwZXItY2F0ZWdvcmllcyBzZmNjLnNob3BwZXItbXlhY2NvdW50Iiwic3ViIjoiY2Mtc2xhczo6enpyZl8wMDE6OnNjaWQ6YzljNDViZmQtMGVkMy00YWEyLTk5NzEtNDBmODg5NjJiODM2Ojp1c2lkOjhlODgzOTczLTY4ZWItNDFmZS1hM2M1LTc1NjIzMjY1MmZmNSIsImN0eCI6InNsYXMiLCJpc3MiOiJzbGFzL3Byb2QvenpyZl8wMDEiLCJpc3QiOjEsImF1ZCI6ImNvbW1lcmNlY2xvdWQvcHJvZC96enJmXzAwMSIsIm5iZiI6MTY3ODgzNDI3MSwic3R5IjoiVXNlciIsImlzYiI6InVpZG86ZWNvbTo6dXBuOmtldjVAdGVzdC5jb206OnVpZG46a2V2aW4gaGU6OmdjaWQ6YWJtZXMybWJrM2xYa1JsSEZKd0dZWWt1eEo6OnJjaWQ6YWJVTXNhdnBEOVk2alcwMGRpMlNqeEdDTVU6OmNoaWQ6UmVmQXJjaEdsb2JhbCIsImV4cCI6MjY3ODgzNjEwMSwiaWF0IjoxNjc4ODM0MzAxLCJqdGkiOiJDMkM0ODU2MjAxODYwLTE4OTA2Nzg5MDM0ODA1ODMyNTcwNjY2NTQyIn0.9P4hFgmipd4UwvhcbfA8wSrVr2z1Vj_il9feoWOT4Kk',
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

    beforeAll(() => {
        server.listen()
    })
    afterEach(() => {
        server.resetHandlers()
    })
    afterAll(() => {
        server.close()
    })

    return {server, prependHandlersToServer}
}
