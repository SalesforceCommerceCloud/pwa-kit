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

// A real Response body is a single-use stream: json() resolves once and rejects if read
// again. This factory models that so tests can prove the original body is not consumed.
const createOneShotJson = (responseBody: Record<string, unknown>) => {
    let consumed = false
    return jest.fn(() => {
        if (consumed) {
            return Promise.reject(new TypeError('Body has already been consumed.'))
        }
        consumed = true
        return Promise.resolve(responseBody)
    })
}

// clone() returns an independent reader, as Response.clone() does. handleInvalidToken reads
// the body via the clone so the original stream stays readable for the caller.
const createMockError = (status: number, responseBody: Record<string, unknown>) => ({
    response: {
        status,
        json: createOneShotJson(responseBody),
        clone: jest.fn(() => ({json: createOneShotJson(responseBody)}))
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

    test('preserves the response body for the caller when re-throwing a non-token 400', async () => {
        // A 400 from an SFRA hook returning dw.system.Status.ERROR carries the error details
        // in the body. handleInvalidToken inspects the body to detect token errors but must
        // NOT drain it, so the caller (e.g. a mutation's .catch) can still read the details.
        // Regression test for https://github.com/SalesforceCommerceCloud/pwa-kit/issues/3885
        const errorBody = {detail: 'Some other error.', errors: [{message: 'SFRA hook failed'}]}
        const error = createMockError(400, errorBody)

        await expect(handleInvalidToken(error, mockAuth as any, mockLogger)).rejects.toBe(error)

        // The original body stream was not consumed: the caller can still read it.
        expect(error.response.clone).toHaveBeenCalledTimes(1)
        await expect(error.response.json()).resolves.toEqual(errorBody)
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
        // The body is read via a clone so the original one-shot stream stays intact for the
        // caller (see the regression test below).
        expect(error.response.clone).toHaveBeenCalledTimes(1)
        expect(error.response.json).not.toHaveBeenCalled()
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
