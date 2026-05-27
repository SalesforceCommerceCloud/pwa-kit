/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {
    SESSION_COOKIE_CONFIG,
    getSiteId,
    getCookieName,
    getCookieNamesToStripFromProxy
} from './httponly-cookie-config'
import {X_SITE_ID} from './constants'

describe('SESSION_COOKIE_CONFIG', () => {
    it('defines the correct key prefixes', () => {
        expect(SESSION_COOKIE_CONFIG.accessToken.key).toBe('cc-at')
        expect(SESSION_COOKIE_CONFIG.accessTokenExpires.key).toBe('cc-at-expires')
        expect(SESSION_COOKIE_CONFIG.accessTokenDnt.key).toBe('cc-at-dnt')
        expect(SESSION_COOKIE_CONFIG.uido.key).toBe('uido')
        expect(SESSION_COOKIE_CONFIG.idpAccessToken.key).toBe('idp_access_token')
        expect(SESSION_COOKIE_CONFIG.refreshTokenGuest.key).toBe('cc-nx-g')
        expect(SESSION_COOKIE_CONFIG.refreshTokenRegistered.key).toBe('cc-nx')
        expect(SESSION_COOKIE_CONFIG.customerId.key).toBe('customer_id')
        expect(SESSION_COOKIE_CONFIG.encUserId.key).toBe('enc_user_id')
        expect(SESSION_COOKIE_CONFIG.customerType.key).toBe('customer_type')
        expect(SESSION_COOKIE_CONFIG.usid.key).toBe('usid')
        expect(SESSION_COOKIE_CONFIG.refreshTokenExpires.key).toBe('cc-nx-expires')
        expect(SESSION_COOKIE_CONFIG.idToken.key).toBe('id_token')
        expect(SESSION_COOKIE_CONFIG.idpRefreshToken.key).toBe('idp_refresh_token')
    })

    it('marks sensitive token cookies as httpOnly', () => {
        expect(SESSION_COOKIE_CONFIG.accessToken.attributes.httpOnly).toBe(true)
        expect(SESSION_COOKIE_CONFIG.idpAccessToken.attributes.httpOnly).toBe(true)
        expect(SESSION_COOKIE_CONFIG.refreshTokenGuest.attributes.httpOnly).toBe(true)
        expect(SESSION_COOKIE_CONFIG.refreshTokenRegistered.attributes.httpOnly).toBe(true)
        expect(SESSION_COOKIE_CONFIG.idpRefreshToken.attributes.httpOnly).toBe(true)
    })

    it('marks client-readable cookies as non-httpOnly', () => {
        expect(SESSION_COOKIE_CONFIG.accessTokenExpires.attributes.httpOnly).toBe(false)
        expect(SESSION_COOKIE_CONFIG.accessTokenDnt.attributes.httpOnly).toBe(false)
        expect(SESSION_COOKIE_CONFIG.uido.attributes.httpOnly).toBe(false)
        expect(SESSION_COOKIE_CONFIG.customerId.attributes.httpOnly).toBe(false)
        expect(SESSION_COOKIE_CONFIG.encUserId.attributes.httpOnly).toBe(false)
        expect(SESSION_COOKIE_CONFIG.customerType.attributes.httpOnly).toBe(false)
        expect(SESSION_COOKIE_CONFIG.usid.attributes.httpOnly).toBe(false)
        expect(SESSION_COOKIE_CONFIG.refreshTokenExpires.attributes.httpOnly).toBe(false)
        expect(SESSION_COOKIE_CONFIG.idToken.attributes.httpOnly).toBe(false)
    })

    it('sets secure and path / on all cookies', () => {
        Object.values(SESSION_COOKIE_CONFIG).forEach((config) => {
            expect(config.attributes.secure).toBe(true)
            expect(config.attributes.path).toBe('/')
        })
    })

    it('does not declare a static sameSite — resolved per-request based on preview-context marker', () => {
        Object.values(SESSION_COOKIE_CONFIG).forEach((config) => {
            expect(config.attributes.sameSite).toBeUndefined()
        })
    })
})

describe('getSiteId', () => {
    it('extracts siteId from x-site-id header', () => {
        const request = {headers: {[X_SITE_ID]: 'RefArch'}}
        expect(getSiteId(request)).toBe('RefArch')
    })

    it('returns undefined when header is missing', () => {
        const request = {headers: {}}
        expect(getSiteId(request)).toBeUndefined()
    })

    it('returns undefined when headers is undefined', () => {
        const request = {}
        expect(getSiteId(request)).toBeUndefined()
    })
})

describe('getCookieName', () => {
    it('combines config key with siteId', () => {
        expect(getCookieName(SESSION_COOKIE_CONFIG.accessToken, 'RefArch')).toBe('cc-at_RefArch')
        expect(getCookieName(SESSION_COOKIE_CONFIG.refreshTokenGuest, 'MySite')).toBe(
            'cc-nx-g_MySite'
        )
    })
})

describe('getCookieNamesToStripFromProxy', () => {
    it('returns access token, both refresh tokens, idp access token, idp refresh token, and dwsid', () => {
        const names = getCookieNamesToStripFromProxy('RefArch')
        expect(names).toEqual([
            'cc-at_RefArch',
            'cc-nx-g_RefArch',
            'cc-nx_RefArch',
            'idp_access_token_RefArch',
            'idp_refresh_token_RefArch',
            'dwsid'
        ])
    })

    it('always includes dwsid regardless of siteId', () => {
        const names = getCookieNamesToStripFromProxy(undefined)
        expect(names).toContain('dwsid')
    })
})
