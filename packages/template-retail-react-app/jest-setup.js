/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {mockCustomerBaskets} from './app/commerce-api/mock-data'

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

const AJwtThatNeverExpires =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiZXhwIjoyNjczOTExMjYxLCJpYXQiOjI2NzM5MDk0NjF9.BDAp9G8nmArdBqAbsE5GUWZ3fiv2LwQKClEFDCGIyy8'

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
        rest.get('*/customers/:customerId', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.status(200), ctx.json(mockedRegisteredCustomer))
        }),
        rest.post('*/sessions', (req, res, ctx) => res(ctx.delay(0), ctx.status(200))),
        rest.post('*/oauth2/token', (req, res, ctx) =>
            res(
                ctx.delay(0),
                ctx.json({
                    customer_id: 'test',
                    access_token: AJwtThatNeverExpires,
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
        rest.get('*/customers/:customerId/baskets', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.status(200), ctx.json(mockCustomerBaskets))
        }),
        rest.post('*/baskets/actions/merge', (req, res, ctx) => res(ctx.delay(0), ctx.status(200))),

        // for Einstein
        rest.get('*/v3*', (req, res, ctx) => res(ctx.delay(0), ctx.status(200))),
        rest.post('*/v3*', (req, res, ctx) => res(ctx.delay(0), ctx.status(200)))
    )
}

global.server = setupMockServer()
beforeAll(() => {
    global.server.listen({
        onUnhandledRequest: 'error'
    })
})
afterEach(() => {
    global.server.resetHandlers()
})
// TODO: fix unit tests that does not properly await async operation
// temporaily comment out server.close() to avoid
// tests from erroring out randomly
// afterAll(() => {
//     global.server.close()
// })

// Mock the application configuration to be used in all tests.
jest.mock('pwa-kit-runtime/utils/ssr-config', () => {
    return {
        getConfig: () => mockConfig
    }
})

// TextEncoder is a web API, need to import it
// from nodejs util in testing environment.
// This is used in commerce-api/pkce.js
global.TextEncoder = require('util').TextEncoder

// This file consists of global mocks for jsdom.
class LocalStorageMock {
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

const localStorageMock = new LocalStorageMock()

Object.defineProperty(window, 'crypto', {
    value: new Crypto()
})

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
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
