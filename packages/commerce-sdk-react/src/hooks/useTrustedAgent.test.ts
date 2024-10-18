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
            authorizeTrustedAgent: jest
                .fn()
                .mockResolvedValue({url: 'test_url', codeVerifier: 'test_verifier'}),
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
