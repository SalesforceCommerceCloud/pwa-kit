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
        rest.post('*/oauth2/token', (req, res, ctx) => {
            return res(
                ctx.delay(0),
                ctx.json({
                    // FYI decoded token has this payload:
                    // {
                    // "sub": "cc-slas::zzrf_001::scid:c9c45bfd-0ed3-4aa2-xxxx-40f88962b836::usid:b4865233-de92-4039-xxxx-aa2dfc8c1ea5",
                    // "name": "John Doe",
                    // "exp": 2673911261,
                    // "iat": 2673909461,
                    // "isb": "uido:ecom::upn:Guest||xxxEmailxxx::uidn:FirstName LastName::gcid:xxxGuestCustomerIdxxx::rcid:xxxRegisteredCustomerIdxxx::chid:xxxSiteIdxxx"
                    // }
                    access_token:
                        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjYy1zbGFzOjp6enJmXzAwMTo6c2NpZDpjOWM0NWJmZC0wZWQzLTRhYTIteHh4eC00MGY4ODk2MmI4MzY6OnVzaWQ6YjQ4NjUyMzMtZGU5Mi00MDM5LXh4eHgtYWEyZGZjOGMxZWE1IiwibmFtZSI6IkpvaG4gRG9lIiwiZXhwIjoyNjczOTExMjYxLCJpYXQiOjI2NzM5MDk0NjEsImlzYiI6InVpZG86ZWNvbTo6dXBuOkd1ZXN0fHx4eHhFbWFpbHh4eDo6dWlkbjpGaXJzdE5hbWUgTGFzdE5hbWU6OmdjaWQ6eHh4R3Vlc3RDdXN0b21lcklkeHh4OjpyY2lkOnh4eFJlZ2lzdGVyZWRDdXN0b21lcklkeHh4OjpjaGlkOnh4eFNpdGVJZHh4eCJ9.CQpejPFNav6NLc_csSImVcDxeY8GVzBHblE9lu7RtGM',

                    customer_id: 'customerid',
                    refresh_token: 'testrefeshtoken',
                    usid: 'testusid',
                    enc_user_id: 'testEncUserId',
                    id_token: 'testIdToken'
                })
            )
        }),
        rest.get('*/categories/:categoryId', (req, res, ctx) =>
            res(ctx.delay(0), ctx.status(200), ctx.json(mockCategory))
        ),
        rest.post('*/baskets/actions/merge', (req, res, ctx) => res(ctx.delay(0), ctx.status(200)))
    )
}

global.server = setupMockServer()

beforeAll(() => {
    global.server.listen({
        onUnhandledRequest(req) {
            console.error('Found an unhandled %s request to %s', req.method, req.url.href)
        }
    })
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

// Mock @tanstack/react-query
jest.mock('@tanstack/react-query', () => {
    const originalModule = jest.requireActual('@tanstack/react-query')
    return {
        ...originalModule,
        QueryClient: jest.fn().mockImplementation(() => ({
            mount: jest.fn(),
            unmount: jest.fn(),
            isFetching: jest.fn().mockReturnValue(false),
            isMutating: jest.fn().mockReturnValue(false),
            getQueryData: jest.fn(),
            setQueryData: jest.fn(),
            getQueryCache: jest.fn().mockReturnValue({
                findAll: jest.fn().mockReturnValue([]),
                subscribe: jest.fn()
            }),
            getMutationCache: jest.fn().mockReturnValue({
                findAll: jest.fn().mockReturnValue([]),
                subscribe: jest.fn()
            }),
            invalidateQueries: jest.fn(),
            refetchQueries: jest.fn(),
            clear: jest.fn()
        })),
        QueryClientProvider: ({children}) => children
    }
})

jest.mock('@salesforce/commerce-sdk-react', () => {
    return {
        CommerceApiProvider: ({children}) => children,
        AuthHelpers: {
            LoginRegisteredUserB2C: 'LoginRegisteredUserB2C',
            Logout: 'Logout'
        },
        useAuthHelper: jest.fn().mockReturnValue({
            mutateAsync: jest.fn().mockResolvedValue({})
        }),
        useAccessToken: jest.fn().mockReturnValue('mock-access-token'),
        useCustomerId: jest.fn().mockReturnValue('mock-customer-id'),
        useEncUserId: jest.fn().mockReturnValue('mock-enc-user-id')
    }
})

jest.mock('@salesforce/commerce-sdk-react/auth', () => {
    return class MockAuth {
        login() {
            return {}
        }
        getAccessToken() {
            return 'access_token'
        }
        handleTokenResponse() {
            return Promise.resolve({})
        }
        clearStorage() {
            return Promise.resolve()
        }
        ready() {
            return Promise.resolve()
        }
        get(key) {
            return key
        }
    }
})

jest.mock('@salesforce/commerce-sdk-react/utils', () => {
    return {
        getDefaultCookieAttributes: jest.fn().mockReturnValue({}),
        getParentOrigin: jest.fn().mockReturnValue('http://localhost'),
        isOriginTrusted: jest.fn().mockReturnValue(true),
        onClient: jest.fn().mockReturnValue(true),
        transformSDKClient: jest.fn().mockImplementation((sdkClient) => sdkClient)
    }
})
