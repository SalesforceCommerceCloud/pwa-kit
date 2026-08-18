/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import nock from 'nock'
import {act, waitFor} from '@testing-library/react'
import {mockMutationEndpoints, renderHookWithProviders} from '../test-utils'
import * as useTrustedAgentModule from './useTrustedAgent'
import {ShopperLoginTypes} from 'commerce-sdk-isomorphic'
import useAuthContext from './useAuthContext'

// `jsdom` is a global provided by the jest jsdom environment; its type is
// declared once in the test suite (see StorefrontPreview/utils.test.ts).

jest.mock('./useAuthContext')

const mockedUseAuthContext = useAuthContext as jest.MockedFunction<typeof Object>

const mockWindowOpen = jest.fn()
global.open = mockWindowOpen

let mockParseSlasJwtVals: {
    isAgent: boolean
    agentId: string | null
    loginId: string | null
} = {
    isAgent: false,
    agentId: null,
    loginId: null
}

let mockAuthGetters = {
    customer_type: 'registered',
    refresh_token_expires_in: 7776000,
    refresh_token: 'mock_refresh_token',
    access_token: 'mock_access_token'
} as {[key: string]: string | number}

jest.mock('../auth/index.ts', () => {
    const {default: mockAuth} = jest.requireActual('../auth/index.ts')
    mockAuth.prototype.ready = jest.fn().mockResolvedValue({access_token: 'mock.jwt.token'})
    mockAuth.prototype.parseSlasJWT = jest.fn().mockImplementation(() => mockParseSlasJwtVals)
    return mockAuth
})

describe('useTrustedAgent', () => {
    // Helper function to simulate a successful popup authentication
    const simulateSuccessfulPopup = (code = 'test_code', state = 'test_state') => {
        const mockPopup = {
            closed: false,
            location: {
                toString: () => `http://localhost?code=${code}&state=${state}`
            },
            close: jest.fn()
        }
        mockWindowOpen.mockReturnValue(mockPopup)
        return mockPopup
    }
    const originalWindow = global.window

    beforeAll(() => {
        // Mock the URL constructor
        global.URL = jest.fn(() => ({
            searchParams: {
                get: jest.fn((param) => {
                    if (param === 'code') return 'code_xyz'
                    if (param === 'state') return 'state_abc'
                    return null
                })
            }
        })) as any
    })

    afterAll(() => {
        jest.restoreAllMocks()
    })

    beforeEach(() => {
        nock.cleanAll()
        jest.clearAllMocks()
        mockedUseAuthContext.mockReturnValue({
            refreshAccessToken: jest.fn(),
            get: (param: string) => {
                return mockAuthGetters[param]
            },
            parseSlasJWT: () => {
                // return {isAgent: false, agentId: null, loginId: null}
                return mockParseSlasJwtVals
            },
            loginTrustedAgent: () => {
                return {
                    access_token: mockAuthGetters['access_token'],
                    refresh_token: mockAuthGetters['refresh_token']
                }
            },
            logout: jest.fn().mockResolvedValue({}),
            authorizeTrustedAgent: jest.fn().mockResolvedValue({
                url: 'test_url',
                codeVerifier: 'test_verifier',
                // Must match the `state` the popup echoes back (see the URL mock in
                // beforeAll and simulateSuccessfulPopup) or login()'s CSRF check rejects.
                state: 'state_abc'
            }),
            registerTrustedAgentRefreshHandler: jest.fn()
        })
    })

    afterEach(() => {
        global.window = originalWindow
    })

    test('popup fails if window.open is not available', async () => {
        // Store the original window.open
        const originalWindowOpen = window.open
        // Set window.open to undefined for this test
        window.open = undefined as any

        const {result} = renderHookWithProviders(() => useTrustedAgentModule.default())

        let error: Error | null = null
        act(() => {
            result.current.login('test_login_id').catch((e) => {
                error = e
            })
        })

        await waitFor(() => {
            expect(error).toBe("Popup couldn't initialize. Check your popup blocker.")
        })
        // Restore the original window.open
        window.open = originalWindowOpen
    })

    test('login returns access_token and refresh_token', async () => {
        const mockPopup = {
            closed: false,
            close: jest.fn(),
            focus: jest.fn(),
            location: {
                toString: () => 'about:blank'
            }
        }
        window.open = jest.fn().mockReturnValue(mockPopup)

        const {result} = renderHookWithProviders(() => useTrustedAgentModule.default())

        // let error: Error | null = null
        let returnVal: ShopperLoginTypes.TokenResponse | null = null
        await act(async () => {
            await result.current.login('test_login_id').then((data) => {
                returnVal = data
            })
        })

        await waitFor(() => {
            expect(returnVal).toEqual({
                access_token: 'mock_access_token',
                refresh_token: 'mock_refresh_token'
            })
        })
    })

    test('login rejects when the popup-echoed state does not match the authorize state', async () => {
        // The popup echoes `state_abc` (see the URL mock / simulateSuccessfulPopup),
        // but authorizeTrustedAgent minted a different state — a CSRF/mismatched
        // callback. login() must fail fast before exchanging the code.
        const authCtx = mockedUseAuthContext() as Record<string, unknown>
        authCtx.authorizeTrustedAgent = jest.fn().mockResolvedValue({
            url: 'test_url',
            codeVerifier: 'test_verifier',
            state: 'a_different_state'
        })
        simulateSuccessfulPopup()

        const {result} = renderHookWithProviders(() => useTrustedAgentModule.default())

        let error: Error | null = null
        await act(async () => {
            await result.current.login('test_login_id').catch((e) => {
                error = e
            })
        })

        expect(String(error)).toContain('state mismatch')
    })

    test('useTrustedAgent returns initial state correctly', async () => {
        const {result} = renderHookWithProviders(() => useTrustedAgentModule.default())

        await waitFor(() => {
            expect(result.current).toBeTruthy()
        })

        expect(result.current).toEqual({
            isAgent: false,
            agentId: '',
            loginId: null,
            login: expect.any(Function),
            logout: expect.any(Function)
        })
    })

    test('should set isAgent, agentId, and loginId based on parsed JWT', async () => {
        // Update the mock for this specific test
        const origMockParseSlasJwtVals = mockParseSlasJwtVals
        mockParseSlasJwtVals = {
            isAgent: true,
            agentId: 'mockAgentId',
            loginId: 'mockLoginId'
        }

        const {result} = renderHookWithProviders(() => useTrustedAgentModule.default())

        await waitFor(() => {
            expect(result.current).toEqual(
                expect.objectContaining({
                    isAgent: true,
                    agentId: 'mockAgentId',
                    loginId: 'mockLoginId'
                })
            )
        })

        expect(result.current.isAgent).toBe(true)
        expect(result.current.agentId).toBe('mockAgentId')
        expect(result.current.loginId).toBe('mockLoginId')

        mockParseSlasJwtVals = origMockParseSlasJwtVals
    })

    test('login function works correctly', async () => {
        // const mockAuthResponse = {url: 'test_url', codeVerifier: 'test_verifier'}
        const mockTokenResponse = {
            access_token: 'mock_access_token',
            refresh_token: 'mock_refresh_token'
        } as ShopperLoginTypes.TokenResponse

        const origMockParseSlasJwtVals = mockParseSlasJwtVals
        mockParseSlasJwtVals = {
            isAgent: true,
            agentId: 'agent123',
            loginId: 'login123'
        }

        const {result} = renderHookWithProviders(() => useTrustedAgentModule.default())

        simulateSuccessfulPopup()

        let tokenResponse
        await act(async () => {
            tokenResponse = await result.current.login('test_login_id')
        })

        expect(tokenResponse).toEqual(expect.objectContaining(mockTokenResponse))
        expect(window.open).toHaveBeenCalled()
        expect(result.current.isAgent).toBe(true)
        expect(result.current.agentId).toBe('agent123')
        expect(result.current.loginId).toBe('login123')
        mockParseSlasJwtVals = origMockParseSlasJwtVals
    })

    test('updates state when auth token changes', async () => {
        // const initialTokenResponse = {
        //     access_token: 'initial.jwt.token'
        // } as ShopperLoginTypes.TokenResponse
        const newTokenResponse = {access_token: 'new.jwt.token'} as ShopperLoginTypes.TokenResponse

        const origMockParseSlasJwtVals = mockParseSlasJwtVals
        mockParseSlasJwtVals = {
            isAgent: true,
            agentId: 'agent12',
            loginId: 'login34'
        }

        const origMockAuthGetters = mockAuthGetters
        mockAuthGetters = {
            ...origMockAuthGetters,
            access_token: '1st_mock_access_token',
            refresh_token: '1st_mock_refresh_token'
        }

        let mockTokenResponse = {
            access_token: '1st_mock_access_token',
            refresh_token: '1st_mock_refresh_token'
        } as ShopperLoginTypes.TokenResponse

        const {result, rerender} = renderHookWithProviders(() => useTrustedAgentModule.default())

        let tokenResponse
        await act(async () => {
            tokenResponse = await result.current.login('test_login_id')
        })

        expect(tokenResponse).toEqual(expect.objectContaining(mockTokenResponse))
        expect(result.current.isAgent).toBe(true)
        expect(result.current.agentId).toBe('agent12')
        expect(result.current.loginId).toBe('login34')

        mockParseSlasJwtVals = {
            isAgent: true,
            agentId: 'agent56',
            loginId: 'login78'
        }

        mockTokenResponse = {
            access_token: '2nd_mock_access_token',
            refresh_token: '2nd_mock_refresh_token'
        } as ShopperLoginTypes.TokenResponse

        mockAuthGetters = {
            ...origMockAuthGetters,
            access_token: '2nd_mock_access_token',
            refresh_token: '2nd_mock_refresh_token'
        }

        // Simulate a token change
        mockMutationEndpoints('shopper-login', newTokenResponse)

        rerender()

        await act(async () => {
            tokenResponse = await result.current.login('alt_login_id')
        })
        expect(result.current.isAgent).toBe(true)
        expect(result.current.agentId).toBe('agent56')
        expect(result.current.loginId).toBe('login78')

        mockParseSlasJwtVals = origMockParseSlasJwtVals
        mockAuthGetters = origMockAuthGetters
    })
})

describe('deliverTrustedAgentResult', () => {
    const originalOpener = window.opener
    const originalUrl = window.location.href
    let broadcastPosts: Array<unknown>
    let broadcastClosed: boolean
    let closeSpy: jest.SpyInstance

    // jsdom's window.location is read-only, and redefining it with
    // Object.defineProperty does not reliably reset between tests on older
    // jsdom (Node 18). Reconfigure the whole document URL instead so both
    // `search` and `origin` are driven from a single source of truth.
    const setLocation = (search: string, origin = 'http://localhost') => {
        jsdom.reconfigure({url: `${origin}/${search}`})
    }

    beforeEach(() => {
        jest.useFakeTimers()
        broadcastPosts = []
        broadcastClosed = false
        // Route through the spec setter so the property stays writable across
        // Node versions (a plain Object.defineProperty data prop breaks Node 18).
        window.opener = undefined
        // jsdom does not implement window.close; spy on it so the callback page's
        // deferred self-close is observable rather than throwing "Not implemented".
        closeSpy = jest.spyOn(window, 'close').mockImplementation(() => undefined)
        ;(global as any).BroadcastChannel = jest.fn().mockImplementation(() => ({
            postMessage: (msg: unknown) => broadcastPosts.push(msg),
            close: () => {
                broadcastClosed = true
            }
        }))
    })

    afterEach(() => {
        window.opener = originalOpener
        jsdom.reconfigure({url: originalUrl})
        delete (global as any).BroadcastChannel
        closeSpy.mockRestore()
        jest.clearAllTimers()
        jest.useRealTimers()
    })

    test('posts {type, code, state} to window.opener scoped to origin', () => {
        const postMessage = jest.fn()
        window.opener = {postMessage}
        setLocation('?code=abc&state=xyz')

        useTrustedAgentModule.deliverTrustedAgentResult()

        expect(postMessage).toHaveBeenCalledWith(
            {
                type: useTrustedAgentModule.TRUSTED_AGENT_POPUP_MESSAGE_TYPE,
                code: 'abc',
                state: 'xyz'
            },
            'http://localhost'
        )
    })

    test('broadcasts on the fallback channel and closes it', () => {
        setLocation('?code=abc&state=xyz')

        useTrustedAgentModule.deliverTrustedAgentResult()

        expect((global as any).BroadcastChannel).toHaveBeenCalledWith(
            useTrustedAgentModule.TRUSTED_AGENT_POPUP_CHANNEL
        )
        expect(broadcastPosts).toEqual([
            {
                type: useTrustedAgentModule.TRUSTED_AGENT_POPUP_MESSAGE_TYPE,
                code: 'abc',
                state: 'xyz'
            }
        ])
        expect(broadcastClosed).toBe(true)
    })

    test('is a no-op when code or state is absent', () => {
        const postMessage = jest.fn()
        window.opener = {postMessage}
        setLocation('?code=abc')

        useTrustedAgentModule.deliverTrustedAgentResult()

        expect(postMessage).not.toHaveBeenCalled()
        expect(broadcastPosts).toEqual([])
    })

    test('does not throw when the opener reference is severed', () => {
        window.opener = {
            postMessage: () => {
                throw new Error('severed by COOP context switch')
            }
        }
        setLocation('?code=abc&state=xyz')

        expect(() => useTrustedAgentModule.deliverTrustedAgentResult()).not.toThrow()
        // The broadcast fallback still delivers the result.
        expect(broadcastPosts).toHaveLength(1)
    })

    test('closes its own window after delivering the result', () => {
        const postMessage = jest.fn()
        window.opener = {postMessage}
        setLocation('?code=abc&state=xyz')

        useTrustedAgentModule.deliverTrustedAgentResult()

        // Deferred so the queued postMessage/broadcast flushes first; it must not
        // rely on the opener's COOP-severed `popup.close()` to shut the popup.
        expect(closeSpy).not.toHaveBeenCalled()
        jest.runOnlyPendingTimers()
        expect(closeSpy).toHaveBeenCalledTimes(1)
    })

    test('does not close the window when there is nothing to deliver', () => {
        setLocation('?code=abc')

        useTrustedAgentModule.deliverTrustedAgentResult()
        jest.runOnlyPendingTimers()

        expect(closeSpy).not.toHaveBeenCalled()
    })

    test('warns and does not close when neither delivery path is available', () => {
        // Valid code+state, but no opener and no BroadcastChannel: both delivery
        // paths fail, so the opener is left to fall back to its timeout. The page
        // must surface why and must NOT close itself (nothing was delivered).
        const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined)
        window.opener = undefined
        delete (global as any).BroadcastChannel
        setLocation('?code=abc&state=xyz')

        useTrustedAgentModule.deliverTrustedAgentResult()
        jest.runOnlyPendingTimers()

        expect(warn).toHaveBeenCalledWith(
            'Trusted agent callback could not deliver the OAuth result to the opener.'
        )
        expect(closeSpy).not.toHaveBeenCalled()
        warn.mockRestore()
    })
})
