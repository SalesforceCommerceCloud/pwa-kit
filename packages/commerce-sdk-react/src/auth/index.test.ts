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
    onClient: () => true
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
        expect([...auth.stores['cookie'].map.keys()]).toEqual([`siteId_cc-nx-g`])
        // @ts-expect-error private property
        expect([...auth.stores['local'].map.keys()]).toEqual([`siteId_access_token`])
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
            customer_type: 'guest'
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
            usid: 'usid',
            customer_type: 'guest'
        }
        // @ts-expect-error private method
        auth.pendingToken = Promise.resolve(data)

        expect(auth.ready()).resolves.toEqual(data)
    })
    test('ready - re-use valid access token', () => {
        const auth = new Auth(config)

        const data: StoredAuthData = {
            refresh_token_guest: 'refresh_token_guest',
            access_token: jwt.sign({exp: Math.floor(Date.now() / 1000) + 1000}, 'secret'),
            customer_id: 'customer_id',
            enc_user_id: 'enc_user_id',
            expires_in: 1800,
            id_token: 'id_token',
            idp_access_token: 'idp_access_token',
            token_type: 'token_type',
            usid: 'usid',
            customer_type: 'guest'
        }
        // Convert stored format to exposed format
        const result = {...data, refresh_token: 'refresh_token_guest'}
        delete result.refresh_token_guest

        Object.keys(data).forEach((key) => {
            // @ts-expect-error private method
            auth.set(key, data[key])
        })

        expect(auth.ready()).resolves.toEqual(result)
    })
    test('ready - use `fetchedToken` and short circuit network request', async () => {
        const auth = new Auth({...config, fetchedToken: 'fake-token'})
        jest.spyOn(auth, 'queueRequest')
        await auth.ready().then(() => {
            expect(auth.queueRequest).not.toHaveBeenCalled()
        })
    })
    test('ready - use `fetchedToken` and auth data is populated for registered user', async () => {
        const fetchedToken = 'eyJ2ZXIiOiIxLjAiLCJqa3UiOiJzbGFzL3Byb2QvenpyZl8wMDEiLCJraWQiOiJiMjNkZTU5YS1iMTk3LTQyNTAtODdkNy1mNDFmNmUzNjcwNzciLCJ0eXAiOiJqd3QiLCJjbHYiOiJKMi4zLjQiLCJhbGciOiJFUzI1NiJ9.eyJhdXQiOiJHVUlEIiwic2NwIjoic2ZjYy5zaG9wcGVyLW15YWNjb3VudC5iYXNrZXRzIHNmY2Muc2hvcHBlci1teWFjY291bnQuYWRkcmVzc2VzIHNmY2Muc2hvcHBlci1wcm9kdWN0cyBzZmNjLnNob3BwZXItZGlzY292ZXJ5LXNlYXJjaCBzZmNjLnNob3BwZXItbXlhY2NvdW50LnJ3IHNmY2Muc2hvcHBlci1teWFjY291bnQucGF5bWVudGluc3RydW1lbnRzIHNmY2Muc2hvcHBlci1jdXN0b21lcnMubG9naW4gc2ZjYy5zaG9wcGVyLWV4cGVyaWVuY2Ugc2ZjYy5zaG9wcGVyLW15YWNjb3VudC5vcmRlcnMgc2ZjYy5zaG9wcGVyLWN1c3RvbWVycy5yZWdpc3RlciBzZmNjLnNob3BwZXItYmFza2V0cy1vcmRlcnMgc2ZjYy5zaG9wcGVyLW15YWNjb3VudC5hZGRyZXNzZXMucncgc2ZjYy5zaG9wcGVyLW15YWNjb3VudC5wcm9kdWN0bGlzdHMucncgc2ZjYy5zaG9wcGVyLXByb2R1Y3RsaXN0cyBzZmNjLnNob3BwZXItcHJvbW90aW9ucyBzZmNjLnNob3BwZXItYmFza2V0cy1vcmRlcnMucncgc2ZjYy5zaG9wcGVyLW15YWNjb3VudC5wYXltZW50aW5zdHJ1bWVudHMucncgc2ZjYy5zaG9wcGVyLWdpZnQtY2VydGlmaWNhdGVzIHNmY2Muc2hvcHBlci1wcm9kdWN0LXNlYXJjaCBzZmNjLnNob3BwZXItbXlhY2NvdW50LnByb2R1Y3RsaXN0cyBzZmNjLnNob3BwZXItY2F0ZWdvcmllcyBzZmNjLnNob3BwZXItbXlhY2NvdW50Iiwic3ViIjoiY2Mtc2xhczo6enpyZl8wMDE6OnNjaWQ6YzljNDViZmQtMGVkMy00YWEyLTk5NzEtNDBmODg5NjJiODM2Ojp1c2lkOmI0ODY1MjMzLWRlOTItNDAzOS1iOTQ0LWFhMmRmYzhjMWVhNSIsImN0eCI6InNsYXMiLCJpc3MiOiJzbGFzL3Byb2QvenpyZl8wMDEiLCJpc3QiOjEsImF1ZCI6ImNvbW1lcmNlY2xvdWQvcHJvZC96enJmXzAwMSIsIm5iZiI6MTY3ODY4MTA2NCwic3R5IjoiVXNlciIsImlzYiI6InVpZG86ZWNvbTo6dXBuOmFyYXlhbmF2YXJyb0BzYWxlc2ZvcmNlLmNvbTo6dWlkbjpGaXJzdE5hbWUgTGFzdE5hbWU6OmdjaWQ6YWJ3SG8ybEhzV2tYa1J4ZXMza0dZWWtiazM6OnJjaWQ6YWJqYmVNbElUYnJnb3lBQzZNZHlHR1I5QzU6OmNoaWQ6UmVmQXJjaEdsb2JhbCIsImV4cCI6MTY3ODY4Mjg5NCwiaWF0IjoxNjc4NjgxMDk0LCJqdGkiOiJDMkM0ODU2MjAxODYwLTE4OTA2Nzg5MDM0NjUyNjI1NjM1NTY5OTE5In0.WV-iEj55UQjHzJpDeHWIbKmznPolb6bLGbVvfyFGLvTMYT2Wn2sZU8jiZ9pTdIIr97zWyd-RWM4cm22NUkNyGA'
        const auth = new Auth({...config, fetchedToken})
        await auth.ready().then(() => {
            expect(auth.get('access_token')).toBe(fetchedToken)
            expect(auth.get('customer_id')).toBe('abjbeMlITbrgoyAC6MdyGGR9C5')
            expect(auth.get('usid')).toBe('b4865233-de92-4039-b944-aa2dfc8c1ea5')
            expect(auth.get('customer_type')).toBe('registered')
        })
    })
    test('ready - use `fetchedToken` and auth data is populated for guest user', async () => {
        const fetchedToken = 'eyJ2ZXIiOiIxLjAiLCJqa3UiOiJzbGFzL3Byb2QvenpyZl8wMDEiLCJraWQiOiJiMjNkZTU5YS1iMTk3LTQyNTAtODdkNy1mNDFmNmUzNjcwNzciLCJ0eXAiOiJqd3QiLCJjbHYiOiJKMi4zLjQiLCJhbGciOiJFUzI1NiJ9.eyJhdXQiOiJHVUlEIiwic2NwIjoic2ZjYy5zaG9wcGVyLW15YWNjb3VudC5iYXNrZXRzIHNmY2Muc2hvcHBlci1teWFjY291bnQuYWRkcmVzc2VzIHNmY2Muc2hvcHBlci1wcm9kdWN0cyBzZmNjLnNob3BwZXItZGlzY292ZXJ5LXNlYXJjaCBzZmNjLnNob3BwZXItbXlhY2NvdW50LnJ3IHNmY2Muc2hvcHBlci1teWFjY291bnQucGF5bWVudGluc3RydW1lbnRzIHNmY2Muc2hvcHBlci1jdXN0b21lcnMubG9naW4gc2ZjYy5zaG9wcGVyLWV4cGVyaWVuY2Ugc2ZjYy5zaG9wcGVyLW15YWNjb3VudC5vcmRlcnMgc2ZjYy5zaG9wcGVyLWN1c3RvbWVycy5yZWdpc3RlciBzZmNjLnNob3BwZXItYmFza2V0cy1vcmRlcnMgc2ZjYy5zaG9wcGVyLW15YWNjb3VudC5hZGRyZXNzZXMucncgc2ZjYy5zaG9wcGVyLW15YWNjb3VudC5wcm9kdWN0bGlzdHMucncgc2ZjYy5zaG9wcGVyLXByb2R1Y3RsaXN0cyBzZmNjLnNob3BwZXItcHJvbW90aW9ucyBzZmNjLnNob3BwZXItYmFza2V0cy1vcmRlcnMucncgc2ZjYy5zaG9wcGVyLW15YWNjb3VudC5wYXltZW50aW5zdHJ1bWVudHMucncgc2ZjYy5zaG9wcGVyLWdpZnQtY2VydGlmaWNhdGVzIHNmY2Muc2hvcHBlci1wcm9kdWN0LXNlYXJjaCBzZmNjLnNob3BwZXItbXlhY2NvdW50LnByb2R1Y3RsaXN0cyBzZmNjLnNob3BwZXItY2F0ZWdvcmllcyBzZmNjLnNob3BwZXItbXlhY2NvdW50Iiwic3ViIjoiY2Mtc2xhczo6enpyZl8wMDE6OnNjaWQ6YzljNDViZmQtMGVkMy00YWEyLTk5NzEtNDBmODg5NjJiODM2Ojp1c2lkOjczN2ZiZDQwLWE2N2YtNDI4MS1iMjNmLTEyMzFlMzJmOWVlNSIsImN0eCI6InNsYXMiLCJpc3MiOiJzbGFzL3Byb2QvenpyZl8wMDEiLCJpc3QiOjEsImF1ZCI6ImNvbW1lcmNlY2xvdWQvcHJvZC96enJmXzAwMSIsIm5iZiI6MTY3ODY4NTk1OSwic3R5IjoiVXNlciIsImlzYiI6InVpZG86c2xhczo6dXBuOkd1ZXN0Ojp1aWRuOkd1ZXN0IFVzZXI6OmdjaWQ6YmNsWGsxeEtoSWxiYVJ3cncxeEdZWWtIRVY6OmNoaWQ6ICIsImV4cCI6MTY3ODY4Nzc4OSwiaWF0IjoxNjc4Njg1OTg5LCJqdGkiOiJDMkM0ODU2MjAxODYwLTE4OTA2Nzg5MDM0NjU3NDI4MTYxMDQ3Njk4In0.WJUcC7rKHzOZ91ccmn95RXnhjmsFI1WWPyauQXtl-oDwD0OKiaQy1TLFmWrVVpZWgkJekQ-9w6AolqeEo5zWHA'
        const auth = new Auth({...config, fetchedToken})
        await auth.ready().then(() => {
            expect(auth.get('access_token')).toBe(fetchedToken)
            expect(auth.get('customer_id')).toBe('bclXk1xKhIlbaRwrw1xGYYkHEV')
            expect(auth.get('usid')).toBe('737fbd40-a67f-4281-b23f-1231e32f9ee5')
            expect(auth.get('customer_type')).toBe('guest')
        })
    })
    test('ready - use refresh token when access token is expired', async () => {
        const auth = new Auth(config)

        const data: StoredAuthData = {
            refresh_token_guest: 'refresh_token_guest',
            access_token: jwt.sign({exp: Math.floor(Date.now() / 1000) - 1000}, 'secret'),
            customer_id: 'customer_id',
            enc_user_id: 'enc_user_id',
            expires_in: 1800,
            id_token: 'id_token',
            idp_access_token: 'idp_access_token',
            token_type: 'token_type',
            usid: 'usid',
            customer_type: 'guest'
        }
        // Convert stored format to exposed format
        const result = {...data, refresh_token: 'refresh_token_guest'}
        delete result.refresh_token_guest

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
    test('running on the server uses a shared context memory store', async () => {
        const refreshTokenGuest = 'guest'

        // Mock running on the server so shared context storage is used.
        // @ts-expect-error read-only property
        utils.onClient = () => false

        // Create a new auth instance and set its guest token.
        const authA = new Auth({...config, siteId: 'siteA'})
        // @ts-expect-error private method
        authA.set('refresh_token_guest', refreshTokenGuest)
        // @ts-expect-error private property
        expect([...authA.stores['memory'].map.keys()]).toEqual([`siteA_cc-nx-g`])

        // Create a second auth instance and ensure that its memory store has previous
        // guest tokens set from the first store (this emulates a second lambda request.)
        const authB = new Auth({...config, siteId: 'siteB'})
        // @ts-expect-error private method
        authB.set('refresh_token_guest', refreshTokenGuest)

        // @ts-expect-error private property
        expect([...authB.stores['memory'].map.keys()]).toEqual([`siteA_cc-nx-g`, `siteB_cc-nx-g`])

        // Set mock value back to expected.
        // @ts-expect-error read-only property
        utils.onClient = () => true
    })
})
