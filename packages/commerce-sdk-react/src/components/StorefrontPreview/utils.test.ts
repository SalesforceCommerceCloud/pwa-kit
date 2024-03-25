/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import type {DOMWindow, JSDOM} from 'jsdom'
import {useCommerceApi} from '../../hooks'
import {renderHookWithProviders} from '../../test-utils'
import {getParentOrigin} from '../../utils'
import {getClientScript, detectStorefrontPreview, proxyRequests} from './utils'

const LOCALHOST_ORIGIN = 'http://localhost:4000'
const RUNTIME_ADMIN_ORIGIN = 'https://runtime.commercecloud.com'
const OTHER_ORIGIN = 'https://website.about.bagels'

declare global {
    const jsdom: JSDOM
}

/** Empty `window.top` that throws if you try to do anything with it. */
const mockTop = new Proxy({} as DOMWindow, {
    get: (_, prop) => {
        throw new Error(`window.top['${String(prop)}'] is not mocked.`)
    }
})

jest.mock('../../auth/index.ts')

describe('Storefront Preview utils', () => {
    let originalLocation: string
    let referrerSpy: jest.SpyInstance<string>

    const setAncestorOrigins = (...ancestorOrigins: string[]) => {
        // This is a hacky workaround to bypass two TS errors:
        // 1. `ancestorOrigins` is a read-only property, but we must change it.
        // 2. It's supposed to be a DOMStringList, but we're providing an array. This is fine for
        // our use case, though, because we're just using numeric indexing (`ancestorOrigins[0]`).
        Object.assign(location, {ancestorOrigins})
    }

    beforeAll(() => {
        originalLocation = window.location.href
        referrerSpy = jest.spyOn(document, 'referrer', 'get')
    })
    beforeEach(() => {
        // Sever `window.top === window.self` to pretend we're in an iframe
        jsdom.reconfigure({windowTop: mockTop, url: originalLocation})
        jest.resetAllMocks()
    })
    afterEach(() => {
        // @ts-expect-error because TS DOM lib says it's required, but JSDOM doesn't use it
        delete window.location.ancestorOrigins
    })
    afterAll(() => {
        // This type assertion is safe because it's the window provided by JSDOM;
        // it is required because the TS DOM lib is older and missing a few things
        jsdom.reconfigure({windowTop: window as unknown as DOMWindow, url: originalLocation})
        jest.restoreAllMocks()
    })

    describe('getClientScript', function () {
        test('returns client script src with prod origin', () => {
            setAncestorOrigins(RUNTIME_ADMIN_ORIGIN)
            const src = getClientScript()
            expect(src).toBe('https://runtime.commercecloud.com/cc/b2c/preview/preview.client.js')
        })
        test('returns client script src with localhost origin', () => {
            setAncestorOrigins(LOCALHOST_ORIGIN)
            const src = getClientScript()
            expect(src).toBe(
                'http://localhost:4000/mobify/bundle/development/static/storefront-preview.js'
            )
        })
    })

    describe('getParentOrigin', function () {
        test('returns origin from ancestorOrigins', () => {
            setAncestorOrigins(LOCALHOST_ORIGIN)
            expect(getParentOrigin()).toBe(LOCALHOST_ORIGIN)
        })
        test('returns origin from document.referrer', () => {
            referrerSpy.mockReturnValue(LOCALHOST_ORIGIN)
            expect(getParentOrigin()).toBe(LOCALHOST_ORIGIN)
        })
    })

    describe('detectStorefrontPreview', function () {
        test('returns true for trusted ancestor origin', () => {
            jsdom.reconfigure({url: 'http://localhost:3000'})
            setAncestorOrigins(LOCALHOST_ORIGIN)
            expect(detectStorefrontPreview()).toBe(true)
        })
        test('returns false for non-trusted ancestor origin', () => {
            setAncestorOrigins(OTHER_ORIGIN)
            expect(detectStorefrontPreview()).toBe(false)
        })
    })

    describe('proxyRequests', () => {
        test('proxy handlers applied to all client methods', async () => {
            const {result} = renderHookWithProviders(() => useCommerceApi())
            const clients = result.current
            const shopperBaskets = clients.shopperBaskets
            const handlers = {apply: jest.fn()}

            proxyRequests(clients, handlers)

            await shopperBaskets.getBasket()
            await shopperBaskets.getTaxesFromBasket()
            await shopperBaskets.getPriceBooksForBasket()
            await shopperBaskets.getShippingMethodsForShipment()

            expect(handlers.apply).toHaveBeenCalledTimes(4)
        })
    })
})
