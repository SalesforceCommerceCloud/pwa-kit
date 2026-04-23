/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {
    getRefreshTokenCookieTTL,
    setHttpOnlySessionCookies,
    expireHttpOnlySessionCookies
} from './process-token-response'
import {X_SITE_ID} from './constants'
import {parse as parseSetCookie} from 'set-cookie-parser'

jest.mock('../../utils/logger-instance', () => ({
    __esModule: true,
    default: {
        warn: jest.fn(),
        info: jest.fn(),
        error: jest.fn()
    }
}))

import logger from '../../utils/logger-instance'

function makeJWT(payload) {
    const header = Buffer.from(JSON.stringify({alg: 'HS256', typ: 'JWT'})).toString('base64url')
    const payloadPart = Buffer.from(JSON.stringify(payload)).toString('base64url')
    return `${header}.${payloadPart}.sig`
}

function makeReq(siteId = 'testsite') {
    return {headers: {[X_SITE_ID]: siteId}}
}

function makeRes() {
    const cookies = []
    return {
        cookies,
        append: jest.fn((header, value) => {
            cookies.push(value)
        })
    }
}

function makeResponseBuffer(body) {
    return Buffer.from(JSON.stringify(body), 'utf8')
}

function parseCookie(cookieStr) {
    return parseSetCookie(cookieStr)[0]
}

describe('getRefreshTokenCookieTTL', () => {
    const GUEST_DEFAULT = 30 * 24 * 60 * 60
    const REGISTERED_DEFAULT = 90 * 24 * 60 * 60

    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('returns SLAS value for guest when no override', () => {
        expect(getRefreshTokenCookieTTL(12345, true)).toBe(12345)
    })

    test('returns SLAS value for registered when no override', () => {
        expect(getRefreshTokenCookieTTL(54321, false)).toBe(54321)
    })

    test('returns guest default when no SLAS value and no override', () => {
        expect(getRefreshTokenCookieTTL(undefined, true)).toBe(GUEST_DEFAULT)
    })

    test('returns registered default when no SLAS value and no override', () => {
        expect(getRefreshTokenCookieTTL(undefined, false)).toBe(REGISTERED_DEFAULT)
    })

    test('uses valid guest override', () => {
        const ttl = 1000
        expect(getRefreshTokenCookieTTL(12345, true, {refreshTokenGuestCookieTTL: ttl})).toBe(ttl)
    })

    test('uses valid registered override', () => {
        const ttl = 1000
        expect(getRefreshTokenCookieTTL(12345, false, {refreshTokenRegisteredCookieTTL: ttl})).toBe(
            ttl
        )
    })

    test('rejects override exceeding default and warns', () => {
        const tooLarge = GUEST_DEFAULT + 1
        const result = getRefreshTokenCookieTTL(12345, true, {
            refreshTokenGuestCookieTTL: tooLarge
        })
        expect(result).toBe(12345)
        expect(logger.warn).toHaveBeenCalledWith(
            'You are attempting to use an invalid refresh token TTL value.'
        )
    })

    test('rejects zero override and warns', () => {
        const result = getRefreshTokenCookieTTL(12345, true, {refreshTokenGuestCookieTTL: 0})
        expect(result).toBe(12345)
        expect(logger.warn).toHaveBeenCalled()
    })

    test('rejects negative override and warns', () => {
        const result = getRefreshTokenCookieTTL(12345, true, {refreshTokenGuestCookieTTL: -1})
        expect(result).toBe(12345)
        expect(logger.warn).toHaveBeenCalled()
    })

    test('rejects non-number override and warns', () => {
        const result = getRefreshTokenCookieTTL(12345, true, {
            refreshTokenGuestCookieTTL: 'invalid'
        })
        expect(result).toBe(12345)
        expect(logger.warn).toHaveBeenCalled()
    })
})

describe('setHttpOnlySessionCookies', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('throws when x-site-id header is missing', () => {
        const res = makeRes()
        const buf = makeResponseBuffer({access_token: 'x'})
        const req = {headers: {}}
        expect(() => setHttpOnlySessionCookies(buf, {}, req, res, {})).toThrow(/siteId is missing/)
    })

    test('returns buffer unchanged for non-JSON response', () => {
        const res = makeRes()
        const buf = Buffer.from('not json', 'utf8')
        const result = setHttpOnlySessionCookies(buf, {}, makeReq(), res, {})
        expect(result).toBe(buf)
        expect(res.append).not.toHaveBeenCalled()
    })

    test('sets all cookies and strips tokens for a guest token response', () => {
        const res = makeRes()
        const accessToken = makeJWT({
            iat: 1000,
            exp: 2800,
            isb: 'uido:ecom::upn:Guest::uidn:Guest::gcid:g1',
            dnt: '1'
        })
        const buf = makeResponseBuffer({
            access_token: accessToken,
            idp_access_token: 'idp-token-value',
            refresh_token: 'refresh-value',
            expires_in: 1800,
            customer_id: 'cust123'
        })
        const result = setHttpOnlySessionCookies(buf, {}, makeReq(), res, {})

        // cc-at: access token (HttpOnly)
        const atCookie = parseCookie(res.cookies.find((c) => c.includes('cc-at_testsite=')))
        expect(atCookie.value).toBe(accessToken)
        expect(atCookie.httpOnly).toBe(true)
        expect(atCookie.secure).toBe(true)
        expect(atCookie.path).toBe('/')

        // cc-at-expires: expiry from JWT exp claim (non-HttpOnly)
        const expCookie = parseCookie(
            res.cookies.find((c) => c.includes('cc-at-expires_testsite='))
        )
        expect(expCookie.value).toBe(String(2800))
        expect(expCookie.httpOnly).toBeUndefined()

        // cc-at-dnt: do-not-track from JWT (non-HttpOnly)
        const dntCookie = parseCookie(res.cookies.find((c) => c.includes('cc-at-dnt_testsite=')))
        expect(dntCookie.value).toBe('1')
        expect(dntCookie.httpOnly).toBeUndefined()

        // idp_access_token (HttpOnly)
        const idpCookie = parseCookie(
            res.cookies.find((c) => c.includes('idp_access_token_testsite='))
        )
        expect(idpCookie.value).toBe('idp-token-value')
        expect(idpCookie.httpOnly).toBe(true)

        // cc-nx-g: guest refresh token (HttpOnly)
        const refreshCookie = parseCookie(res.cookies.find((c) => c.includes('cc-nx-g_testsite=')))
        expect(refreshCookie.value).toBe('refresh-value')
        expect(refreshCookie.httpOnly).toBe(true)

        // uido (non-HttpOnly)
        const uidoCookie = parseCookie(res.cookies.find((c) => c.includes('uido_testsite=')))
        expect(uidoCookie.value).toBe('ecom')
        expect(uidoCookie.httpOnly).toBeUndefined()

        // cc-nx-exists: non-HttpOnly indicator that a refresh token cookie exists
        const nxExistsCookie = parseCookie(
            res.cookies.find((c) => c.includes('cc-nx-exists_testsite='))
        )
        expect(nxExistsCookie.value).toBe('1')
        expect(nxExistsCookie.httpOnly).toBeUndefined()
        expect(nxExistsCookie.secure).toBe(true)

        // Registered refresh cookie should be expired (deleted)
        const staleRegisteredCookie = parseCookie(
            res.cookies.find((c) => c.startsWith('cc-nx_testsite='))
        )
        expect(staleRegisteredCookie.value).toBe('')
        expect(staleRegisteredCookie.expires).toEqual(new Date(0))

        // Tokens stripped from body, other fields preserved
        const body = JSON.parse(result.toString('utf8'))
        expect(body).not.toHaveProperty('access_token')
        expect(body).not.toHaveProperty('idp_access_token')
        expect(body).not.toHaveProperty('refresh_token')
        expect(body.expires_in).toBe(1800)
        expect(body.customer_id).toBe('cust123')
    })

    test('sets all cookies for a registered token response', () => {
        const res = makeRes()
        const accessToken = makeJWT({
            iat: 2000,
            exp: 3800,
            isb: 'uido:ecom::upn:john@example.com::uidn:John'
        })
        const buf = makeResponseBuffer({
            access_token: accessToken,
            refresh_token: 'refresh-value',
            expires_in: 1800
        })
        const result = setHttpOnlySessionCookies(buf, {}, makeReq(), res, {})

        // cc-at (HttpOnly)
        const atCookie = parseCookie(res.cookies.find((c) => c.includes('cc-at_testsite=')))
        expect(atCookie.httpOnly).toBe(true)

        // cc-at-expires (non-HttpOnly)
        const expCookie = parseCookie(
            res.cookies.find((c) => c.includes('cc-at-expires_testsite='))
        )
        expect(expCookie.value).toBe(String(3800))

        // cc-nx: registered refresh token (HttpOnly)
        const refreshCookie = parseCookie(res.cookies.find((c) => c.includes('cc-nx_testsite=')))
        expect(refreshCookie.value).toBe('refresh-value')
        expect(refreshCookie.httpOnly).toBe(true)

        // uido (non-HttpOnly)
        const uidoCookie = parseCookie(res.cookies.find((c) => c.includes('uido_testsite=')))
        expect(uidoCookie.value).toBe('ecom')

        // cc-nx-exists: non-HttpOnly indicator that a refresh token cookie exists
        const nxExistsCookie = parseCookie(
            res.cookies.find((c) => c.includes('cc-nx-exists_testsite='))
        )
        expect(nxExistsCookie.value).toBe('1')
        expect(nxExistsCookie.httpOnly).toBeUndefined()

        // Guest refresh cookie should be expired (deleted)
        const staleGuestCookie = parseCookie(
            res.cookies.find((c) => c.startsWith('cc-nx-g_testsite='))
        )
        expect(staleGuestCookie.value).toBe('')
        expect(staleGuestCookie.expires).toEqual(new Date(0))

        // No dnt cookie when dnt absent from JWT
        expect(res.cookies.find((c) => c.includes('cc-at-dnt_testsite'))).toBeUndefined()

        // Tokens stripped from body
        const body = JSON.parse(result.toString('utf8'))
        expect(body).not.toHaveProperty('access_token')
        expect(body).not.toHaveProperty('refresh_token')
    })

    test('omits uido cookie when uido is absent from JWT', () => {
        const res = makeRes()
        const accessToken = makeJWT({iat: 1000, exp: 2800, isb: '::upn:Guest'})
        const buf = makeResponseBuffer({
            access_token: accessToken,
            refresh_token: 'refresh-value',
            expires_in: 1800
        })
        setHttpOnlySessionCookies(buf, {}, makeReq(), res, {})

        expect(res.cookies.find((c) => c.includes('uido_testsite'))).toBeUndefined()
    })

    test('throws when access token JWT is invalid', () => {
        const res = makeRes()
        const buf = makeResponseBuffer({access_token: 'not-a-jwt', expires_in: 1800})
        expect(() => setHttpOnlySessionCookies(buf, {}, makeReq(), res, {})).toThrow(
            /Failed to decode access token JWT/
        )
    })

    test('uses JWT exp for cookie expiry regardless of expires_in', () => {
        const res = makeRes()
        const accessToken = makeJWT({iat: 5000, exp: 6800, isb: 'uido:ecom::upn:Guest'})
        const buf = makeResponseBuffer({access_token: accessToken})
        setHttpOnlySessionCookies(buf, {}, makeReq(), res, {})

        const expCookie = res.cookies.find((c) => c.includes('cc-at-expires_testsite='))
        const parsed = parseCookie(expCookie)
        expect(parsed.value).toBe(String(6800))
    })

    test('handles response with no tokens (no cookies set, body returned stripped)', () => {
        const res = makeRes()
        const buf = makeResponseBuffer({expires_in: 1800, other_field: 'value'})
        const result = setHttpOnlySessionCookies(buf, {}, makeReq(), res, {})
        const body = JSON.parse(result.toString('utf8'))

        expect(res.cookies).toHaveLength(0)
        // cc-nx-exists should NOT be set when there is no refresh token
        expect(res.cookies.find((c) => c.includes('cc-nx-exists'))).toBeUndefined()
        expect(body.other_field).toBe('value')
    })

    test('uses x-site-id header to resolve correct cookie names', () => {
        const res = makeRes()
        const accessToken = makeJWT({iat: 1000, exp: 2800, isb: 'uido:ecom::upn:Guest'})
        const buf = makeResponseBuffer({access_token: accessToken, expires_in: 1800})
        setHttpOnlySessionCookies(buf, {}, makeReq('othersite'), res, {})

        const atCookie = res.cookies.find((c) => c.includes('cc-at_othersite='))
        expect(atCookie).toBeDefined()
    })
})

describe('expireHttpOnlySessionCookies', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('throws when x-site-id header is missing', () => {
        const res = makeRes()
        const req = {headers: {}}
        expect(() => expireHttpOnlySessionCookies(req, res)).toThrow(/siteId is missing/)
    })

    test('expires all session cookies for the given site', () => {
        const res = makeRes()
        expireHttpOnlySessionCookies(makeReq(), res)

        const expectedCookieKeys = [
            'cc-at_testsite',
            'cc-at-expires_testsite',
            'cc-at-dnt_testsite',
            'uido_testsite',
            'idp_access_token_testsite',
            'cc-nx-g_testsite',
            'cc-nx_testsite',
            'cc-nx-exists_testsite'
        ]

        expect(res.cookies).toHaveLength(expectedCookieKeys.length)

        for (const key of expectedCookieKeys) {
            const cookie = parseCookie(res.cookies.find((c) => c.includes(`${key}=`)))
            expect(cookie).toBeDefined()
            expect(cookie.value).toBe('')
            expect(cookie.expires).toEqual(new Date(0))
        }
    })

    test('uses x-site-id header to resolve correct cookie names', () => {
        const res = makeRes()
        expireHttpOnlySessionCookies(makeReq('mysite'), res)

        const atCookie = res.cookies.find((c) => c.includes('cc-at_mysite='))
        expect(atCookie).toBeDefined()
        expect(res.cookies.find((c) => c.includes('cc-at_testsite='))).toBeUndefined()
    })

    test('preserves cookie attributes (Secure, HttpOnly, Path) from config', () => {
        const res = makeRes()
        expireHttpOnlySessionCookies(makeReq(), res)

        // cc-at should be HttpOnly + Secure
        const atCookie = parseCookie(res.cookies.find((c) => c.includes('cc-at_testsite=')))
        expect(atCookie.httpOnly).toBe(true)
        expect(atCookie.secure).toBe(true)
        expect(atCookie.path).toBe('/')

        // cc-at-expires should NOT be HttpOnly, but should be Secure
        const expCookie = parseCookie(
            res.cookies.find((c) => c.includes('cc-at-expires_testsite='))
        )
        expect(expCookie.httpOnly).toBeUndefined()
        expect(expCookie.secure).toBe(true)
    })
})
