/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import Auth, {AuthData} from './'
import jwt from 'jsonwebtoken'
import {helpers} from 'commerce-sdk-isomorphic'
import * as utils from '../utils'

// Use memory storage for all our storage types.
jest.mock('./storage', () => {
    const originalModule = jest.requireActual('./storage')

    return {
        ...originalModule,
        CookieStorage: originalModule.MemoryStorage,
        LocalStorage: originalModule.MemoryStorage
    }
})

jest.mock('commerce-sdk-isomorphic', () => {
    const originalModule = jest.requireActual('commerce-sdk-isomorphic')

    return {
        ...originalModule,
        helpers: {
            refreshAccessToken: jest.fn().mockResolvedValue(''),
            loginGuestUser: jest.fn().mockResolvedValue(''),
            loginRegisteredUserB2C: jest.fn().mockResolvedValue(''),
            logout: jest.fn().mockResolvedValue('')
        }
    }
})

jest.mock('../utils', () => ({
    __esModule: true,
    onClient: () => true,
    getParentOrigin: jest.fn().mockResolvedValue(''),
    isOriginTrusted: () => false
}))

/** The auth data we store has a slightly different shape than what we use. */
type StoredAuthData = Omit<AuthData, 'refresh_token'> & {refresh_token_guest?: string}

const config = {
    clientId: 'clientId',
    organizationId: 'organizationId',
    shortCode: 'shortCode',
    siteId: 'siteId',
    proxy: 'proxy',
    redirectURI: 'redirectURI'
}

describe('Auth', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })
    test('get/set storage value', () => {
        const auth = new Auth(config)

        const refreshToken = 'test refresh token'
        const accessToken = 'test access token'
        // @ts-expect-error private method
        auth.set('refresh_token_guest', refreshToken)
        // @ts-expect-error private method
        auth.set('access_token', accessToken)
        expect(auth.get('refresh_token_guest')).toBe(refreshToken)
        expect(auth.get('access_token')).toBe(accessToken)
        // @ts-expect-error private property
        expect([...auth.stores['cookie'].map.keys()]).toEqual([`cc-nx-g_siteId`])
        // @ts-expect-error private property
        expect([...auth.stores['local'].map.keys()]).toEqual([`access_token_siteId`])
    })
    test('set registered refresh token will clear guest refresh token, vise versa', () => {
        const auth = new Auth(config)

        const refreshTokenGuest = 'guest'
        const refreshTokenRegistered = 'registered'
        // @ts-expect-error private method
        auth.set('refresh_token_guest', refreshTokenGuest)
        // @ts-expect-error private method
        auth.set('refresh_token_registered', refreshTokenRegistered)
        expect(auth.get('refresh_token_guest')).toBe('')
        // @ts-expect-error private method
        auth.set('refresh_token_guest', refreshTokenGuest)
        expect(auth.get('refresh_token_registered')).toBe('')
    })
    test('this.data returns the storage value', () => {
        const auth = new Auth(config)

        const sample: StoredAuthData = {
            refresh_token_guest: 'refresh_token_guest',
            access_token: 'access_token',
            customer_id: 'customer_id',
            enc_user_id: 'enc_user_id',
            expires_in: 1800,
            id_token: 'id_token',
            idp_access_token: 'idp_access_token',
            token_type: 'token_type',
            usid: 'usid',
            customer_type: 'guest',
            refresh_token_expires_in: 'refresh_token_expires_in'
        }
        // Convert stored format to exposed format
        const result = {...sample, refresh_token: 'refresh_token_guest'}
        delete result.refresh_token_guest

        Object.keys(sample).forEach((key) => {
            // @ts-expect-error private method
            auth.set(key, sample[key])
        })
        // @ts-expect-error private method
        expect(auth.data).toEqual(result)
    })
    test('isTokenExpired', () => {
        const auth = new Auth(config)
        const JWTNotExpired = jwt.sign({exp: Math.floor(Date.now() / 1000) + 1000}, 'secret')
        const JWTExpired = jwt.sign({exp: Math.floor(Date.now() / 1000) - 1000}, 'secret')
        // @ts-expect-error private method
        expect(auth.isTokenExpired(JWTNotExpired)).toBe(false)
        // @ts-expect-error private method
        expect(auth.isTokenExpired(JWTExpired)).toBe(true)
        // @ts-expect-error private method
        expect(() => auth.isTokenExpired()).toThrow()
    })
    test('hasSFRAAuthStateChanged', () => {
        // Should return true if refresh_token keys are different
        const auth = new Auth(config)
        // @ts-expect-error private method
        auth.set('refresh_token_guest', '123')
        // @ts-expect-error private method
        auth.set('refresh_token_registered_copy', '456')
        // @ts-expect-error private method
        expect(auth.hasSFRAAuthStateChanged(true)).toBe(true)

        // Should return true if refresh_token keys are same but values are different
        // @ts-expect-error private method
        auth.set('refresh_token_guest', '123')
        // @ts-expect-error private method
        auth.set('refresh_token_guest_copy', '456')
        // @ts-expect-error private method
        expect(auth.hasSFRAAuthStateChanged(true)).toBe(true)

        // Should return false if refresh_token keys are same
        // @ts-expect-error private method
        auth.set('refresh_token_guest', '123')
        // @ts-expect-error private method
        auth.set('refresh_token_guest_copy', '123')
        // @ts-expect-error private method
        expect(auth.hasSFRAAuthStateChanged(true)).toBe(false)
    })
    test('isTokenValidForHybrid', () => {
        const auth = new Auth(config)

        // Return false if JWT Expired
        const JWTExpired = jwt.sign({exp: Math.floor(Date.now() / 1000) - 1000}, 'secret')
        // @ts-expect-error private method
        auth.set('refresh_token_guest', '123')
        // @ts-expect-error private method
        auth.set('refresh_token_guest_copy', '123')
        // @ts-expect-error private method
        expect(auth.isTokenValidForHybrid(JWTExpired, true)).toBe(false)

        // Return false if SFRA Auth state changed
        const JWTNotExpired = jwt.sign({exp: Math.floor(Date.now() / 1000) + 1000}, 'secret')
        // @ts-expect-error private method
        auth.set('refresh_token_guest', '123')
        // @ts-expect-error private method
        auth.set('refresh_token_registered_copy', '456')
        // @ts-expect-error private method
        expect(auth.isTokenValidForHybrid(JWTNotExpired, true)).toBe(false)

        // Return true if JWT NOT expired and SFRA Auth state NOT changed
        // @ts-expect-error private method
        auth.set('refresh_token_guest', '123')
        // @ts-expect-error private method
        auth.set('refresh_token_guest_copy', '123')
        // @ts-expect-error private method
        expect(auth.isTokenValidForHybrid(JWTNotExpired, true)).toBe(true)
    })
    test('site switch clears auth storage', () => {
        const auth = new Auth(config)
        // @ts-expect-error private method
        auth.set('access_token', '123')
        // @ts-expect-error private method
        auth.set('refresh_token_guest', '456')
        const switchSiteConfig = {...config, siteId: 'another site'}
        const newAuth = new Auth(switchSiteConfig)
        expect(newAuth.get('access_token')).not.toBe('123')
        expect(newAuth.get('refresh_token_guest')).not.toBe('456')
    })
    test('ready - re-use pendingToken', async () => {
        const auth = new Auth(config)
        const data = {
            refresh_token: 'refresh_token_guest',
            access_token: 'access_token',
            customer_id: 'customer_id',
            enc_user_id: 'enc_user_id',
            expires_in: 1800,
            id_token: 'id_token',
            idp_access_token: 'idp_access_token',
            token_type: 'token_type',
            usid: 'usid',
            customer_type: 'guest'
        }
        // @ts-expect-error private method
        auth.pendingToken = Promise.resolve(data)

        await expect(auth.ready()).resolves.toEqual(data)
    })
    test('ready - re-use valid access token', async () => {
        const auth = new Auth(config)
        const JWTNotExpired = jwt.sign({exp: Math.floor(Date.now() / 1000) + 1000}, 'secret')

        // @ts-expect-error private method
        auth.set('refresh_token_guest_copy', 'refresh_token_guest') // Simulates SFRA auth state has NOT changed and token is valid.

        const data: StoredAuthData = {
            refresh_token_guest: 'refresh_token_guest',
            access_token: JWTNotExpired,
            customer_id: 'customer_id',
            enc_user_id: 'enc_user_id',
            expires_in: 1800,
            id_token: 'id_token',
            idp_access_token: 'idp_access_token',
            token_type: 'token_type',
            usid: 'usid',
            customer_type: 'guest',
            refresh_token_expires_in: 'refresh_token_expires_in'
        }
        // Convert stored format to exposed format
        const result = {...data, refresh_token: 'refresh_token_guest'}
        delete result.refresh_token_guest

        Object.keys(data).forEach((key) => {
            // @ts-expect-error private method
            auth.set(key, data[key])
        })

        await expect(auth.ready()).resolves.toEqual(result)
        // @ts-expect-error private method
        expect(auth.pendingToken).toBeUndefined()
    })
    test('ready - use `fetchedToken` and short circuit network request', async () => {
        const fetchedToken = jwt.sign(
            {
                sub: `cc-slas::zzrf_001::scid:xxxxxx::usid:usid`,
                isb: `uido:ecom::upn:test@gmail.com::uidn:firstname lastname::gcid:guestuserid::rcid:rcid::chid:siteId`
            },
            'secret'
        )
        const auth = new Auth({...config, fetchedToken})
        jest.spyOn(auth, 'queueRequest')
        await auth.ready()
        // The "unbound method" isn't being called, so the rule isn't applicable
        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(auth.queueRequest).not.toHaveBeenCalled()
        // @ts-expect-error private method
        expect(auth.pendingToken).toBeUndefined()
    })
    test('ready - use `fetchedToken` and auth data is populated for registered user', async () => {
        const usid = 'usidddddd'
        const customerId = 'customerIddddddd'
        const fetchedToken = jwt.sign(
            {
                sub: `cc-slas::zzrf_001::scid:xxxxxx::usid:${usid}`,
                isb: `uido:ecom::upn:test@gmail.com::uidn:firstname lastname::gcid:guestuserid::rcid:${customerId}::chid:siteId`
            },
            'secret'
        )
        const auth = new Auth({...config, fetchedToken})
        await auth.ready()
        expect(auth.get('access_token')).toBe(fetchedToken)
        expect(auth.get('customer_id')).toBe(customerId)
        expect(auth.get('usid')).toBe(usid)
        expect(auth.get('customer_type')).toBe('registered')
    })
    test('ready - use `fetchedToken` and auth data is populated for guest user', async () => {
        // isb: `uido:slas::upn:Guest::uidn:Guest User::gcid:bclrdGlbIZlHaRxHsZlWYYxHwZ::chid: `
        const usid = 'usidddddd'
        const customerId = 'customerIddddddd'
        const fetchedToken = jwt.sign(
            {
                sub: `cc-slas::zzrf_001::scid:xxxxxx::usid:${usid}`,
                isb: `uido:ecom::upn:Guest::uidn:firstname lastname::gcid:${customerId}::rcid:registeredCid::chid:siteId`
            },
            'secret'
        )
        const auth = new Auth({...config, fetchedToken})
        await auth.ready()
        expect(auth.get('access_token')).toBe(fetchedToken)
        expect(auth.get('customer_id')).toBe(customerId)
        expect(auth.get('usid')).toBe(usid)
        expect(auth.get('customer_type')).toBe('guest')
    })
    test('ready - use refresh token when access token is expired', async () => {
        const auth = new Auth(config)
        const JWTNotExpired = jwt.sign({exp: Math.floor(Date.now() / 1000) + 1000}, 'secret')
        const JWTExpired = jwt.sign({exp: Math.floor(Date.now() / 1000) - 1000}, 'secret')

        // To simulate real-world scenario, let's first test with a good valid token
        // @ts-expect-error private method
        auth.set('refresh_token_guest_copy', 'refresh_token_guest') // Simulates SFRA auth state has NOT changed and token is valid.

        const data: StoredAuthData = {
            refresh_token_guest: 'refresh_token_guest',
            access_token: JWTNotExpired,
            customer_id: 'customer_id',
            enc_user_id: 'enc_user_id',
            expires_in: 1800,
            id_token: 'id_token',
            idp_access_token: 'idp_access_token',
            token_type: 'token_type',
            usid: 'usid',
            customer_type: 'guest',
            refresh_token_expires_in: 'refresh_token_expires_in'
        }

        Object.keys(data).forEach((key) => {
            // @ts-expect-error private method
            auth.set(key, data[key])
        })

        await auth.ready()
        expect(helpers.refreshAccessToken).not.toHaveBeenCalled()

        // And then now test with an _expired_ token
        // @ts-expect-error private method
        auth.set('access_token', JWTExpired)

        await auth.ready()
        expect(helpers.refreshAccessToken).toHaveBeenCalled()
    })
    test('ready - PKCE flow', async () => {
        const auth = new Auth(config)

        await auth.ready()
        expect(helpers.loginGuestUser).toHaveBeenCalled()
    })
    test('loginGuestUser', async () => {
        const auth = new Auth(config)
        await auth.loginGuestUser()
        expect(helpers.loginGuestUser).toHaveBeenCalled()
    })
    test('loginRegisteredUserB2C', async () => {
        const auth = new Auth(config)
        await auth.loginRegisteredUserB2C({username: 'test', password: 'test'})
        expect(helpers.loginRegisteredUserB2C).toHaveBeenCalled()
    })
    test('logout', async () => {
        const auth = new Auth(config)
        await auth.logout()
        expect(helpers.loginGuestUser).toHaveBeenCalled()
    })
    test('running on the server uses a shared context memory store', () => {
        const refreshTokenGuest = 'guest'

        // Mock running on the server so shared context storage is used.
        // @ts-expect-error read-only property
        utils.onClient = () => false

        // Create a new auth instance and set its guest token.
        const authA = new Auth({...config, siteId: 'siteA'})
        // @ts-expect-error private method
        authA.set('refresh_token_guest', refreshTokenGuest)
        // @ts-expect-error private property
        expect([...authA.stores['memory'].map.keys()]).toEqual([`cc-nx-g_siteA`])

        // Create a second auth instance and ensure that its memory store has previous
        // guest tokens set from the first store (this emulates a second lambda request.)
        const authB = new Auth({...config, siteId: 'siteB'})
        // @ts-expect-error private method
        authB.set('refresh_token_guest', refreshTokenGuest)

        // @ts-expect-error private property
        expect([...authB.stores['memory'].map.keys()]).toEqual([`cc-nx-g_siteA`, `cc-nx-g_siteB`])

        // Set mock value back to expected.
        // @ts-expect-error read-only property
        utils.onClient = () => true
    })
})
