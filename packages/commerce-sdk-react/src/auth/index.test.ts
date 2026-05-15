/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import Auth, {AuthData} from './'
import {waitFor} from '@testing-library/react'
import jwt from 'jsonwebtoken'
import {
    helpers,
    ShopperCustomersTypes,
    ShopperCustomers,
    ShopperLogin
} from 'commerce-sdk-isomorphic'
import * as utils from '../utils'
import {SLAS_SECRET_PLACEHOLDER, X_GRANT_TYPE} from '../constant'
import {ShopperLoginTypes} from 'commerce-sdk-isomorphic'
import {
    DEFAULT_SLAS_REFRESH_TOKEN_REGISTERED_TTL,
    DEFAULT_SLAS_REFRESH_TOKEN_GUEST_TTL,
    pendingRefreshTokens
} from './index'
import {RequireKeys} from '../hooks/types'

const baseCustomer: RequireKeys<ShopperCustomersTypes.Customer, 'login'> = {
    customerId: 'customerId',
    login: 'test@test.com'
}

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
            loginGuestUserPrivate: jest.fn().mockResolvedValue(''),
            loginRegisteredUserB2C: jest.fn().mockResolvedValue(''),
            logout: jest.fn().mockResolvedValue(''),
            handleTokenResponse: jest.fn().mockResolvedValue(''),
            loginIDPUser: jest.fn().mockResolvedValue(''),
            authorizeIDP: jest.fn().mockResolvedValue({
                url: 'https://example.com/authorize?code_challenge=test&redirect_uri=test',
                codeVerifier: 'test-code-verifier'
            }),
            authorizePasswordless: jest.fn().mockResolvedValue(''),
            getPasswordLessAccessToken: jest.fn().mockResolvedValue(''),
            createCodeVerifier: jest.fn().mockReturnValue('test-code-verifier'),
            generateCodeChallenge: jest.fn().mockResolvedValue('test-code-challenge')
        },
        ShopperLogin: jest.fn().mockImplementation((config) => ({
            clientConfig: {
                parameters: {
                    organizationId: 'organizationId',
                    clientId: 'clientId',
                    siteId: 'siteId'
                },
                headers: config?.headers || {},
                fetchOptions: {
                    credentials: config?.fetchOptions?.credentials || 'same-origin'
                }
            },
            getPasswordResetToken: jest.fn().mockResolvedValue({}),
            resetPassword: jest.fn().mockResolvedValue({})
        }))
    }
})

jest.mock('../utils', () => ({
    ...jest.requireActual('../utils'),
    __esModule: true,
    onClient: jest.fn().mockReturnValue(true),
    getParentOrigin: jest.fn().mockResolvedValue(''),
    isOriginTrusted: () => false,
    getDefaultCookieAttributes: () => {},
    isAbsoluteUrl: () => true
}))

const onClientMock = utils.onClient as jest.Mock

/** The auth data we store has a slightly different shape than what we use. */
type StoredAuthData = Omit<AuthData, 'refresh_token'> & {refresh_token_guest?: string}

const config = {
    clientId: 'clientId',
    organizationId: 'organizationId',
    shortCode: 'shortCode',
    siteId: 'siteId',
    proxy: 'proxy',
    redirectURI: 'redirectURI',
    logger: console,
    passwordlessLoginCallbackURI: 'passwordlessLoginCallbackURI'
}

const configSLASPrivate = {
    ...config,
    enablePWAKitPrivateClient: true
}
const JWTNotExpired = jwt.sign(
    {
        exp: Math.floor(Date.now() / 1000) + 1000,
        sub: `cc-slas::zzrf_001::scid:xxxxxx::usid:usid`,
        isb: `uido:ecom::upn:test@gmail.com::uidn:firstname lastname::gcid:guestuserid::rcid:rcid::chid:siteId`
    },
    'secret'
)
const JWTExpired = jwt.sign(
    {
        exp: Math.floor(Date.now() / 1000) - 1000,
        sub: `cc-slas::zzrf_001::scid:xxxxxx::usid:usid`,
        isb: `uido:ecom::upn:test@gmail.com::uidn:firstname lastname::gcid:guestuserid::rcid:rcid::chid:siteId`
    },
    'secret'
)

const FAKE_SLAS_EXPIRY = DEFAULT_SLAS_REFRESH_TOKEN_REGISTERED_TTL - 1

const TOKEN_RESPONSE: ShopperLoginTypes.TokenResponse = {
    access_token:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjYy1zbGFzOjp6enJmXzAwMTo6c2NpZDpjOWM0NWJmZC0wZWQzLTRhYTIteHh4eC00MGY4ODk2MmI4MzY6OnVzaWQ6YjQ4NjUyMzMtZGU5Mi00MDM5LXh4eHgtYWEyZGZjOGMxZWE1IiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJpc2IiOiJ1aWRvOmVjb206OnVwbjpHdWVzdHx8am9obi5kb2VAZXhhbXBsZS5jb206OnVpZG46Sm9obiBEb2U6OmdjaWQ6Z3Vlc3QtMTIzNDU6OnJjaWQ6cmVnaXN0ZXJlZC02Nzg5MCIsImRudCI6InRlc3QifQ.9yKtUb22ExO-Q4VNQRAyIgTm63l3x5z45Uu1FIQa5dQ',
    customer_id: 'customer_id_xyz',
    enc_user_id: 'enc_user_id_xyz',
    expires_in: 1800,
    id_token: 'id_token_xyz',
    refresh_token: 'refresh_token_xyz',
    token_type: 'Bearer',
    usid: 'usid_xyz',
    idp_access_token: 'idp_access_token_xyz',
    // test that this is authoritative and not set to
    // `DEFAULT_SLAS_REFRESH_TOKEN_REGISTERED_TTL` when config.refreshTokenRegisteredCookieTTL is not set
    refresh_token_expires_in: FAKE_SLAS_EXPIRY
}

describe('Auth', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        pendingRefreshTokens.clear()
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
            token_type: 'Bearer',
            usid: 'usid',
            customer_type: 'guest',
            refresh_token_expires_in: FAKE_SLAS_EXPIRY
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
        // @ts-expect-error private method
        expect(auth.isTokenExpired(JWTNotExpired)).toBe(false)
        // @ts-expect-error private method
        expect(auth.isTokenExpired(JWTExpired)).toBe(true)
        // @ts-expect-error private method
        expect(() => auth.isTokenExpired()).toThrow()
    })
    test('getAccessToken from local store', () => {
        const auth = new Auth(config)
        // @ts-expect-error private method
        auth.set('access_token', 'token')
        // @ts-expect-error private method
        expect(auth.getAccessToken()).toBe('token')
    })
    test('use SFRA token over local store token if present', () => {
        const customerId = 'customerId'
        const customerType = 'guest'
        const customerTypeUpperCase = 'Guest'
        const usid = 'usid'
        const sfraJWT = jwt.sign(
            {
                exp: Math.floor(Date.now() / 1000) + 1000,
                isb: `uido:slas::upn:${customerTypeUpperCase}::uidn:Guest User::gcid:${customerId}::chid:siteId`,
                sub: `cc-slas::realm::scid:scid::usid:${usid}`
            },
            'secret'
        )

        const auth = new Auth(config)
        // @ts-expect-error private method
        auth.set('access_token', 'token')
        // @ts-expect-error private method
        auth.set('access_token_sfra', sfraJWT)
        // @ts-expect-error private method
        expect(auth.getAccessToken()).toBe(sfraJWT)
        expect(auth.get('access_token_sfra')).toBeFalsy()

        // Check that local store is updated
        expect(auth.get('access_token')).toBe(sfraJWT)
        expect(auth.get('customer_id')).toBe(customerId)
        expect(auth.get('customer_type')).toBe(customerType)
        expect(auth.get('usid')).toBe(usid)
    })
    test('access token is cleared if SFRA sends refresh', () => {
        const auth = new Auth(config)
        // @ts-expect-error private method
        auth.set('access_token', 'token')
        // @ts-expect-error private method
        auth.set('access_token_sfra', 'refresh')
        // @ts-expect-error private method
        expect(auth.getAccessToken()).toBeFalsy()
        expect(auth.get('access_token_sfra')).toBeFalsy()
    })
    test('clear SFRA auth tokens', () => {
        const auth = new Auth(config)
        // @ts-expect-error private method
        auth.set('access_token_sfra', '123')
        // @ts-expect-error private method
        auth.clearSFRAAuthToken()

        expect(auth.get('access_token_sfra')).toBeFalsy()
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
    test('ready - re-use pending refresh from module-level map', async () => {
        const auth = new Auth(config)
        const data: Record<string, string> = {
            refresh_token_guest: 'refresh_token_guest',
            access_token: 'access_token',
            customer_id: 'customer_id',
            enc_user_id: 'enc_user_id',
            expires_in: '1800',
            id_token: 'id_token',
            idp_access_token: 'idp_access_token',
            token_type: 'token_type',
            usid: 'usid',
            customer_type: 'guest'
        }
        // Populate storage to simulate tokens stored by a previous Auth instance
        Object.keys(data).forEach((key) => {
            // @ts-expect-error private method
            auth.set(key, data[key])
        })
        // Simulate an in-flight refresh from another Auth instance
        pendingRefreshTokens.set('refresh:siteId:clientId', Promise.resolve(data as any))

        const result = await auth.ready()
        expect(result.access_token).toBe('access_token')
        expect(result.customer_id).toBe('customer_id')
    })
    test('ready - re-use valid access token', async () => {
        const auth = new Auth(config)

        const data: StoredAuthData = {
            refresh_token_guest: 'refresh_token_guest',
            access_token: JWTNotExpired,
            customer_id: 'customer_id',
            enc_user_id: 'enc_user_id',
            expires_in: 1800,
            id_token: 'id_token',
            idp_access_token: 'idp_access_token',
            token_type: 'Bearer',
            usid: 'usid',
            customer_type: 'guest',
            refresh_token_expires_in: FAKE_SLAS_EXPIRY
        }
        // Convert stored format to exposed format
        const result = {...data, refresh_token: 'refresh_token_guest'}
        delete result.refresh_token_guest

        Object.keys(data).forEach((key) => {
            // @ts-expect-error private method
            auth.set(key, data[key])
        })

        await expect(auth.ready()).resolves.toEqual(result)
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
        await auth.ready()
        expect(helpers.refreshAccessToken).not.toHaveBeenCalled()
        expect(helpers.loginGuestUser).not.toHaveBeenCalled()
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

        // To simulate real-world scenario, let's first test with a good valid token
        const data: StoredAuthData = {
            refresh_token_guest: 'refresh_token_guest',
            access_token: JWTNotExpired,
            customer_id: 'customer_id',
            enc_user_id: 'enc_user_id',
            expires_in: 1800,
            id_token: 'id_token',
            idp_access_token: 'idp_access_token',
            token_type: 'Bearer',
            usid: 'usid',
            customer_type: 'guest',
            refresh_token_expires_in: 0
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

    test('ready - use refresh token when access token is expired with slas private client', async () => {
        const auth = new Auth(configSLASPrivate)

        await auth.ready()
        expect(helpers.refreshAccessToken).not.toHaveBeenCalled()

        // And then now test with an _expired_ token and a refresh token
        // @ts-expect-error private method
        auth.set('access_token', JWTExpired)
        // @ts-expect-error private method
        auth.set('refresh_token_guest', 'refresh_token')

        await auth.ready()
        expect(helpers.refreshAccessToken).toHaveBeenCalled()
        const funcArg = (helpers.refreshAccessToken as jest.Mock).mock.calls[0][0]
        expect(funcArg).toMatchObject({credentials: {clientSecret: SLAS_SECRET_PLACEHOLDER}})
    })
    test('ready - PKCE flow', async () => {
        const auth = new Auth(config)

        await auth.ready()
        expect(helpers.loginGuestUser).toHaveBeenCalled()
    })
    test('ready - throw error and discard refresh token if refresh token is invalid', async () => {
        // Force the mock to throw just for this test
        const refreshAccessTokenSpy = jest.spyOn(helpers, 'refreshAccessToken')
        refreshAccessTokenSpy.mockRejectedValueOnce({
            response: {
                json: () => {
                    return {
                        status_code: 404,
                        message: 'test'
                    }
                }
            }
        })

        // To simulate real-world scenario, let's start with an expired access token
        const data: StoredAuthData = {
            refresh_token_guest: 'refresh_token_guest',
            access_token: JWTExpired,
            customer_id: 'customer_id',
            enc_user_id: 'enc_user_id',
            expires_in: 1800,
            id_token: 'id_token',
            idp_access_token: 'idp_access_token',
            token_type: 'Bearer',
            usid: 'usid',
            customer_type: 'guest',
            refresh_token_expires_in: 30 * 24 * 3600
        }

        const auth = new Auth(config)

        Object.keys(data).forEach((key) => {
            // @ts-expect-error private method
            auth.set(key, data[key])
        })

        await auth.ready()

        // The call to loginGuestUser only executes when refreshAccessToken fails
        expect(refreshAccessTokenSpy).toHaveBeenCalled()
        expect(auth.get('refresh_token_guest')).toBe('')
        expect(helpers.loginGuestUser).toHaveBeenCalled()
    })

    test('loginGuestUser', async () => {
        const auth = new Auth(config)
        await auth.loginGuestUser()
        expect(helpers.loginGuestUser).toHaveBeenCalled()
    })

    test('loginGuestUser can pass along custom parameters', async () => {
        const parameters = {c_test: 'custom parameter'}
        const auth = new Auth(config)
        await auth.loginGuestUser(parameters)
        // The first argument is the SLAS config, which we don't need to verify in this case
        // We only want to see that the custom parameters were included in the second argument
        expect(helpers.loginGuestUser).toHaveBeenCalledWith(
            expect.objectContaining({
                parameters: expect.objectContaining({c_test: 'custom parameter'})
            })
        )
    })

    test('register only sends custom parameters to registered login', async () => {
        const registerCustomerSpy = jest
            .spyOn(ShopperCustomers.prototype, 'registerCustomer')
            .mockImplementation()
        const auth = new Auth(config)
        const inputToRegister = {
            customer: baseCustomer,
            password: 'test',
            someOtherParameter: 'this should not be passed to login',
            c_test: 'custom parameter'
        }

        await auth.register(inputToRegister)

        // Body should only include credentials. No other parameters
        expect(registerCustomerSpy).toHaveBeenCalledWith(
            expect.objectContaining({body: {customer: baseCustomer, password: 'test'}})
        )

        // We don't need to verify the first and third parameters as they correspond to the SLAS client and mandatory parameters
        // The second argument is credentials
        // We want to see that only the custom parameters were included in the fourth argument and not any other parameters
        expect(helpers.loginRegisteredUserB2C).toHaveBeenCalledWith(
            expect.objectContaining({
                body: {c_test: 'custom parameter'}
            })
        )
    })

    test.each([
        {defaultDnt: true, dw_dnt: NaN, expected: {dnt: true}},
        {defaultDnt: false, dw_dnt: NaN, expected: {dnt: false}},
        {defaultDnt: undefined, dw_dnt: NaN, expected: {dnt: false}},
        {defaultDnt: true, dw_dnt: 0, expected: {dnt: false}},
        {defaultDnt: false, dw_dnt: 1, expected: {dnt: true}},
        {defaultDnt: false, dw_dnt: 0, expected: {dnt: false}}
    ])(
        'dnt flag is set correctly for defaultDnt=`$defaultDnt`, dw_dnt=`$dw_dnt`, expected=`$expected`',
        async ({defaultDnt, dw_dnt, expected}) => {
            const auth = new Auth({
                ...config,
                defaultDnt
            })
            // Set the correct cookie value based on dw_dnt
            if (!isNaN(dw_dnt)) {
                // @ts-expect-error private method
                auth.set('dw_dnt', String(dw_dnt))
            }
            await auth.loginGuestUser()
            expect(helpers.loginGuestUser).toHaveBeenCalledWith(
                expect.objectContaining({
                    parameters: expect.objectContaining(expected)
                })
            )
        }
    )

    test.each([
        // auth config | expected return value
        [undefined, DEFAULT_SLAS_REFRESH_TOKEN_REGISTERED_TTL, true],
        [undefined, DEFAULT_SLAS_REFRESH_TOKEN_REGISTERED_TTL, false],
        [0, DEFAULT_SLAS_REFRESH_TOKEN_REGISTERED_TTL, false],
        [-1, DEFAULT_SLAS_REFRESH_TOKEN_REGISTERED_TTL, false],
        [
            DEFAULT_SLAS_REFRESH_TOKEN_REGISTERED_TTL + 1,
            DEFAULT_SLAS_REFRESH_TOKEN_REGISTERED_TTL,
            false
        ],
        [900, 900, false]
    ])(
        'refreshTokenRegisteredCookieTTL is set correctly for refreshTokenRegisteredCookieTTLValue=`%p`, expected=`%s`',
        async (refreshTokenRegisteredCookieTTL, expected, hasNoResponseValue) => {
            // Mock the loginRegisteredUserB2C helper to return a token response
            TOKEN_RESPONSE.refresh_token_expires_in = hasNoResponseValue
                ? 0
                : DEFAULT_SLAS_REFRESH_TOKEN_REGISTERED_TTL
            ;(helpers.loginRegisteredUserB2C as jest.Mock).mockResolvedValueOnce(TOKEN_RESPONSE)

            const auth = new Auth({...config, refreshTokenRegisteredCookieTTL})
            // Call the public method because the getter for refresh_token_expires_in is private
            await auth.loginRegisteredUserB2C({username: 'test', password: 'test'})
            expect(Number(auth.get('refresh_token_expires_in'))).toBe(expected)
        }
    )

    test.each([
        // auth config | expected return value
        [undefined, DEFAULT_SLAS_REFRESH_TOKEN_GUEST_TTL, true],
        [undefined, DEFAULT_SLAS_REFRESH_TOKEN_GUEST_TTL, false],
        [0, DEFAULT_SLAS_REFRESH_TOKEN_GUEST_TTL, false],
        [-1, DEFAULT_SLAS_REFRESH_TOKEN_GUEST_TTL, false],
        [DEFAULT_SLAS_REFRESH_TOKEN_GUEST_TTL + 1, DEFAULT_SLAS_REFRESH_TOKEN_GUEST_TTL, false],
        [900, 900, false]
    ])(
        'refreshTokenGuestCookieTTL is set correctly for refreshTokenGuestCookieTTLValue=`%p`, expected=`%s`',
        async (refreshTokenGuestCookieTTL, expected, hasNoResponseValue) => {
            // Mock the loginRegisteredUserB2C helper to return a token response
            TOKEN_RESPONSE.refresh_token_expires_in = hasNoResponseValue
                ? 0
                : DEFAULT_SLAS_REFRESH_TOKEN_GUEST_TTL
            ;(helpers.loginGuestUser as jest.Mock).mockResolvedValueOnce(TOKEN_RESPONSE)

            const auth = new Auth({...config, refreshTokenGuestCookieTTL})
            // Call the public method because the getter for refresh_token_expires_in is private
            await auth.loginGuestUser()
            expect(Number(auth.get('refresh_token_expires_in'))).toBe(expected)
        }
    )

    describe('USID expiry matches refresh token expiry', () => {
        let setSpy: jest.SpyInstance

        beforeEach(() => {
            setSpy = jest.spyOn(Auth.prototype as any, 'set')
        })

        afterEach(() => {
            setSpy.mockRestore()
        })

        test('USID is set with expiry matching guest refresh token expiry', async () => {
            const customTTL = 1800 // 30 minutes
            const auth = new Auth({...config, refreshTokenGuestCookieTTL: customTTL})

            // Mock the helper to return token response
            const tokenResponse: ShopperLoginTypes.TokenResponse = {
                ...TOKEN_RESPONSE,
                refresh_token_expires_in: customTTL
            }
            ;(helpers.loginGuestUser as jest.Mock).mockResolvedValueOnce(tokenResponse)

            await auth.loginGuestUser()

            // Verify USID was set with expiry
            const usidSetCall = setSpy.mock.calls.find((call) => call[0] === 'usid')
            expect(usidSetCall).toBeDefined()
            expect(usidSetCall[1]).toBe(tokenResponse.usid)
            expect(usidSetCall[2]).toMatchObject({
                expires: expect.any(Date)
            })

            // Verify the expiry date matches the refresh token expiry
            const refreshTokenSetCall = setSpy.mock.calls.find(
                (call) => call[0] === 'refresh_token_guest'
            )
            expect(refreshTokenSetCall).toBeDefined()
            expect(refreshTokenSetCall[2]).toMatchObject({
                expires: expect.any(Date)
            })

            // Both should have the same expiry date
            expect(usidSetCall[2].expires).toEqual(refreshTokenSetCall[2].expires)
        })

        test('USID is set with expiry matching registered refresh token expiry', async () => {
            const customTTL = 7200 // 2 hours
            const auth = new Auth({...config, refreshTokenRegisteredCookieTTL: customTTL})

            // Mock the helper to return token response
            const tokenResponse: ShopperLoginTypes.TokenResponse = {
                ...TOKEN_RESPONSE,
                refresh_token_expires_in: customTTL
            }
            ;(helpers.loginRegisteredUserB2C as jest.Mock).mockResolvedValueOnce(tokenResponse)

            await auth.loginRegisteredUserB2C({username: 'test', password: 'test'})

            // Verify USID was set with expiry
            const usidSetCall = setSpy.mock.calls.find((call) => call[0] === 'usid')
            expect(usidSetCall).toBeDefined()
            expect(usidSetCall[1]).toBe(tokenResponse.usid)
            expect(usidSetCall[2]).toMatchObject({
                expires: expect.any(Date)
            })

            // Verify the expiry date matches the refresh token expiry
            const refreshTokenSetCall = setSpy.mock.calls.find(
                (call) => call[0] === 'refresh_token_registered'
            )
            expect(refreshTokenSetCall).toBeDefined()
            expect(refreshTokenSetCall[2]).toMatchObject({
                expires: expect.any(Date)
            })

            // Both should have the same expiry date
            expect(usidSetCall[2].expires).toEqual(refreshTokenSetCall[2].expires)
        })

        test('USID expiry uses default guest TTL when no override is provided', async () => {
            const auth = new Auth(config)

            // Mock the helper to return token response with no refresh_token_expires_in
            const tokenResponse = {
                ...TOKEN_RESPONSE,
                refresh_token_expires_in: undefined
            } as unknown as ShopperLoginTypes.TokenResponse
            ;(helpers.loginGuestUser as jest.Mock).mockResolvedValueOnce(tokenResponse)

            await auth.loginGuestUser()

            // Verify USID was set with expiry
            const usidSetCall = setSpy.mock.calls.find((call) => call[0] === 'usid')
            expect(usidSetCall).toBeDefined()
            expect(usidSetCall[2]).toMatchObject({
                expires: expect.any(Date)
            })

            // Verify the expiry date matches the default guest TTL
            const expectedExpiryDate = new Date(
                Date.now() + DEFAULT_SLAS_REFRESH_TOKEN_GUEST_TTL * 1000
            )
            expect(usidSetCall[2].expires.getTime()).toBeCloseTo(expectedExpiryDate.getTime(), -2) // Within 100ms
        })

        test('USID expiry uses default registered TTL when no override is provided', async () => {
            const auth = new Auth(config)

            // Mock the helper to return token response with no refresh_token_expires_in
            const tokenResponse = {
                ...TOKEN_RESPONSE,
                refresh_token_expires_in: undefined
            } as unknown as ShopperLoginTypes.TokenResponse
            ;(helpers.loginRegisteredUserB2C as jest.Mock).mockResolvedValueOnce(tokenResponse)

            await auth.loginRegisteredUserB2C({username: 'test', password: 'test'})

            // Verify USID was set with expiry
            const usidSetCall = setSpy.mock.calls.find((call) => call[0] === 'usid')
            expect(usidSetCall).toBeDefined()
            expect(usidSetCall[2]).toMatchObject({
                expires: expect.any(Date)
            })

            // Verify the expiry date matches the default registered TTL
            const expectedExpiryDate = new Date(
                Date.now() + DEFAULT_SLAS_REFRESH_TOKEN_REGISTERED_TTL * 1000
            )
            expect(usidSetCall[2].expires.getTime()).toBeCloseTo(expectedExpiryDate.getTime(), -2) // Within 100ms
        })

        test('USID expiry uses response TTL when provided and no override', async () => {
            const responseTTL = 3600 // 1 hour
            const auth = new Auth(config)

            // Mock the helper to return token response with custom refresh_token_expires_in
            const tokenResponse: ShopperLoginTypes.TokenResponse = {
                ...TOKEN_RESPONSE,
                refresh_token_expires_in: responseTTL
            }
            ;(helpers.loginGuestUser as jest.Mock).mockResolvedValueOnce(tokenResponse)

            await auth.loginGuestUser()

            // Verify USID was set with expiry
            const usidSetCall = setSpy.mock.calls.find((call) => call[0] === 'usid')
            expect(usidSetCall).toBeDefined()
            expect(usidSetCall[2]).toMatchObject({
                expires: expect.any(Date)
            })

            // Verify the expiry date matches the response TTL
            const expectedExpiryDate = new Date(Date.now() + responseTTL * 1000)
            expect(usidSetCall[2].expires.getTime()).toBeCloseTo(expectedExpiryDate.getTime(), -2) // Within 100ms
        })

        test('USID expiry respects override TTL when provided', async () => {
            const overrideTTL = 900 // 15 minutes
            const responseTTL = 3600 // 1 hour (should be ignored)
            const auth = new Auth({...config, refreshTokenGuestCookieTTL: overrideTTL})

            // Mock the helper to return token response with different refresh_token_expires_in
            const tokenResponse: ShopperLoginTypes.TokenResponse = {
                ...TOKEN_RESPONSE,
                refresh_token_expires_in: responseTTL
            }
            ;(helpers.loginGuestUser as jest.Mock).mockResolvedValueOnce(tokenResponse)

            await auth.loginGuestUser()

            // Verify USID was set with expiry
            const usidSetCall = setSpy.mock.calls.find((call) => call[0] === 'usid')
            expect(usidSetCall).toBeDefined()
            expect(usidSetCall[2]).toMatchObject({
                expires: expect.any(Date)
            })

            // Verify the expiry date matches the override TTL, not the response TTL
            const expectedExpiryDate = new Date(Date.now() + overrideTTL * 1000)
            expect(usidSetCall[2].expires.getTime()).toBeCloseTo(expectedExpiryDate.getTime(), -2) // Within 100ms
        })
    })

    test('loginGuestUser with slas private', async () => {
        const auth = new Auth(configSLASPrivate)
        await auth.loginGuestUser()
        expect(helpers.loginGuestUserPrivate).toHaveBeenCalled()
        const funcArg = (helpers.loginGuestUserPrivate as jest.Mock).mock.calls[0][0]
        expect(funcArg).toMatchObject({credentials: {clientSecret: SLAS_SECRET_PLACEHOLDER}})
    })

    test('loginGuestUser throws error when API has error', async () => {
        // Force the mock to throw just for this test
        const loginGuestUserSpy = jest.spyOn(helpers, 'loginGuestUser')
        loginGuestUserSpy.mockRejectedValueOnce(new Error('test'))

        const auth = new Auth(config)
        await expect(auth.loginGuestUser()).rejects.toThrow()
        expect(helpers.loginGuestUser).toHaveBeenCalled()
    })

    test('loginRegisteredUserB2C', async () => {
        const auth = new Auth(config)
        await auth.loginRegisteredUserB2C({
            username: 'test',
            password: 'test'
        })
        expect(helpers.loginRegisteredUserB2C).toHaveBeenCalled()
        const functionArg = (helpers.loginRegisteredUserB2C as jest.Mock).mock.calls[0][0]
        expect(functionArg).toMatchObject({
            credentials: {username: 'test', password: 'test'}
        })
    })

    test('loginRegisteredUserB2C with slas private', async () => {
        const auth = new Auth(configSLASPrivate)
        await auth.loginRegisteredUserB2C({
            username: 'test',
            password: 'test'
        })
        expect(helpers.loginRegisteredUserB2C).toHaveBeenCalled()
        const functionArg = (helpers.loginRegisteredUserB2C as jest.Mock).mock.calls[0][0]
        expect(functionArg).toMatchObject({
            credentials: {
                username: 'test',
                password: 'test',
                clientSecret: SLAS_SECRET_PLACEHOLDER
            }
        })
    })

    test('loginRegisteredUserB2C can pass along custom parameters', async () => {
        const body = {
            username: 'test',
            password: 'test',
            customParameters: {c_test: 'custom parameter'}
        }
        const auth = new Auth(config)
        await auth.loginRegisteredUserB2C(body)
        // We don't need to verify the first and third parameters as they correspond to the SLAS client and mandatory parameters
        // The second argument is credentials, including the client secret
        // The fourth argument is custom parameters
        // We only want to see that the custom parameters were included in the fourth argument
        expect(helpers.loginRegisteredUserB2C).toHaveBeenCalledWith(
            expect.objectContaining({
                body: {c_test: 'custom parameter'}
            })
        )
    })

    test('loginIDPUser calls isomorphic loginIDPUser', async () => {
        const auth = new Auth(config)
        await auth.loginIDPUser({redirectURI: 'redirectURI', code: 'test'})
        expect(helpers.loginIDPUser).toHaveBeenCalled()
        const functionArg = (helpers.loginIDPUser as jest.Mock).mock.calls[0][0]
        expect(functionArg).toMatchObject({
            parameters: {redirectURI: 'redirectURI', code: 'test'}
        })
    })

    test('loginIDPUser adds clientSecret to parameters when using private client', async () => {
        const auth = new Auth(configSLASPrivate)
        await auth.loginIDPUser({redirectURI: 'test', code: 'test'})
        expect(helpers.loginIDPUser).toHaveBeenCalled()
        const functionArg = (helpers.loginIDPUser as jest.Mock).mock.calls[0][0]
        expect(functionArg).toMatchObject({
            credentials: {
                clientSecret: SLAS_SECRET_PLACEHOLDER
            }
        })
    })

    test('authorizeIDP calls helpers.authorizeIDP and handles client-side navigation', async () => {
        const auth = new Auth(config)
        const result = await auth.authorizeIDP({
            redirectURI: 'redirectURI',
            hint: 'test',
            c_customParam: 'customParam'
        })

        expect(helpers.authorizeIDP).toHaveBeenCalled()
        const functionArg = (helpers.authorizeIDP as jest.Mock).mock.calls[0][0]
        expect(functionArg).toMatchObject({
            parameters: expect.objectContaining({
                redirectURI: 'redirectURI',
                hint: 'test',
                c_customParam: 'customParam'
            })
        })

        // Should return the result from helpers.authorizeIDP
        expect(result).toHaveProperty('url')
        expect(result).toHaveProperty('codeVerifier')
    })

    test('authorizeIDP works with private client configuration', async () => {
        const auth = new Auth(configSLASPrivate)
        const result = await auth.authorizeIDP({redirectURI: 'test', hint: 'test'})

        expect(helpers.authorizeIDP).toHaveBeenCalled()
        expect(result).toHaveProperty('url')
        expect(result).toHaveProperty('codeVerifier')
    })

    test.each([
        [
            'with all parameters specified',
            {callbackURI: 'callbackURI', userid: 'userid', mode: 'callback', locale: 'en-US'},
            {
                callbackURI: 'callbackURI',
                userid: 'userid',
                mode: 'callback',
                locale: 'en-US'
            }
        ],
        [
            'defaults mode to callback when not specified',
            {userid: 'userid'},
            {userid: 'userid', mode: 'callback'}
        ],
        [
            'defaults callbackURI to passwordlessLoginCallbackURI when not specified',
            {userid: 'userid'},
            {
                userid: 'userid',
                mode: 'callback',
                callbackURI: configSLASPrivate.passwordlessLoginCallbackURI
            }
        ],
        ['with mode email', {userid: 'userid', mode: 'email'}, {userid: 'userid', mode: 'email'}]
    ])('authorizePasswordless %s', async (_, input: any, expectedParams: any) => {
        const auth = new Auth(configSLASPrivate)
        // @ts-expect-error private method
        auth.set('usid', 'test-usid-value')

        await auth.authorizePasswordless(input)
        expect(helpers.authorizePasswordless).toHaveBeenCalled()
        const functionArg = (helpers.authorizePasswordless as jest.Mock).mock.calls[0][0]
        expect(functionArg).toMatchObject({
            credentials: {
                clientSecret: SLAS_SECRET_PLACEHOLDER
            },
            parameters: {
                ...expectedParams,
                usid: 'test-usid-value'
            }
        })
    })

    test('authorizePasswordless without usid', async () => {
        const auth = new Auth(configSLASPrivate)

        await auth.authorizePasswordless({userid: 'userid'})
        expect(helpers.authorizePasswordless).toHaveBeenCalled()
        const functionArg = (helpers.authorizePasswordless as jest.Mock).mock.calls[0][0]
        expect(functionArg).toMatchObject({
            parameters: {
                userid: 'userid',
                mode: 'callback',
                callbackURI: configSLASPrivate.passwordlessLoginCallbackURI
            }
        })
        // Verify usid is not in parameters when not set
        expect(functionArg.parameters.usid).toBeUndefined()
    })

    test('authorizePasswordless without passwordlessLoginCallbackURI in config', async () => {
        const configWithoutCallback = {
            ...configSLASPrivate,
            passwordlessLoginCallbackURI: undefined
        }
        const auth = new Auth(configWithoutCallback)

        await auth.authorizePasswordless({userid: 'userid'})
        expect(helpers.authorizePasswordless).toHaveBeenCalled()
        const functionArg = (helpers.authorizePasswordless as jest.Mock).mock.calls[0][0]
        // callbackURI should not be in parameters when not configured
        expect(functionArg.parameters.callbackURI).toBeUndefined()
    })

    test('authorizePasswordless throws error on non-200 response', async () => {
        const auth = new Auth(configSLASPrivate)

        const mockErrorResponse = {
            status: 400,
            json: jest.fn().mockResolvedValue({message: 'Invalid request'})
        }
        ;(helpers.authorizePasswordless as jest.Mock).mockResolvedValueOnce(mockErrorResponse)

        await expect(auth.authorizePasswordless({userid: 'userid'})).rejects.toThrow(
            '400 Invalid request'
        )
    })

    test('getPasswordLessAccessToken calls isomorphic getPasswordLessAccessToken', async () => {
        const auth = new Auth(config)
        await auth.getPasswordLessAccessToken({pwdlessLoginToken: '12345678'})
        expect(helpers.getPasswordLessAccessToken).toHaveBeenCalled()
        const functionArg = (helpers.getPasswordLessAccessToken as jest.Mock).mock.calls[0][0]
        expect(functionArg).toMatchObject({
            parameters: {pwdlessLoginToken: '12345678'}
        })
    })

    test.each([
        [
            'with all parameters specified',
            {
                user_id: 'user@example.com',
                mode: 'email',
                channel_id: 'customChannelId',
                client_id: 'customClientId',
                callback_uri: 'https://example.com/callback',
                hint: 'custom_hint',
                locale: 'en-GB',
                idp_name: 'customIdp',
                code_challenge: 'test-code-challenge'
            },
            {
                user_id: 'user@example.com',
                mode: 'email',
                channel_id: 'customChannelId',
                client_id: 'customClientId',
                callback_uri: 'https://example.com/callback',
                hint: 'custom_hint',
                locale: 'en-GB',
                idp_name: 'customIdp',
                code_challenge: 'test-code-challenge'
            }
        ],
        [
            'defaults all parameters when only required parameters are specified',
            {user_id: 'user@example.com'},
            {
                user_id: 'user@example.com',
                mode: 'callback',
                channel_id: config.siteId,
                client_id: config.clientId,
                hint: 'cross_device'
            }
        ]
    ])('getPasswordResetToken %s', async (_, input: any, expectedBody: any) => {
        const auth = new Auth(config)
        // @ts-expect-error private property
        const getPasswordResetTokenSpy = jest.spyOn(auth.client, 'getPasswordResetToken')
        getPasswordResetTokenSpy.mockReturnValueOnce(
            Promise.resolve({
                status: 200,
                json: jest.fn().mockResolvedValue({})
            } as unknown as Response)
        )

        await auth.getPasswordResetToken(input)
        expect(getPasswordResetTokenSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                body: expect.objectContaining(expectedBody)
            }),
            // rawResponse is set to true
            true
        )
    })

    test('getPasswordResetToken with private client sets Authorization header', async () => {
        const auth = new Auth(configSLASPrivate)
        // @ts-expect-error private property
        const getPasswordResetTokenSpy = jest.spyOn(auth.client, 'getPasswordResetToken')
        getPasswordResetTokenSpy.mockReturnValueOnce(
            Promise.resolve({
                status: 200,
                json: jest.fn().mockResolvedValue({})
            } as unknown as Response)
        )

        await auth.getPasswordResetToken({
            user_id: 'user@example.com',
            mode: 'email',
            channel_id: 'channel_id'
        })

        expect(getPasswordResetTokenSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                headers: expect.objectContaining({Authorization: expect.stringContaining('Basic ')})
            }),
            // rawResponse is set to true
            true
        )
    })

    test('getPasswordResetToken throws error on non-200 response', async () => {
        const auth = new Auth(configSLASPrivate)

        const mockErrorResponse = {
            status: 400,
            json: jest.fn().mockResolvedValue({message: 'Invalid request'})
        }
        // @ts-expect-error private property
        const getPasswordResetTokenSpy = jest.spyOn(auth.client, 'getPasswordResetToken')
        getPasswordResetTokenSpy.mockReturnValueOnce(
            Promise.resolve(mockErrorResponse as unknown as Response)
        )

        await expect(
            auth.getPasswordResetToken({user_id: 'userid', mode: 'email', channel_id: 'channel_id'})
        ).rejects.toThrow('400 Invalid request')
    })

    test.each([
        [
            'with all parameters specified',
            {
                pwd_action_token: '12345678',
                new_password: 'newPassword123',
                channel_id: 'customChannelId',
                client_id: 'customClientId',
                hint: 'custom_hint',
                code_verifier: 'test-code-verifier'
            },
            {
                pwd_action_token: '12345678',
                new_password: 'newPassword123',
                channel_id: 'customChannelId',
                client_id: 'customClientId',
                hint: 'custom_hint',
                code_verifier: 'test-code-verifier'
            }
        ],
        [
            'defaults all parameters when only required parameters are specified',
            {
                pwd_action_token: '12345678',
                new_password: 'newPassword123'
            },
            {
                pwd_action_token: '12345678',
                new_password: 'newPassword123',
                channel_id: config.siteId,
                client_id: config.clientId,
                hint: 'cross_device'
            }
        ]
    ])(
        'resetPassword %s',
        async (
            _,
            input: Partial<ShopperLoginTypes.resetPasswordBodyType>,
            expectedBody: Partial<ShopperLoginTypes.resetPasswordBodyType>
        ) => {
            const auth = new Auth(config)
            // @ts-expect-error private property
            const resetPasswordSpy = jest.spyOn(auth.client, 'resetPassword')
            await auth.resetPassword(input as ShopperLoginTypes.resetPasswordBodyType)

            expect(resetPasswordSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    body: expect.objectContaining(expectedBody)
                })
            )
        }
    )

    test('resetPassword with private client sets Authorization header', async () => {
        const auth = new Auth(configSLASPrivate)
        // @ts-expect-error private property
        const resetPasswordSpy = jest.spyOn(auth.client, 'resetPassword')

        await auth.resetPassword({
            pwd_action_token: '12345678',
            new_password: 'newPassword123'
        } as ShopperLoginTypes.resetPasswordBodyType)

        expect(resetPasswordSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                headers: expect.objectContaining({Authorization: expect.stringContaining('Basic ')})
            })
        )
    })

    test('logout as registered user calls isomorphic logout', async () => {
        const auth = new Auth(config)
        // simulate logging in as login function is mocked
        // @ts-expect-error private method
        auth.set('customer_type', 'registered')

        await auth.logout()
        expect(helpers.logout).toHaveBeenCalled()
        expect(helpers.loginGuestUser).toHaveBeenCalled()
    })
    test('logout as guest user does not call isomorphic logout', async () => {
        const auth = new Auth(config)
        await auth.logout()
        expect(helpers.logout).not.toHaveBeenCalled()
        expect(helpers.loginGuestUser).toHaveBeenCalled()
    })
    test('logout with enableHttpOnlySessionCookies awaits the logout call', async () => {
        const logoutMock = helpers.logout as jest.Mock
        let resolveLogout: (value: unknown) => void
        logoutMock.mockImplementation(() => new Promise((resolve) => (resolveLogout = resolve)))
        const auth = new Auth({...config, enableHttpOnlySessionCookies: true})
        // @ts-expect-error private method
        auth.set('customer_type', 'registered')

        let logoutDone = false
        const logoutPromise = auth.logout().then(() => (logoutDone = true))

        // logout() should not resolve until the helpers.logout promise resolves
        await new Promise((r) => setTimeout(r, 10))
        expect(logoutDone).toBe(false)

        resolveLogout!('')
        await logoutPromise
        expect(logoutDone).toBe(true)
        expect(logoutMock).toHaveBeenCalled()
    })
    test('logout with enableHttpOnlySessionCookies swallows SLAS errors and logs warning', async () => {
        const logoutMock = helpers.logout as jest.Mock
        logoutMock.mockRejectedValue(new Error('SLAS error'))
        const warnSpy = jest.spyOn(console, 'warn').mockImplementation()
        const auth = new Auth({...config, enableHttpOnlySessionCookies: true})
        // @ts-expect-error private method
        auth.set('customer_type', 'registered')

        // Should not throw
        await auth.logout()
        expect(logoutMock).toHaveBeenCalled()
        expect(helpers.loginGuestUser).toHaveBeenCalled()
        expect(warnSpy).toHaveBeenCalledWith(
            expect.stringContaining(
                'SLAS logout failed: SLAS error. The error is ignored and session cookies are still cleared by the proxy.'
            )
        )
        warnSpy.mockRestore()
    })
    test('logout without enableHttpOnlySessionCookies does not await the logout call', async () => {
        const logoutMock = helpers.logout as jest.Mock
        let resolveLogout: (value: unknown) => void
        logoutMock.mockImplementation(() => new Promise((resolve) => (resolveLogout = resolve)))
        const auth = new Auth(config)
        // @ts-expect-error private method
        auth.set('customer_type', 'registered')

        // logout() should resolve immediately (fire-and-forget) without waiting for helpers.logout
        await auth.logout()
        expect(logoutMock).toHaveBeenCalled()
        expect(helpers.loginGuestUser).toHaveBeenCalled()

        // Clean up the dangling promise
        resolveLogout!('')
    })
    test('updateCustomerPassword calls registered login', async () => {
        jest.spyOn(ShopperCustomers.prototype, 'updateCustomerPassword').mockImplementation()
        const auth = new Auth(config)
        await auth.updateCustomerPassword({
            customer: baseCustomer,
            password: 'test123',
            currentPassword: 'test12',
            shouldReloginCurrentSession: true
        })
        expect(helpers.loginRegisteredUserB2C).toHaveBeenCalled()
    })
    test('PWA private client mode takes priority', async () => {
        const auth = new Auth({...configSLASPrivate, clientSecret: 'someSecret'})
        await auth.loginGuestUser()
        expect(helpers.loginGuestUserPrivate).toHaveBeenCalled()
        const funcArg = (helpers.loginGuestUserPrivate as jest.Mock).mock.calls[0][0]
        expect(funcArg).toMatchObject({
            credentials: {clientSecret: SLAS_SECRET_PLACEHOLDER}
        })
    })
    test('Can set a client secret', async () => {
        const auth = new Auth({...config, clientSecret: 'someSecret'})
        await auth.loginGuestUser()
        expect(helpers.loginGuestUserPrivate).toHaveBeenCalled()
        const funcArg = (helpers.loginGuestUserPrivate as jest.Mock).mock.calls[0][0]
        expect(funcArg).toMatchObject({
            credentials: {clientSecret: 'someSecret'}
        })
    })

    test('running on the server uses a shared context memory store', () => {
        const refreshTokenGuest = 'guest'

        // Mock running on the server so shared context storage is used.
        onClientMock.mockReturnValue(false)

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
        onClientMock.mockReturnValue(true)
    })

    test.each([
        // When user has not selected DNT pref
        [true, '1'],
        [false, '0'],
        [null, '0']
    ])('setDNT(true) results dw_dnt=1', async (newDntPref, expectedDwDnt) => {
        const auth = new Auth({...config, siteId: 'siteA'})
        await auth.setDnt(newDntPref)
        expect(auth.get('dw_dnt')).toBe(expectedDwDnt)
    })

    test('setDNT(null) results in defaultDnt if defaultDnt is defined', async () => {
        const auth = new Auth({...config, siteId: 'siteA', defaultDnt: true})
        await auth.setDnt(null)
        expect(auth.get('dw_dnt')).toBe('1')
    })

    test('setDNT(true) sets cookie with an expiration time', async () => {
        const setDntSpiedOn = jest.spyOn(Auth.prototype as any, 'set')
        const auth = new Auth({...config, siteId: 'siteA'})
        await auth.setDnt(true)
        expect(setDntSpiedOn).toHaveBeenLastCalledWith(
            'dw_dnt',
            '1',
            expect.objectContaining({expires: expect.any(Number)})
        )
    })

    test('setDNT(false) sets cookie with an expiration time', async () => {
        const setDntSpiedOn = jest.spyOn(Auth.prototype as any, 'set')
        const auth = new Auth({...config, siteId: 'siteA'})
        await auth.setDnt(false)
        expect(setDntSpiedOn).toHaveBeenLastCalledWith(
            'dw_dnt',
            '0',
            expect.objectContaining({expires: expect.any(Number)})
        )
    })

    test('setDNT(null) sets cookie WITHOUT an expiration time', async () => {
        const setDntSpiedOn = jest.spyOn(Auth.prototype as any, 'set')
        const auth = new Auth({...config, siteId: 'siteA'})
        await auth.setDnt(null)
        await waitFor(() => {
            expect(setDntSpiedOn).not.toHaveBeenCalledWith(
                'dw_dnt',
                '1',
                expect.objectContaining({expires: expect.any(Number)})
            )
        })
    })

    test('getDnt() returns undefined if token and cookie value is conflicting', async () => {
        const getSpiedOn = jest.spyOn(Auth.prototype as any, 'get')
        const parseSlasJWTSpiedOn = jest.spyOn(Auth.prototype as any, 'parseSlasJWT')
        parseSlasJWTSpiedOn.mockReturnValue({
            dnt: '1'
        })
        getSpiedOn.mockReturnValue('0')

        const auth = new Auth({...config, siteId: 'siteA'})
        auth.getDnt()
        await waitFor(() => {
            expect(auth.getDnt()).toBeUndefined()
        })
        getSpiedOn.mockRestore()
        parseSlasJWTSpiedOn.mockRestore()
    })

    test('getDnt() trusts dw_dnt with HttpOnly cookies enabled when no access token dnt', () => {
        const auth = new Auth({...config, enableHttpOnlySessionCookies: true})
        // @ts-expect-error private method
        auth.set('dw_dnt', '1')
        // No cc-at-dnt set, so getDntFromAccessToken returns undefined → assumed in sync
        expect(auth.getDnt()).toBe(true)
    })

    test('getDnt() deletes dw_dnt when out of sync with cc-at-dnt (HttpOnly)', () => {
        const auth = new Auth({...config, enableHttpOnlySessionCookies: true})
        // @ts-expect-error private method
        auth.set('dw_dnt', '0')
        // @ts-expect-error private method
        auth.set('cc-at-dnt', '1')
        // dw_dnt should be deleted because it disagrees with cc-at-dnt
        expect(auth.getDnt()).toBeUndefined()
        expect(auth.get('dw_dnt')).toBeFalsy()
    })

    test('token call clears SFRA auth token cookie and sets all token from the response', async () => {
        const getDntSpy = jest.spyOn(Auth.prototype, 'getDnt')
        getDntSpy.mockImplementation((options?: {includeDefaults: boolean}) => {
            if (options?.includeDefaults) {
                return false
            }
            return undefined
        })
        const auth = new Auth(config)

        // Set up initial SFRA auth token
        // @ts-expect-error private method
        auth.set('access_token_sfra', 'sfra_token')

        // Verify the token was set correctly
        expect(auth.get('access_token_sfra')).toBe('sfra_token')

        // Mock the token response that loginGuestUser will return
        const tokenResponse: ShopperLoginTypes.TokenResponse = {
            access_token:
                'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjYy1zbGFzOjp6enJmXzAwMTo6c2NpZDpjOWM0NWJmZC0wZWQzLTRhYTIteHh4eC00MGY4ODk2MmI4MzY6OnVzaWQ6YjQ4NjUyMzMtZGU5Mi00MDM5LXh4eHgtYWEyZGZjOGMxZWE1IiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJpc2IiOiJ1aWRvOmVjb206OnVwbjpHdWVzdHx8am9obi5kb2VAZXhhbXBsZS5jb206OnVpZG46Sm9obiBEb2U6OmdjaWQ6Z3Vlc3QtMTIzNDU6OnJjaWQ6cmVnaXN0ZXJlZC02Nzg5MCIsImRudCI6InRlc3QifQ.9yKtUb22ExO-Q4VNQRAyIgTm63l3x5z45Uu1FIQa5dQ',
            customer_id: 'customer_id_xyz',
            enc_user_id: 'enc_user_id_xyz',
            expires_in: 1800,
            id_token: 'id_token_xyz',
            refresh_token: 'refresh_token_xyz',
            token_type: 'Bearer',
            usid: 'usid_xyz',
            idp_access_token: 'idp_access_token_xyz',
            refresh_token_expires_in: DEFAULT_SLAS_REFRESH_TOKEN_GUEST_TTL
        }

        // Mock the helper to return token response
        const loginGuestUserSpy = jest.spyOn(helpers, 'loginGuestUser')
        loginGuestUserSpy.mockResolvedValueOnce(tokenResponse)

        // Make the token call
        await auth.loginGuestUser()

        // Verify SFRA auth token is cleared
        expect(auth.get('access_token_sfra')).toBeFalsy()

        // Verify all token data is set correctly
        expect(auth.get('access_token')).toBe(tokenResponse.access_token)

        // Clean up the spy
        getDntSpy.mockRestore()
    })
})

describe('Auth service sends credentials fetch option to the ShopperLogin API', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('Adds fetch options with credentials when not defined in config', async () => {
        const auth = new Auth(config)
        await auth.loginGuestUser()

        // Ensure the helper method was called
        expect(helpers.loginGuestUser).toHaveBeenCalled()
        expect(helpers.loginGuestUser).toHaveBeenCalledTimes(1)

        // Check that the correct parameters were passed to the helper
        const callArguments = (helpers.loginGuestUser as jest.Mock).mock.calls[0]
        expect(callArguments).toBeDefined()
        expect(callArguments.length).toBeGreaterThan(0)

        const args = callArguments[0]
        expect(args).toBeDefined()
        expect(args.slasClient).toBeDefined()
        expect(args.slasClient.clientConfig).toBeDefined()
        expect(args.slasClient.clientConfig.fetchOptions).toBeDefined()

        // Ensure fetch options include the expected credentials
        expect(args.slasClient.clientConfig.fetchOptions.credentials).toBe('same-origin')
    })

    test('Does not override the credentials in fetch options if already exists', async () => {
        const configWithFetchOptions = {
            ...config,
            fetchOptions: {
                credentials: 'include' as RequestCredentials
            }
        }
        const auth = new Auth(configWithFetchOptions)
        await auth.loginGuestUser()

        // Ensure the helper method was called
        expect(helpers.loginGuestUser).toHaveBeenCalled()
        expect(helpers.loginGuestUser).toHaveBeenCalledTimes(1)

        // Check that the correct parameters were passed to the helper
        const callArguments = (helpers.loginGuestUser as jest.Mock).mock.calls[0]
        expect(callArguments).toBeDefined()
        expect(callArguments.length).toBeGreaterThan(0)

        const args = callArguments[0]
        expect(args).toBeDefined()
        expect(args.slasClient).toBeDefined()
        expect(args.slasClient.clientConfig).toBeDefined()
        expect(args.slasClient.clientConfig.fetchOptions).toBeDefined()

        // Ensure fetch options include the expected credentials
        expect(args.slasClient.clientConfig.fetchOptions.credentials).toBe('include')
    })

    test('Adds credentials to the fetch options if it is missing', async () => {
        const configWithFetchOptions = {
            ...config,
            fetchOptions: {
                cache: 'no-cache' as RequestCache
            }
        }
        const auth = new Auth(configWithFetchOptions)
        await auth.loginGuestUser()

        // Ensure the helper method was called
        expect(helpers.loginGuestUser).toHaveBeenCalled()
        expect(helpers.loginGuestUser).toHaveBeenCalledTimes(1)

        // Check that the correct parameters were passed to the helper
        const callArguments = (helpers.loginGuestUser as jest.Mock).mock.calls[0]
        expect(callArguments).toBeDefined()
        expect(callArguments.length).toBeGreaterThan(0)

        const args = callArguments[0]
        expect(args).toBeDefined()
        expect(args.slasClient).toBeDefined()
        expect(args.slasClient.clientConfig).toBeDefined()
        expect(args.slasClient.clientConfig.fetchOptions).toBeDefined()

        // Ensure fetch options include the expected credentials
        expect(args.slasClient.clientConfig.fetchOptions.credentials).toBe('same-origin')
    })
})

describe('hybridAuthEnabled property toggles clearECOMSession', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('clears DWSID cookie when hybridAuthEnabled is false', () => {
        const auth = new Auth({...config, hybridAuthEnabled: false})

        // Set a DWSID cookie value
        // @ts-expect-error private method
        auth.set('dwsid', 'test-dwsid-value')

        // Verify the cookie was set
        expect(auth.get('dwsid')).toBe('test-dwsid-value')

        // Call clearECOMSession
        // @ts-expect-error private method
        auth.clearECOMSession()

        // Verify the cookie was cleared
        expect(auth.get('dwsid')).toBeFalsy()
    })

    test('does NOT clear DWSID cookie when hybridAuthEnabled is true', () => {
        const auth = new Auth({...config, hybridAuthEnabled: true})

        // Set a DWSID cookie value
        // @ts-expect-error private method
        auth.set('dwsid', 'test-dwsid-value')

        // Verify the cookie was set
        expect(auth.get('dwsid')).toBe('test-dwsid-value')

        // Call clearECOMSession
        // @ts-expect-error private method
        auth.clearECOMSession()

        // Verify the cookie was NOT cleared
        expect(auth.get('dwsid')).toBe('test-dwsid-value')
    })
})

describe('HttpOnly Session Cookies', () => {
    const expiresAtFuture = Math.floor(Date.now() / 1000) + 3600

    const httpOnlyTokenResponse: ShopperLoginTypes.TokenResponse = {
        ...TOKEN_RESPONSE
    }

    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('routes SLAS calls through publicClientProxyEndpoint when httpOnly enabled and private client disabled', () => {
        const ShopperLoginMock = ShopperLogin as unknown as jest.Mock
        ShopperLoginMock.mockClear()
        new Auth({
            ...config,
            enableHttpOnlySessionCookies: true,
            enablePWAKitPrivateClient: false,
            publicClientProxyEndpoint: '/mobify/slas/public'
        })
        expect(ShopperLoginMock).toHaveBeenCalledWith(
            expect.objectContaining({proxy: '/mobify/slas/public'})
        )
    })

    test('routes SLAS calls through standard proxy when httpOnly disabled', () => {
        const ShopperLoginMock = ShopperLogin as unknown as jest.Mock
        ShopperLoginMock.mockClear()
        new Auth({
            ...config,
            enableHttpOnlySessionCookies: false,
            enablePWAKitPrivateClient: false,
            publicClientProxyEndpoint: '/mobify/slas/public'
        })
        expect(ShopperLoginMock).toHaveBeenCalledWith(expect.objectContaining({proxy: 'proxy'}))
    })

    test('loginGuestUser does not store tokens when HttpOnly cookies are enabled', async () => {
        const auth = new Auth({...config, enableHttpOnlySessionCookies: true})
        const loginGuestMock = helpers.loginGuestUser as jest.Mock
        loginGuestMock.mockResolvedValueOnce(httpOnlyTokenResponse)

        // Set cc-at-expires cookie (as server would via Set-Cookie header)
        // @ts-expect-error private method
        auth.set('cc-at-expires', String(expiresAtFuture))

        await auth.loginGuestUser()

        // In httpOnly mode handleTokenResponse is a no-op on the client; nothing
        // here writes to localStorage. The proxy / eCOM is solely responsible
        // for setting all session cookies (access token, refresh token,
        // customer_id, customer_type, usid, etc.) via Set-Cookie headers.
        expect(auth.get('access_token')).toBeFalsy()
        expect(auth.get('refresh_token_guest')).toBeFalsy()
        expect(window.localStorage.getItem(`customer_id_${config.siteId}`)).toBeNull()
        expect(window.localStorage.getItem(`enc_user_id_${config.siteId}`)).toBeNull()
        // enableHttpOnlySessionCookies should be forwarded to the helper
        expect(helpers.loginGuestUser).toHaveBeenCalledWith(
            expect.objectContaining({enableHttpOnlySessionCookies: true})
        )
    })

    test('ready re-uses data when cc-at-expires cookie is still valid', async () => {
        const auth = new Auth({...config, enableHttpOnlySessionCookies: true})
        const loginGuestMock = helpers.loginGuestUser as jest.Mock
        loginGuestMock.mockResolvedValueOnce(httpOnlyTokenResponse)

        // With HttpOnly cookies enabled, the first ready() attempts a refresh (since JS
        // can't read the HttpOnly refresh token cookie). On a fresh session there's no
        // refresh token cookie, so SLAS rejects — then it falls through to loginGuestUser.
        const refreshMock = helpers.refreshAccessToken as jest.Mock
        refreshMock.mockRejectedValueOnce(new Error('no refresh token'))

        // First call: refresh fails, falls through to loginGuestUser
        await auth.ready()

        // Set cc-at-expires cookie (as server would via Set-Cookie header)
        // @ts-expect-error private method
        auth.set('cc-at-expires', String(expiresAtFuture))

        expect(helpers.loginGuestUser).toHaveBeenCalledTimes(1)

        // Second call: cc-at-expires is in the future, so it should re-use data
        await auth.ready()
        expect(helpers.loginGuestUser).toHaveBeenCalledTimes(1) // Not called again
        // enableHttpOnlySessionCookies should be forwarded to the helper
        expect(helpers.loginGuestUser).toHaveBeenCalledWith(
            expect.objectContaining({enableHttpOnlySessionCookies: true})
        )
    })

    test('ready skips refresh and goes straight to guest login on first visit (no cc-nx-expires)', async () => {
        const auth = new Auth({...config, enableHttpOnlySessionCookies: true})
        const loginGuestMock = helpers.loginGuestUser as jest.Mock
        loginGuestMock.mockResolvedValueOnce(httpOnlyTokenResponse)

        // First visit: no cc-nx-expires cookie, no refresh token, no cc-at-expires
        // Should NOT attempt refresh — should go straight to loginGuestUser
        await auth.ready()

        expect(helpers.refreshAccessToken).not.toHaveBeenCalled()
        expect(helpers.loginGuestUser).toHaveBeenCalledTimes(1)
    })

    test('ready attempts refresh when cc-nx-expires is set (returning visitor)', async () => {
        const auth = new Auth({...config, enableHttpOnlySessionCookies: true})

        // Simulate a returning visitor: expired access token + cc-nx-expires indicator
        const expiredTime = Math.floor(Date.now() / 1000) - 100
        const refreshExpiresEpoch = Math.floor(Date.now() / 1000) + 7776000
        // @ts-expect-error private method
        auth.set('cc-at-expires', String(expiredTime))
        // @ts-expect-error private method
        auth.set('cc-nx-expires', String(refreshExpiresEpoch))
        // @ts-expect-error private method
        auth.set('customer_type', 'guest')
        // @ts-expect-error private method
        auth.set('access_token', JWTExpired)

        const refreshMock = helpers.refreshAccessToken as jest.Mock
        refreshMock.mockResolvedValueOnce(httpOnlyTokenResponse)

        await auth.ready()

        // Should attempt refresh because cc-nx-expires indicates an HttpOnly refresh token exists
        expect(helpers.refreshAccessToken).toHaveBeenCalledTimes(1)
        expect(helpers.refreshAccessToken).toHaveBeenCalledWith(
            expect.objectContaining({enableHttpOnlySessionCookies: true})
        )
    })

    test('ready triggers refresh when cc-at-expires cookie is expired', async () => {
        const auth = new Auth({...config, enableHttpOnlySessionCookies: true})

        // Simulate a previous login that left behind stored data with an expired token
        const expiredTime = Math.floor(Date.now() / 1000) - 100
        // @ts-expect-error private method
        auth.set('cc-at-expires', String(expiredTime))
        // @ts-expect-error private method
        auth.set('refresh_token_guest', 'refresh_token')
        // @ts-expect-error private method
        auth.set('customer_type', 'guest')
        // Set a valid JWT so parseSlasJWT works during the refresh flow
        // @ts-expect-error private method
        auth.set('access_token', JWTExpired)

        await auth.ready()
        expect(helpers.refreshAccessToken).toHaveBeenCalled()
        // enableHttpOnlySessionCookies should be forwarded to the helper
        expect(helpers.refreshAccessToken).toHaveBeenCalledWith(
            expect.objectContaining({enableHttpOnlySessionCookies: true})
        )
    })

    test('on server, isAccessTokenExpired falls back to JWT decoding even with httpOnly enabled', () => {
        onClientMock.mockReturnValue(false)

        const auth = new Auth({...config, enableHttpOnlySessionCookies: true})
        // Set cc-at-expires to a future time — on client this would mean "not expired"
        // @ts-expect-error private method
        auth.set('cc-at-expires', String(Math.floor(Date.now() / 1000) + 3600))
        // Set an expired JWT — the server path should use this instead of cc-at-expires
        // @ts-expect-error private method
        auth.set('access_token', JWTExpired)

        // @ts-expect-error private method
        expect(auth.isAccessTokenExpired()).toBe(true)

        onClientMock.mockReturnValue(true)
    })

    test('on server, handleTokenResponse stores tokens normally even with httpOnly enabled', async () => {
        onClientMock.mockReturnValue(false)

        const auth = new Auth({...config, enableHttpOnlySessionCookies: true})
        const loginGuestMock = helpers.loginGuestUser as jest.Mock
        loginGuestMock.mockResolvedValueOnce({...TOKEN_RESPONSE})

        await auth.loginGuestUser()

        // On server with httpOnly enabled, tokens should still be stored normally
        expect(auth.get('access_token')).toBe(TOKEN_RESPONSE.access_token)
        expect(auth.get('refresh_token_guest')).toBe(TOKEN_RESPONSE.refresh_token)
        onClientMock.mockReturnValue(true)
    })

    test('refreshAccessToken sets x-grant-type header during the call and cleans it up after', async () => {
        const auth = new Auth({...config, enableHttpOnlySessionCookies: true})

        // Simulate an expired access token with a valid refresh token
        const expiredTime = Math.floor(Date.now() / 1000) - 100
        // @ts-expect-error private method
        auth.set('cc-at-expires', String(expiredTime))
        // @ts-expect-error private method
        auth.set('refresh_token_guest', 'refresh_token')
        // @ts-expect-error private method
        auth.set('customer_type', 'guest')
        // @ts-expect-error private method
        auth.set('access_token', JWTExpired)

        // Capture the header value during the refresh call
        let headerDuringCall: string | undefined
        const refreshMock = helpers.refreshAccessToken as jest.Mock
        refreshMock.mockImplementationOnce(
            (options: {slasClient: {clientConfig: {headers: Record<string, string>}}}) => {
                headerDuringCall = options.slasClient.clientConfig.headers[X_GRANT_TYPE]
                return Promise.resolve(TOKEN_RESPONSE)
            }
        )

        await auth.ready()

        // x-grant-type was set to 'refresh_token' during the call
        expect(headerDuringCall).toBe('refresh_token')
        // x-grant-type is cleaned up after the call
        // @ts-expect-error private property
        expect(auth.client.clientConfig.headers[X_GRANT_TYPE]).toBeUndefined()
    })

    test('refreshAccessToken cleans up x-grant-type header even when the call fails', async () => {
        const auth = new Auth({...config, enableHttpOnlySessionCookies: true})

        const expiredTime = Math.floor(Date.now() / 1000) - 100
        // @ts-expect-error private method
        auth.set('cc-at-expires', String(expiredTime))
        // @ts-expect-error private method
        auth.set('refresh_token_guest', 'refresh_token')
        // @ts-expect-error private method
        auth.set('customer_type', 'guest')
        // @ts-expect-error private method
        auth.set('access_token', JWTExpired)

        // Mock a failure with an 'invalid refresh_token' response
        const refreshMock = helpers.refreshAccessToken as jest.Mock
        refreshMock.mockRejectedValueOnce(
            Object.assign(new Error('invalid refresh_token'), {
                response: {json: () => Promise.resolve({message: 'invalid refresh_token'})}
            })
        )
        // After refresh fails, it falls through to loginGuestUser
        const loginGuestMock = helpers.loginGuestUser as jest.Mock
        loginGuestMock.mockResolvedValueOnce(httpOnlyTokenResponse)

        await auth.ready()

        // x-grant-type is cleaned up despite the failure
        // @ts-expect-error private property
        expect(auth.client.clientConfig.headers[X_GRANT_TYPE]).toBeUndefined()
        expect(refreshMock).toHaveBeenCalled()
    })

    test('refreshAccessToken does not set x-grant-type header when httpOnly cookies are disabled', async () => {
        const auth = new Auth({...config, enableHttpOnlySessionCookies: false})

        // @ts-expect-error private method
        auth.set('access_token', JWTExpired)
        // @ts-expect-error private method
        auth.set('refresh_token_guest', 'refresh_token')

        let headerDuringCall: string | undefined
        const refreshMock = helpers.refreshAccessToken as jest.Mock
        refreshMock.mockImplementationOnce(
            (options: {slasClient: {clientConfig: {headers: Record<string, string>}}}) => {
                headerDuringCall = options.slasClient.clientConfig.headers[X_GRANT_TYPE]
                return Promise.resolve(TOKEN_RESPONSE)
            }
        )

        await auth.ready()

        expect(headerDuringCall).toBeUndefined()
        // @ts-expect-error private property
        expect(auth.client.clientConfig.headers[X_GRANT_TYPE]).toBeUndefined()
    })
})
