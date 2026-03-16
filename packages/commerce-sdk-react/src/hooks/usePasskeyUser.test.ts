/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {waitFor} from '@testing-library/react'
import {renderHookWithProviders} from '../test-utils'
import {usePasskeyUser} from './usePasskeyUser'
import useAuthContext from './useAuthContext'

jest.mock('./useAuthContext')

jest.mock('../auth/index.ts', () => {
    const {default: mockAuth} = jest.requireActual('../auth/index.ts')
    mockAuth.prototype.ready = jest.fn().mockResolvedValue({access_token: 'mock.jwt.token'})
    return mockAuth
})

const mockedUseAuthContext = useAuthContext as jest.MockedFunction<typeof useAuthContext>

const mockPasskeyUser = {
    id: 1,
    userName: 'customer@test.com',
    displayName: 'Test User',
    userHandle: 'abc123',
    slasUserId: 10000,
    credentials: [
        {
            id: 21,
            userId: 1,
            credentialId: 'cred-1',
            nickName: 'My Passkey',
            userHandle: 'abc123',
            signatureCount: '1'
        }
    ]
}

const mockGetPasskeyUserByLoginId = jest.fn()
const mockWhenReady = jest.fn((fn) => fn)

beforeEach(() => {
    jest.clearAllMocks()
    mockedUseAuthContext.mockReturnValue({
        getPasskeyUserByLoginId: mockGetPasskeyUserByLoginId,
        whenReady: mockWhenReady
    } as any)
})

describe('usePasskeyUser', () => {
    test('returns passkey user data on success', async () => {
        mockGetPasskeyUserByLoginId.mockResolvedValue(mockPasskeyUser)

        const {result} = renderHookWithProviders(() =>
            usePasskeyUser({loginId: 'customer@test.com'})
        )

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true)
        })

        expect(result.current.data).toEqual(mockPasskeyUser)
        expect(mockGetPasskeyUserByLoginId).toHaveBeenCalledWith({loginId: 'customer@test.com'})
    })

    test('returns null data on 404 (user has no passkeys)', async () => {
        const notFoundError = {response: {status: 404}}
        mockGetPasskeyUserByLoginId.mockRejectedValue(notFoundError)

        const {result} = renderHookWithProviders(() =>
            usePasskeyUser({loginId: 'customer@test.com'})
        )

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true)
        })

        expect(result.current.data).toBeNull()
    })

    test('propagates non-404 errors', async () => {
        const serverError = {response: {status: 500}}
        mockGetPasskeyUserByLoginId.mockRejectedValue(serverError)

        const {result} = renderHookWithProviders(() =>
            usePasskeyUser({loginId: 'customer@test.com'}, {retry: false})
        )

        await waitFor(() => {
            expect(result.current.isError).toBe(true)
        })

        expect(result.current.error).toEqual(serverError)
    })

    test('does not fetch when loginId is empty', async () => {
        const {result} = renderHookWithProviders(() => usePasskeyUser({loginId: ''}))

        await waitFor(() => {
            expect(result.current.fetchStatus).toBe('idle')
        })

        expect(mockGetPasskeyUserByLoginId).not.toHaveBeenCalled()
    })

    test('does not fetch when enabled is false', async () => {
        const {result} = renderHookWithProviders(() =>
            usePasskeyUser({loginId: 'customer@test.com'}, {enabled: false})
        )

        await waitFor(() => {
            expect(result.current.fetchStatus).toBe('idle')
        })

        expect(mockGetPasskeyUserByLoginId).not.toHaveBeenCalled()
    })

    test('includes channelId in query key when provided', async () => {
        mockGetPasskeyUserByLoginId.mockResolvedValue(mockPasskeyUser)

        const {result} = renderHookWithProviders(() =>
            usePasskeyUser({loginId: 'customer@test.com', channelId: 'RefArch'})
        )

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true)
        })

        expect(mockGetPasskeyUserByLoginId).toHaveBeenCalledWith({
            loginId: 'customer@test.com',
            channelId: 'RefArch'
        })
    })
})
