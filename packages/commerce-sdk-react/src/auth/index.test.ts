/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import Auth, {injectAccessToken} from './'
import jwt from 'jsonwebtoken'
import {helpers} from 'commerce-sdk-isomorphic'

jest.mock('./storage', () => {
    return {
        CookieStorage: jest.fn(function() {
            const map = new Map()
            return {
                set(key: string, value: string) {
                    map.set(key, value)
                },
                get(key: string) {
                    return map.get(key)
                },
                delete(key: string) {
                    map.delete(key)
                }
            }
        }),
        LocalStorage: jest.fn(function() {
            const map = new Map()
            return {
                set(key: string, value: string) {
                    map.set(key, value)
                },
                get(key: string) {
                    return map.get(key)
                },
                delete(key: string) {
                    map.delete(key)
                }
            }
        })
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

test('injectAccessToken', () => {
    expect(injectAccessToken({}, 'test')).toEqual({Authorization: 'Bearer test'})
    expect(injectAccessToken(undefined, 'test')).toEqual({Authorization: 'Bearer test'})
})

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
    })
    test('set registered refresh token will clear guest refresh token, vise versa', () => {
        const auth = new Auth(config)

        const refreshTokenGuest = 'guest'
        const refreshTokenRegistered = 'registered'
        // @ts-expect-error private method
        auth.set('refresh_token_guest', refreshTokenGuest)
        // @ts-expect-error private method
        auth.set('refresh_token_registered', refreshTokenRegistered)
        expect(auth.get('refresh_token_guest')).toBe(undefined)
        // @ts-expect-error private method
        auth.set('refresh_token_guest', refreshTokenGuest)
        expect(auth.get('refresh_token_registered')).toBe(undefined)
    })
    test('this.data returns the storage value', () => {
        const auth = new Auth(config)

        const sample = {
            refresh_token_guest: 'refresh_token_guest',
            access_token: 'access_token',
            customer_id: 'customer_id',
            enc_user_id: 'enc_user_id',
            expires_in: 1800,
            id_token: 'id_token',
            idp_access_token: 'idp_access_token',
            token_type: 'token_type',
            usid: 'usid'
        }
        const {refresh_token_guest, ...result} = {...sample, refresh_token: 'refresh_token_guest'}

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
    test('ready - re-use pendingToken', () => {
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
            usid: 'usid'
        }
        // @ts-expect-error private method
        auth.pendingToken = Promise.resolve(data)

        expect(auth.ready()).resolves.toEqual(data)
    })
    test('ready - re-use valid access token', () => {
        const auth = new Auth(config)

        const data = {
            refresh_token_guest: 'refresh_token_guest',
            access_token: jwt.sign({exp: Math.floor(Date.now() / 1000) + 1000}, 'secret'),
            customer_id: 'customer_id',
            enc_user_id: 'enc_user_id',
            expires_in: 1800,
            id_token: 'id_token',
            idp_access_token: 'idp_access_token',
            token_type: 'token_type',
            usid: 'usid'
        }
        const {refresh_token_guest, ...result} = {...data, refresh_token: 'refresh_token_guest'}

        Object.keys(data).forEach((key) => {
            // @ts-expect-error private method
            auth.set(key, data[key])
        })

        expect(auth.ready()).resolves.toEqual(result)
    })
    test('ready - use refresh token when access token is expired', async () => {
        const auth = new Auth(config)

        const data = {
            refresh_token_guest: 'refresh_token_guest',
            access_token: jwt.sign({exp: Math.floor(Date.now() / 1000) - 1000}, 'secret'),
            customer_id: 'customer_id',
            enc_user_id: 'enc_user_id',
            expires_in: 1800,
            id_token: 'id_token',
            idp_access_token: 'idp_access_token',
            token_type: 'token_type',
            usid: 'usid'
        }
        const {refresh_token_guest, ...result} = {...data, refresh_token: 'refresh_token_guest'}

        Object.keys(data).forEach((key) => {
            // @ts-expect-error private method
            auth.set(key, data[key])
        })

        await auth.ready().then(() => {
            expect(helpers.refreshAccessToken).toBeCalled()
        })
    })
    test('ready - PKCE flow', async () => {
        const auth = new Auth(config)

        await auth.ready().then(() => {
            expect(helpers.loginGuestUser).toBeCalled()
        })
    })
    test('loginGuestUser', async () => {
        const auth = new Auth(config)
        await auth.loginGuestUser().then(() => {
            expect(helpers.loginGuestUser).toBeCalled()
        })
    })
    test('loginRegisteredUserB2C', async () => {
        const auth = new Auth(config)
        await auth.loginRegisteredUserB2C({username: 'test', password: 'test'}).then(() => {
            expect(helpers.loginRegisteredUserB2C).toBeCalled()
        })
    })
    test('logout', async () => {
        const auth = new Auth(config)
        await auth.logout().then(() => {
            expect(helpers.loginGuestUser).toBeCalled()
        })
    })
})
