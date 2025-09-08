/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {makeAuthenticatedRequest, fetchWithTokenRefresh} from './token-refresh'
import {sendExpressMessage} from './express-payment-utils'
import {EXPRESS_MESSAGES} from './constants'
import {rest} from 'msw'

// Mock the dependencies
jest.mock('./express-payment-utils', () => ({
    sendExpressMessage: jest.fn()
}))

jest.mock('./constants', () => ({
    EXPRESS_MESSAGES: {
        TOKEN_REFRESH_NEEDED: 'express.token.refresh.needed'
    }
}))

describe('token-refresh', () => {
    let mockRequestFunction
    let mockOnTokenUpdate
    let originalConsoleLog
    let originalConsoleError
    let eventListeners

    const mockAuthToken = 'mock-auth-token'
    const mockNewAuthToken = 'new-auth-token'
    const mockNewRefreshToken = 'new-refresh-token'

    beforeEach(() => {
        // Mock console methods to avoid noise in tests
        originalConsoleLog = console.log
        originalConsoleError = console.error
        console.log = jest.fn()
        console.error = jest.fn()

        // Mock window event methods with event listener tracking
        eventListeners = {}
        window.addEventListener = jest.fn((event, handler) => {
            if (!eventListeners[event]) {
                eventListeners[event] = []
            }
            eventListeners[event].push(handler)
        })
        window.removeEventListener = jest.fn((event, handler) => {
            if (eventListeners[event]) {
                eventListeners[event] = eventListeners[event].filter((h) => h !== handler)
            }
        })

        // Mock request function
        mockRequestFunction = jest.fn()
        mockOnTokenUpdate = jest.fn()

        // Clear all mocks
        jest.clearAllMocks()
        sendExpressMessage.mockClear()
    })

    afterEach(() => {
        // Restore console methods
        console.log = originalConsoleLog
        console.error = originalConsoleError
        jest.useRealTimers()
    })

    // Helper function to simulate message events
    const simulateMessageEvent = (data) => {
        const messageEvent = {
            data
        }
        if (eventListeners.message) {
            eventListeners.message.forEach((handler) => handler(messageEvent))
        }
    }

    describe('makeAuthenticatedRequest', () => {
        it('should return response immediately when request succeeds (status 200)', async () => {
            const mockResponse = {
                status: 200,
                ok: true,
                json: () => Promise.resolve({data: 'success'})
            }
            mockRequestFunction.mockResolvedValue(mockResponse)

            const result = await makeAuthenticatedRequest(
                mockRequestFunction,
                mockAuthToken,
                mockOnTokenUpdate
            )

            expect(mockRequestFunction).toHaveBeenCalledTimes(1)
            expect(mockRequestFunction).toHaveBeenCalledWith(mockAuthToken)
            expect(result).toBe(mockResponse)
            expect(sendExpressMessage).not.toHaveBeenCalled()
            expect(mockOnTokenUpdate).not.toHaveBeenCalled()
        })

        it('should return response immediately when request fails with non-401 status', async () => {
            const mockResponse = {
                status: 500,
                ok: false,
                statusText: 'Internal Server Error'
            }
            mockRequestFunction.mockResolvedValue(mockResponse)

            const result = await makeAuthenticatedRequest(
                mockRequestFunction,
                mockAuthToken,
                mockOnTokenUpdate
            )

            expect(mockRequestFunction).toHaveBeenCalledTimes(1)
            expect(mockRequestFunction).toHaveBeenCalledWith(mockAuthToken)
            expect(result).toBe(mockResponse)
            expect(sendExpressMessage).not.toHaveBeenCalled()
            expect(mockOnTokenUpdate).not.toHaveBeenCalled()
        })

        it('should attempt token refresh when request fails with 401 status', async () => {
            const mock401Response = {status: 401, ok: false}
            const mockRetryResponse = {status: 200, ok: true}

            mockRequestFunction
                .mockResolvedValueOnce(mock401Response) // First call returns 401
                .mockResolvedValueOnce(mockRetryResponse) // Second call succeeds

            // Start the request
            const requestPromise = makeAuthenticatedRequest(
                mockRequestFunction,
                mockAuthToken,
                mockOnTokenUpdate
            )

            // Wait a tick for the event listener to be set up, then simulate the parent window responding with new tokens
            await new Promise((resolve) => setTimeout(resolve, 0))

            simulateMessageEvent({
                type: 'authDataAvailable',
                data: {
                    authData: {
                        authToken: mockNewAuthToken,
                        refreshToken: mockNewRefreshToken
                    }
                }
            })

            const result = await requestPromise

            // Verify the flow
            expect(mockRequestFunction).toHaveBeenCalledTimes(2)
            expect(mockRequestFunction).toHaveBeenNthCalledWith(1, mockAuthToken)
            expect(mockRequestFunction).toHaveBeenNthCalledWith(2, mockNewAuthToken)
            expect(sendExpressMessage).toHaveBeenCalledWith(EXPRESS_MESSAGES.TOKEN_REFRESH_NEEDED, {})
            expect(mockOnTokenUpdate).toHaveBeenCalledWith(mockNewAuthToken, mockNewRefreshToken)
            expect(result).toBe(mockRetryResponse)
        })

        it('should return original 401 response when token refresh promise is rejected', async () => {
            const mock401Response = {status: 401, ok: false}
            mockRequestFunction.mockResolvedValue(mock401Response)

            const requestPromise = makeAuthenticatedRequest(
                mockRequestFunction,
                mockAuthToken,
                mockOnTokenUpdate
            )

            // Wait a tick for the event listener to be set up
            await new Promise((resolve) => setTimeout(resolve, 0))

            // Simulate a rejection from the parent by sending an empty auth data object
            simulateMessageEvent({
                type: 'authDataAvailable',
                data: {
                    authData: {}
                }
            })

            const result = await requestPromise

            expect(result).toBe(mock401Response)
            expect(console.error).toHaveBeenCalledWith(
                '❌ Token refresh failed:',
                new Error('No auth token received from parent')
            )
        })

        it('should set a timeout when requesting a token refresh', async () => {
            const setTimeoutSpy = jest.spyOn(global, 'setTimeout')
            const mock401Response = {status: 401, ok: false}
            mockRequestFunction.mockResolvedValue(mock401Response)

            const requestPromise = makeAuthenticatedRequest(
                mockRequestFunction,
                mockAuthToken,
                mockOnTokenUpdate
            )

            // Wait a tick for the event listener to be set up
            await new Promise((resolve) => setTimeout(resolve, 0))

            expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 5000)

            // Clean up by resolving the promise
            simulateMessageEvent({
                type: 'authDataAvailable',
                data: {
                    authData: {
                        authToken: 'new-token'
                    }
                }
            })
            await requestPromise
            setTimeoutSpy.mockRestore()
        })

        it('should return original 401 response when parent does not provide auth token', async () => {
            const mock401Response = {status: 401, ok: false}
            mockRequestFunction.mockResolvedValue(mock401Response)

            const requestPromise = makeAuthenticatedRequest(
                mockRequestFunction,
                mockAuthToken,
                mockOnTokenUpdate
            )

            // Wait a tick for the event listener to be set up
            await new Promise((resolve) => setTimeout(resolve, 0))

            // Simulate parent responding with invalid auth data
            simulateMessageEvent({
                type: 'authDataAvailable',
                data: {
                    authData: {
                        // Missing authToken
                        refreshToken: mockNewRefreshToken
                    }
                }
            })

            const result = await requestPromise

            expect(result).toBe(mock401Response)
            expect(console.error).toHaveBeenCalledWith(
                '❌ Token refresh failed:',
                new Error('No auth token received from parent')
            )
        })

        it('should handle token refresh without onTokenUpdate callback', async () => {
            const mock401Response = {status: 401, ok: false}
            const mockRetryResponse = {status: 200, ok: true}

            mockRequestFunction
                .mockResolvedValueOnce(mock401Response)
                .mockResolvedValueOnce(mockRetryResponse)

            const requestPromise = makeAuthenticatedRequest(
                mockRequestFunction,
                mockAuthToken,
                null // No onTokenUpdate callback
            )

            // Wait a tick for the event listener to be set up
            await new Promise((resolve) => setTimeout(resolve, 0))

            simulateMessageEvent({
                type: 'authDataAvailable',
                data: {
                    authData: {
                        authToken: mockNewAuthToken,
                        refreshToken: mockNewRefreshToken
                    }
                }
            })

            const result = await requestPromise

            expect(result).toBe(mockRetryResponse)
            expect(mockOnTokenUpdate).not.toHaveBeenCalled()
        })

        it('should log success message when retry succeeds', async () => {
            const mock401Response = {status: 401, ok: false}
            const mockRetryResponse = {status: 200, ok: true}

            mockRequestFunction
                .mockResolvedValueOnce(mock401Response)
                .mockResolvedValueOnce(mockRetryResponse)

            const requestPromise = makeAuthenticatedRequest(
                mockRequestFunction,
                mockAuthToken,
                mockOnTokenUpdate
            )

            // Wait a tick for the event listener to be set up
            await new Promise((resolve) => setTimeout(resolve, 0))

            simulateMessageEvent({
                type: 'authDataAvailable',
                data: {
                    authData: {
                        authToken: mockNewAuthToken,
                        refreshToken: mockNewRefreshToken
                    }
                }
            })

            await requestPromise

            expect(console.log).toHaveBeenCalledWith(
                '🔄 Request failed with 401, requesting token refresh from parent...'
            )
            expect(console.log).toHaveBeenCalledWith('✅ Token refreshed successfully, retrying request...')
            expect(console.log).toHaveBeenCalledWith('✅ Retry after token refresh succeeded')
        })

        it('should log failure message when retry fails', async () => {
            const mock401Response = {status: 401, ok: false}
            const mockRetryFailResponse = {status: 500, ok: false}

            mockRequestFunction
                .mockResolvedValueOnce(mock401Response)
                .mockResolvedValueOnce(mockRetryFailResponse)

            const requestPromise = makeAuthenticatedRequest(
                mockRequestFunction,
                mockAuthToken,
                mockOnTokenUpdate
            )

            // Wait a tick for the event listener to be set up
            await new Promise((resolve) => setTimeout(resolve, 0))

            simulateMessageEvent({
                type: 'authDataAvailable',
                data: {
                    authData: {
                        authToken: mockNewAuthToken,
                        refreshToken: mockNewRefreshToken
                    }
                }
            })

            await requestPromise

            expect(console.log).toHaveBeenCalledWith('❌ Retry after token refresh still failed:', 500)
        })
    })

    describe('fetchWithTokenRefresh', () => {
        const mockUrl = 'https://api.example.com/test'
        const mockOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({test: 'data'})
        }

        it('should call fetch with correct parameters and return response', async () => {
            global.server.use(
                rest.post(mockUrl, (req, res, ctx) => {
                    return res(ctx.status(200), ctx.json({success: true}))
                })
            )

            const result = await fetchWithTokenRefresh(
                mockUrl,
                mockOptions,
                mockAuthToken,
                mockOnTokenUpdate
            )

            const resultJson = await result.json()
            expect(result.status).toBe(200)
            expect(result.ok).toBe(true)
            expect(resultJson).toEqual({success: true})
        })

        it('should handle token refresh on 401 response', async () => {
            let requestCount = 0
            global.server.use(
                rest.post(mockUrl, (req, res, ctx) => {
                    requestCount++
                    if (requestCount === 1) {
                        return res(ctx.status(401))
                    }
                    return res(ctx.status(200), ctx.json({success: true}))
                })
            )

            const requestPromise = fetchWithTokenRefresh(
                mockUrl,
                mockOptions,
                mockAuthToken,
                mockOnTokenUpdate
            )

            // Wait a tick for the event listener to be set up
            await new Promise((resolve) => setTimeout(resolve, 0))

            simulateMessageEvent({
                type: 'authDataAvailable',
                data: {
                    authData: {
                        authToken: mockNewAuthToken,
                        refreshToken: mockNewRefreshToken
                    }
                }
            })

            const result = await requestPromise

            expect(result.status).toBe(200)
            expect(requestCount).toBe(2)
            expect(mockOnTokenUpdate).toHaveBeenCalledWith(mockNewAuthToken, mockNewRefreshToken)
        })

        it('should preserve existing headers when adding Authorization header', async () => {
            let capturedHeaders
            const customUrl = 'https://api.example.com/custom-header'
            global.server.use(
                rest.get(customUrl, (req, res, ctx) => {
                    capturedHeaders = req.headers.all()
                    return res(ctx.status(200))
                })
            )

            const optionsWithHeaders = {
                method: 'GET',
                headers: {
                    'Custom-Header': 'custom-value',
                    'Another-Header': 'another-value'
                }
            }

            await fetchWithTokenRefresh(customUrl, optionsWithHeaders, mockAuthToken, mockOnTokenUpdate)

            expect(capturedHeaders['custom-header']).toBe('custom-value')
            expect(capturedHeaders['another-header']).toBe('another-value')
            expect(capturedHeaders['authorization']).toBe(`Bearer ${mockAuthToken}`)
        })

        it('should handle options without headers', async () => {
            let capturedHeaders
            const noHeaderUrl = 'https://api.example.com/no-header'
            global.server.use(
                rest.get(noHeaderUrl, (req, res, ctx) => {
                    capturedHeaders = req.headers.all()
                    return res(ctx.status(200))
                })
            )

            const optionsWithoutHeaders = {
                method: 'GET'
            }

            await fetchWithTokenRefresh(
                noHeaderUrl,
                optionsWithoutHeaders,
                mockAuthToken,
                mockOnTokenUpdate
            )
            expect(capturedHeaders['authorization']).toBe(`Bearer ${mockAuthToken}`)
        })
    })
})
