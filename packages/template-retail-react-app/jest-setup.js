/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const path = require('path')
const mockConfig = require(path.join(__dirname, 'config/mocks/default.js'))
require('raf/polyfill') // fix requestAnimationFrame issue with polyfill
require('@testing-library/jest-dom/extend-expect')
const {Crypto} = require('@peculiar/webcrypto')
const {setupServer} = require('msw/node')
const {rest} = require('msw')
const {
    mockCategory,
    mockedRegisteredCustomer,
    exampleTokenReponse
} = require('./app/commerce-api/mock-data')

/**
 * Set up an API mocking server for testing purposes.
 * This mock server includes the basic oauth flow endpoints.
 */
export const setupMockServer = () => {
    return setupServer(
        rest.post('*/oauth2/authorize', (req, res, ctx) => res(ctx.delay(0), ctx.status(200))),
        rest.get('*/oauth2/authorize', (req, res, ctx) => res(ctx.delay(0), ctx.status(200))),
        rest.post('*/oauth2/login', (req, res, ctx) =>
            res(ctx.delay(0), ctx.status(200), ctx.json(mockedRegisteredCustomer))
        ),
        rest.get('*/oauth2/logout', (req, res, ctx) =>
            res(ctx.delay(0), ctx.status(200), ctx.json(exampleTokenReponse))
        ),
        rest.get('*/customers/:customerId', (req, res, ctx) =>
            res(ctx.delay(0), ctx.status(200), ctx.json(mockedRegisteredCustomer))
        ),
        rest.post('*/customers/action/login', (req, res, ctx) => {
            return res(
                ctx.delay(0),
                ctx.status(200),
                ctx.json({
                    authType: 'guest',
                    customerId: 'customerid'
                })
            )
        }),
        rest.post('*/sessions', (req, res, ctx) => res(ctx.delay(0), ctx.status(200))),
        rest.post('*/oauth2/token', (req, res, ctx) =>
            res(
                ctx.delay(0),
                ctx.json({
                    customer_id: 'test',
                    access_token: 'testtoken',
                    refresh_token: 'testrefeshtoken',
                    usid: 'testusid',
                    enc_user_id: 'testEncUserId',
                    id_token: 'testIdToken'
                })
            )
        ),
        rest.get('*/categories/:categoryId', (req, res, ctx) =>
            res(ctx.delay(0), ctx.status(200), ctx.json(mockCategory))
        ),
        rest.post('*/baskets/actions/merge', (req, res, ctx) => res(ctx.delay(0), ctx.status(200)))
    )
}

global.server = setupMockServer()

beforeAll(() => {
    global.server.listen()
})
afterEach(() => {
    global.server.resetHandlers()
})
afterAll(() => {
    global.server.close()
})

// Mock the application configuration to be used in all tests.
jest.mock('pwa-kit-runtime/utils/ssr-config', () => {
    return {
        getConfig: () => mockConfig
    }
})

// Mock isTokenExpired globally
jest.mock('./app/commerce-api/utils', () => {
    const originalModule = jest.requireActual('./app/commerce-api/utils')
    return {
        ...originalModule,
        isTokenExpired: jest.fn().mockReturnValue(false)
    }
})

// TextEncoder is a web API, need to import it
// from nodejs util in testing environment.
// This is used in commerce-api/pkce.js
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

Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(), // deprecated
        removeListener: jest.fn(), // deprecated
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn()
    }))
})
