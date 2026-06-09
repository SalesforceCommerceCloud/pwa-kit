/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {handleInvalidToken} from './helpers'
import Auth from '../auth'

const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    log: jest.fn(),
    debug: jest.fn()
}

const createMockError = (status: number, responseBody: Record<string, unknown>) => ({
    response: {
        status,
        // A real Response body is a one-shot stream; use a mock so tests can assert it is
        // read exactly once.
        json: jest.fn().mockResolvedValue(responseBody)
    }
})

describe('handleInvalidToken', () => {
    let mockAuth: jest.Mocked<
        Pick<Auth, 'logout' | 'clearAccessTokenExpiry' | 'refreshAccessToken'>
    >

    beforeEach(() => {
        jest.clearAllMocks()
        mockAuth = {
            logout: jest.fn().mockResolvedValue({access_token: 'new_guest_token'}),
            clearAccessTokenExpiry: jest.fn(),
            refreshAccessToken: jest.fn().mockResolvedValue({access_token: 'refreshed_token'})
        }
    })

    test('re-throws non-401 errors', async () => {
        const error = {response: {status: 500}}
        await expect(handleInvalidToken(error, mockAuth as any, mockLogger)).rejects.toEqual(error)
    })

    test('calls auth.logout() when detail is "Customer credentials changed after token was issued."', async () => {
        const error = createMockError(401, {
            detail: 'Customer credentials changed after token was issued.'
        })

        const result = await handleInvalidToken(error, mockAuth as any, mockLogger)

        expect(mockAuth.logout).toHaveBeenCalled()
        expect(result).toEqual({access_token: 'new_guest_token'})
    })

    test('clears access token expiry and refreshes when proxy reports missing access token cookie', async () => {
        const error = createMockError(400, {
            message: 'access_token_cookie_missing'
        })

        const result = await handleInvalidToken(error, mockAuth as any, mockLogger)

        expect(mockAuth.clearAccessTokenExpiry).toHaveBeenCalled()
        expect(mockAuth.refreshAccessToken).toHaveBeenCalled()
        expect(result).toEqual({access_token: 'refreshed_token'})
        expect(mockLogger.warn).toHaveBeenCalledWith(
            expect.stringContaining('Access token cookie missing')
        )
    })

    test('re-throws 400 with unrecognized response body', async () => {
        const error = createMockError(400, {
            detail: 'Some other error.'
        })

        await expect(handleInvalidToken(error, mockAuth as any, mockLogger)).rejects.toEqual(error)

        expect(mockAuth.clearAccessTokenExpiry).not.toHaveBeenCalled()
    })

    test('clears access token expiry and refreshes on a generic 401 (invalid/revoked token)', async () => {
        const error = createMockError(401, {
            detail: 'Some other SCAPI error.'
        })

        const result = await handleInvalidToken(error, mockAuth as any, mockLogger)

        // clearAccessTokenExpiry() must run BEFORE the refresh so isAccessTokenExpired()
        // reports true and refreshAccessToken() doesn't short-circuit on the stale token.
        expect(mockAuth.clearAccessTokenExpiry).toHaveBeenCalled()
        expect(mockAuth.refreshAccessToken).toHaveBeenCalled()
        expect(mockAuth.clearAccessTokenExpiry.mock.invocationCallOrder[0]).toBeLessThan(
            mockAuth.refreshAccessToken.mock.invocationCallOrder[0]
        )
        expect(mockAuth.logout).not.toHaveBeenCalled()
        // The 401 body is read exactly once (a real Response body is a one-shot stream).
        expect(error.response.json).toHaveBeenCalledTimes(1)
        expect(result).toEqual({access_token: 'refreshed_token'})
        expect(mockLogger.warn).toHaveBeenCalledWith(
            expect.stringContaining('Access token rejected with a 401')
        )
    })

    test('propagates the rejection when refreshAccessToken() itself fails on a generic 401', async () => {
        const error = createMockError(401, {detail: 'Some other SCAPI error.'})
        const refreshFailure = new Error('guest login failed')
        mockAuth.refreshAccessToken.mockRejectedValueOnce(refreshFailure)

        await expect(handleInvalidToken(error, mockAuth as any, mockLogger)).rejects.toBe(
            refreshFailure
        )

        // Expiry is still cleared before the failed refresh attempt.
        expect(mockAuth.clearAccessTokenExpiry).toHaveBeenCalled()
        expect(mockAuth.logout).not.toHaveBeenCalled()
    })
})
