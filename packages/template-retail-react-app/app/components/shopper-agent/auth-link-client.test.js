/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {
    callAuthLink,
    normalizeScrt2Origin
} from '@salesforce/retail-react-app/app/components/shopper-agent/auth-link-client'

const TRUSTED_SCRT2_ORIGIN = 'https://orgfarm-123.test1.my.pc-rnd.salesforce-scrt.com'
const COMMERCE_CLIENT_JWT = 'header.payload.signature'

describe('auth-link-client', () => {
    let mockFetch
    let originalAbortController

    beforeEach(() => {
        originalAbortController = global.AbortController
        mockFetch = jest.fn()
        global.fetch = mockFetch
    })

    afterEach(() => {
        global.AbortController = originalAbortController
        jest.useRealTimers()
        jest.clearAllMocks()
    })

    describe('normalizeScrt2Origin', () => {
        it.each([
            [TRUSTED_SCRT2_ORIGIN, TRUSTED_SCRT2_ORIGIN],
            [` ${TRUSTED_SCRT2_ORIGIN}/ `, TRUSTED_SCRT2_ORIGIN],
            ['https://ORG.SALESFORCE-SCRT.COM:443/', 'https://org.salesforce-scrt.com']
        ])('normalizes trusted HTTPS SCRT2 origins', (input, expected) => {
            expect(normalizeScrt2Origin(input)).toBe(expected)
        })

        it.each([
            undefined,
            '',
            'not-a-url',
            'http://org.salesforce-scrt.com',
            'https://user:password@org.salesforce-scrt.com',
            'https://org.salesforce-scrt.com:8443',
            'https://org.salesforce-scrt.com/path',
            'https://org.salesforce-scrt.com?query=value',
            'https://org.salesforce-scrt.com#fragment',
            'https://org.my.salesforce.com',
            'https://salesforce-scrt.evil.com'
        ])('rejects an untrusted or non-origin SCRT2 URL', (input) => {
            expect(() => normalizeScrt2Origin(input)).toThrow('INVALID_SCRT2_URL')
        })
    })

    it('calls the fixed SCRT2 auth-link endpoint directly from the browser', async () => {
        mockFetch.mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({auth_link_key: 'test-auth-link-key'})
        })

        await expect(
            callAuthLink({
                commerceClientJWT: COMMERCE_CLIENT_JWT,
                scrt2Url: `${TRUSTED_SCRT2_ORIGIN}/`
            })
        ).resolves.toEqual({auth_link_key: 'test-auth-link-key'})

        expect(mockFetch).toHaveBeenCalledWith(
            `${TRUSTED_SCRT2_ORIGIN}/iamessage/api/v2/authorization/authlink`,
            {
                method: 'GET',
                headers: {Authorization: `Bearer ${COMMERCE_CLIENT_JWT}`},
                credentials: 'omit',
                cache: 'no-store',
                redirect: 'error',
                referrerPolicy: 'no-referrer',
                signal: expect.anything()
            }
        )
    })

    it('accepts a camelCase authLinkKey response and normalizes it to auth_link_key', async () => {
        mockFetch.mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({authLinkKey: 'test-auth-link-key'})
        })

        await expect(
            callAuthLink({
                commerceClientJWT: COMMERCE_CLIENT_JWT,
                scrt2Url: TRUSTED_SCRT2_ORIGIN
            })
        ).resolves.toEqual({auth_link_key: 'test-auth-link-key'})
    })

    it.each([undefined, '', '   ', 123])('rejects an invalid Commerce Client JWT', async (jwt) => {
        await expect(
            callAuthLink({commerceClientJWT: jwt, scrt2Url: TRUSTED_SCRT2_ORIGIN})
        ).rejects.toThrow('MISSING_COMMERCE_CLIENT_JWT')
        expect(mockFetch).not.toHaveBeenCalled()
    })

    it('rejects an invalid SCRT2 origin before sending the JWT', async () => {
        await expect(
            callAuthLink({
                commerceClientJWT: COMMERCE_CLIENT_JWT,
                scrt2Url: 'https://example.com'
            })
        ).rejects.toThrow('INVALID_SCRT2_URL')
        expect(mockFetch).not.toHaveBeenCalled()
    })

    it.each([
        [{auth_link_key: ''}],
        [{auth_link_key: '   '}],
        [{auth_link_key: 123}],
        [{}],
        [null]
    ])('rejects a successful response without a valid auth link key', async (body) => {
        mockFetch.mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => body
        })

        await expect(
            callAuthLink({
                commerceClientJWT: COMMERCE_CLIENT_JWT,
                scrt2Url: TRUSTED_SCRT2_ORIGIN
            })
        ).rejects.toThrow('INVALID_AUTH_LINK_RESPONSE')
    })

    it('reports an HTTP failure without exposing the SCRT response body', async () => {
        mockFetch.mockResolvedValue({
            ok: false,
            status: 401,
            json: async () => ({error: 'sensitive-upstream-detail'})
        })

        await expect(
            callAuthLink({
                commerceClientJWT: COMMERCE_CLIENT_JWT,
                scrt2Url: TRUSTED_SCRT2_ORIGIN
            })
        ).rejects.toThrow('AUTH_LINK_HTTP_401')
    })

    it('reports an invalid JSON response', async () => {
        mockFetch.mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => {
                throw new SyntaxError('invalid json')
            }
        })

        await expect(
            callAuthLink({
                commerceClientJWT: COMMERCE_CLIENT_JWT,
                scrt2Url: TRUSTED_SCRT2_ORIGIN
            })
        ).rejects.toThrow('INVALID_AUTH_LINK_RESPONSE')
    })

    it('aborts when SCRT2 does not respond before the timeout', async () => {
        jest.useFakeTimers()
        mockFetch.mockImplementation((_url, {signal}) => {
            return new Promise((_resolve, reject) => {
                signal.addEventListener('abort', () =>
                    reject(Object.assign(new Error('aborted'), {name: 'AbortError'}))
                )
            })
        })

        const request = callAuthLink({
            commerceClientJWT: COMMERCE_CLIENT_JWT,
            scrt2Url: TRUSTED_SCRT2_ORIGIN
        })
        jest.advanceTimersByTime(10000)

        await expect(request).rejects.toThrow('AUTH_LINK_TIMEOUT')
    })

    it('calls SCRT2 without a timeout signal when AbortController is unavailable', async () => {
        global.AbortController = undefined
        mockFetch.mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({auth_link_key: 'test-auth-link-key'})
        })

        await expect(
            callAuthLink({
                commerceClientJWT: COMMERCE_CLIENT_JWT,
                scrt2Url: TRUSTED_SCRT2_ORIGIN
            })
        ).resolves.toEqual({auth_link_key: 'test-auth-link-key'})

        expect(mockFetch.mock.calls[0][1]).not.toHaveProperty('signal')
    })
})
