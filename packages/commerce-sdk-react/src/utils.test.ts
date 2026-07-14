/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import type {DOMWindow} from 'jsdom'
import * as utils from './utils'
import {DEFAULT_TEST_CONFIG} from './test-utils'
import {SDKClientTransformConfig} from './hooks/types'

// `jsdom` is declared as a global by src/components/StorefrontPreview/utils.test.ts
// (a `declare global` augmentation is visible program-wide); redeclaring it here
// would be a TS2451 "cannot redeclare block-scoped variable" error under tsc.

/** Empty `window.top` that throws if anything touches it — proves we don't. */
const mockTop = new Proxy({} as DOMWindow, {
    get: (_, prop) => {
        throw new Error(`window.top['${String(prop)}'] is not mocked.`)
    }
})

describe('Utils', () => {
    test.each([
        ['/callback', false],
        ['https://pwa-kit.mobify-storefront.com/callback', true],
        ['/social-login/callback', false]
    ])('isAbsoluteUrl', (url, expected) => {
        const isURL = utils.isAbsoluteUrl(url)
        expect(isURL).toBe(expected)
    })
    test('extractCustomParameters only returns custom parameters', () => {
        const parameters = {
            c_param1: 'this is a custom',
            param1: 'this is not a custom',
            c_param2: 1,
            param2: 2,
            param3: false,
            c_param3: true
        }
        const customParameters = utils.extractCustomParameters(parameters)
        expect(customParameters).toEqual({
            c_param1: 'this is a custom',
            c_param2: 1,
            c_param3: true
        })
    })

    describe('transformSDKClient', () => {
        let mockClient: any
        let mockConfig: SDKClientTransformConfig

        beforeEach(() => {
            mockClient = {
                getBasket: jest.fn().mockResolvedValue({basketId: 'test-basket'}),
                createBasket: jest.fn().mockResolvedValue({basketId: 'new-basket'}),
                nonFunctionProperty: 'some value'
            }

            mockConfig = {
                props: {
                    ...DEFAULT_TEST_CONFIG
                },
                transformer: jest.fn((params, methodName, options) => options),
                onError: jest.fn()
            }
        })

        afterEach(() => {
            jest.clearAllMocks()
        })

        test('should return a proxy that preserves non-function properties', () => {
            const proxiedClient = utils.transformSDKClient(mockClient, mockConfig)

            expect(proxiedClient.nonFunctionProperty).toBe('some value')
        })

        test('should wrap function methods with proxy behavior', () => {
            const proxiedClient = utils.transformSDKClient(mockClient, mockConfig)

            expect(typeof proxiedClient.getBasket).toBe('function')
            expect(typeof proxiedClient.createBasket).toBe('function')
        })

        test('should call original method with provided options', async () => {
            const proxiedClient = utils.transformSDKClient(mockClient, mockConfig)
            const options = {parameters: {basketId: 'test-123'}}

            await proxiedClient.getBasket(options)

            expect(mockClient.getBasket).toHaveBeenCalledWith(options)
        })

        test('should call original method with empty object if no options provided', async () => {
            const proxiedClient = utils.transformSDKClient(mockClient, mockConfig)

            await proxiedClient.getBasket()

            expect(mockClient.getBasket).toHaveBeenCalledWith({})
        })

        test('should apply transformer to options before calling original method', async () => {
            const transformedOptions = {
                parameters: {basketId: 'transformed-123'},
                headers: {'X-Custom': 'transformed'}
            }
            ;(mockConfig.transformer as jest.Mock).mockResolvedValue(transformedOptions)

            const proxiedClient = utils.transformSDKClient(mockClient, mockConfig)
            const originalOptions = {parameters: {basketId: 'original-123'}}

            await proxiedClient.getBasket(originalOptions)

            expect(mockConfig.transformer).toHaveBeenCalledWith(
                mockConfig.props,
                'getBasket',
                originalOptions
            )
            expect(mockClient.getBasket).toHaveBeenCalledWith(transformedOptions)
        })

        test('should handle async transformer', async () => {
            const transformedOptions = {parameters: {basketId: 'async-transformed'}}
            ;(mockConfig.transformer as jest.Mock).mockResolvedValue(transformedOptions)

            const proxiedClient = utils.transformSDKClient(mockClient, mockConfig)

            await proxiedClient.getBasket({})

            expect(mockClient.getBasket).toHaveBeenCalledWith(transformedOptions)
        })

        test('should handle sync transformer', async () => {
            const transformedOptions = {parameters: {basketId: 'sync-transformed'}}
            ;(mockConfig.transformer as jest.Mock).mockReturnValue(transformedOptions)

            const proxiedClient = utils.transformSDKClient(mockClient, mockConfig)

            await proxiedClient.getBasket({})

            expect(mockClient.getBasket).toHaveBeenCalledWith(transformedOptions)
        })

        test('should call onError callback when method throws error', async () => {
            const error = new Error('API Error')
            mockClient.getBasket.mockRejectedValue(error)

            const proxiedClient = utils.transformSDKClient(mockClient, mockConfig)
            const options = {parameters: {basketId: 'test'}}

            await expect(proxiedClient.getBasket(options)).rejects.toThrow('API Error')

            expect(mockConfig.onError).toHaveBeenCalledWith('getBasket', error, options)
        })

        test('should rethrow error after calling onError callback', async () => {
            const error = new Error('API Error')
            mockClient.getBasket.mockRejectedValue(error)

            const proxiedClient = utils.transformSDKClient(mockClient, mockConfig)

            await expect(proxiedClient.getBasket({})).rejects.toThrow('API Error')
        })

        test('should work without optional callbacks', async () => {
            const configWithoutCallbacks = {
                props: {
                    ...DEFAULT_TEST_CONFIG
                }
            }

            const proxiedClient = utils.transformSDKClient(mockClient, configWithoutCallbacks)

            await expect(proxiedClient.getBasket({})).resolves.toEqual({basketId: 'test-basket'})
        })

        test('should work without transformer', async () => {
            const configWithoutTransformer = {
                props: {
                    ...DEFAULT_TEST_CONFIG
                },
                onError: jest.fn()
            }

            const proxiedClient = utils.transformSDKClient(mockClient, configWithoutTransformer)
            const options = {parameters: {basketId: 'test'}}

            await proxiedClient.getBasket(options)

            expect(mockClient.getBasket).toHaveBeenCalledWith(options)
        })

        test('should handle multiple method calls independently', async () => {
            const proxiedClient = utils.transformSDKClient(mockClient, mockConfig)

            await proxiedClient.getBasket({parameters: {basketId: 'basket-1'}})
            await proxiedClient.createBasket({parameters: {currency: 'USD'}})

            expect(mockClient.getBasket).toHaveBeenCalledWith({parameters: {basketId: 'basket-1'}})
            expect(mockClient.createBasket).toHaveBeenCalledWith({parameters: {currency: 'USD'}})
        })

        test('should preserve this context in original method calls', async () => {
            const contextClient = {
                getData: function () {
                    return Promise.resolve('test-data')
                }
            }

            const proxiedClient = utils.transformSDKClient(contextClient, mockConfig)

            const result = await proxiedClient.getData()

            expect(result).toBe('test-data')
        })

        test('should pass props correctly to transformer', () => {
            const propsWithCustom = {
                ...DEFAULT_TEST_CONFIG,
                customProp: 'custom-value'
            }

            const configWithCustomProps = {
                props: propsWithCustom,
                transformer: jest.fn((params) => {
                    expect(params).toHaveProperty('customProp', 'custom-value')
                    return {}
                })
            }

            const proxiedClient = utils.transformSDKClient(mockClient, configWithCustomProps)

            proxiedClient.getBasket({})

            expect(configWithCustomProps.transformer).toHaveBeenCalled()
        })
    })
})

describe('parseResponseBodyClone', () => {
    test('parses the JSON body from a clone, leaving the original body unread', async () => {
        const body = {message: 'access_token_cookie_missing'}
        const originalJson = jest.fn()
        const cloneJson = jest.fn().mockResolvedValue(body)
        const clone = jest.fn(() => ({json: cloneJson}))
        const response = {json: originalJson, clone} as unknown as Response

        await expect(utils.parseResponseBodyClone(response)).resolves.toEqual(body)
        expect(clone).toHaveBeenCalledTimes(1)
        // The original stream is never touched, so the caller can still read it.
        expect(originalJson).not.toHaveBeenCalled()
    })

    test('returns undefined when the response is undefined', async () => {
        await expect(utils.parseResponseBodyClone(undefined)).resolves.toBeUndefined()
    })

    test('returns undefined when the response has no clone method', async () => {
        const json = jest.fn()
        const response = {json} as unknown as Response

        await expect(utils.parseResponseBodyClone(response)).resolves.toBeUndefined()
        expect(json).not.toHaveBeenCalled()
    })
})

describe('getTrustedPreviewParentOrigin', () => {
    const TRUSTED_PARENT = 'https://runtime.commercecloud.com'
    const UNTRUSTED_PARENT = 'https://website.about.bagels'
    const STOREFRONT_URL = 'https://storefront.mobify-storefront.com'

    let originalLocation: string

    // Bypasses two TS constraints on `location.ancestorOrigins`: it's read-only
    // and typed as DOMStringList. Numeric indexing on a plain array is enough
    // for getParentOrigin, which only reads `ancestorOrigins[0]`.
    const setAncestorOrigins = (...ancestorOrigins: string[]) => {
        Object.assign(location, {ancestorOrigins})
    }

    beforeAll(() => {
        originalLocation = window.location.href
    })
    beforeEach(() => {
        // Sever `window.top === window.self` so detectInIframe() reports true,
        // and set a non-localhost storefront URL.
        jsdom.reconfigure({windowTop: mockTop, url: STOREFRONT_URL})
    })
    afterEach(() => {
        // @ts-expect-error DOM lib types ancestorOrigins as required; JSDOM omits it
        delete window.location.ancestorOrigins
    })
    afterAll(() => {
        jsdom.reconfigure({windowTop: window as unknown as DOMWindow, url: originalLocation})
    })

    test('returns the parent origin when in a trusted iframe on a non-localhost host', () => {
        setAncestorOrigins(TRUSTED_PARENT)
        expect(utils.getTrustedPreviewParentOrigin()).toBe(TRUSTED_PARENT)
    })

    test('returns undefined when the parent origin is not trusted', () => {
        setAncestorOrigins(UNTRUSTED_PARENT)
        expect(utils.getTrustedPreviewParentOrigin()).toBeUndefined()
    })

    test('returns undefined when not in an iframe', () => {
        jsdom.reconfigure({windowTop: window as unknown as DOMWindow, url: STOREFRONT_URL})
        setAncestorOrigins(TRUSTED_PARENT)
        expect(utils.getTrustedPreviewParentOrigin()).toBeUndefined()
    })

    test('returns undefined on localhost even when the parent origin is the dev origin', () => {
        // Mirrors getCookieSameSiteAttribute: localhost never opts into SameSite=None.
        jsdom.reconfigure({windowTop: mockTop, url: 'http://localhost:3000'})
        setAncestorOrigins('http://localhost:4000')
        expect(utils.getTrustedPreviewParentOrigin()).toBeUndefined()
    })
})
