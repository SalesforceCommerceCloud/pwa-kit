/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {
    createTemporaryBasket,
    deleteTemporaryBasket,
    cleanupTemporaryBasket,
    createCleanupFunction
} from '@salesforce/retail-react-app/app/components/express/utils/pdp/temporary-basket'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'

// Mock the getConfig function
jest.mock('@salesforce/pwa-kit-runtime/utils/ssr-config', () => ({
    getConfig: jest.fn()
}))

describe('Temporary Basket', () => {
    const mockAuthToken = 'test-auth-token'
    const mockSite = {id: 'test-site-id'}
    const mockOrganizationId = 'test-org-id'
    const mockSku = 'test-sku'
    const mockBasketId = 'test-basket-id'
    let consoleWarnSpy

    beforeAll(() => {
        global.fetch = jest.fn()
    })

    beforeEach(() => {
        jest.clearAllMocks()
        getConfig.mockReturnValue({
            app: {
                commerceAPI: {
                    parameters: {
                        organizationId: mockOrganizationId
                    }
                }
            }
        })
        consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
    })

    afterEach(() => {
        consoleWarnSpy.mockRestore()
    })

    const mockSuccessResponse = (data) => ({
        ok: true,
        json: () => Promise.resolve(data)
    })

    const mockErrorResponse = (status, text) => ({
        ok: false,
        status,
        text: () => Promise.resolve(text)
    })

    describe('createTemporaryBasket', () => {
        it('should create a temporary basket successfully', async () => {
            const mockTempBasket = {basketId: mockBasketId}
            global.fetch.mockResolvedValue(mockSuccessResponse(mockTempBasket))

            const result = await createTemporaryBasket(mockSku, mockAuthToken, mockSite)

            expect(global.fetch).toHaveBeenCalledWith(
                `/mobify/proxy/api/checkout/shopper-baskets/v2/organizations/${mockOrganizationId}/baskets?siteId=${mockSite.id}&temporary=true`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${mockAuthToken}`
                    },
                    body: JSON.stringify({
                        productItems: [{productId: mockSku, quantity: 1}]
                    })
                }
            )
            expect(result).toEqual(mockTempBasket)
        })

        it('should throw an error if SKU is not provided', async () => {
            await expect(createTemporaryBasket(null, mockAuthToken, mockSite)).rejects.toThrow(
                'SKU is required to create temporary basket'
            )
        })

        it('should throw an error if authToken is not provided', async () => {
            await expect(createTemporaryBasket(mockSku, null, mockSite)).rejects.toThrow(
                'Authentication token is required'
            )
        })

        it('should throw an error if site ID is not provided', async () => {
            await expect(createTemporaryBasket(mockSku, mockAuthToken, {})).rejects.toThrow(
                'Site ID is required'
            )
        })

        it('should throw an error if organization ID is missing from config', async () => {
            getConfig.mockReturnValue({
                app: {
                    commerceAPI: {
                        parameters: {}
                    }
                }
            })

            await expect(createTemporaryBasket(mockSku, mockAuthToken, mockSite)).rejects.toThrow(
                'Organization ID is required and not found in configuration'
            )
        })

        it('should throw an error for a failed API request', async () => {
            global.fetch.mockResolvedValue(mockErrorResponse(500, 'Server Error'))

            await expect(createTemporaryBasket(mockSku, mockAuthToken, mockSite)).rejects.toThrow(
                'HTTP error! status: 500, message: Server Error'
            )
        })

        it('should throw an error for an invalid basket response', async () => {
            global.fetch.mockResolvedValue(mockSuccessResponse({}))

            await expect(createTemporaryBasket(mockSku, mockAuthToken, mockSite)).rejects.toThrow(
                'Invalid temporary basket response'
            )
        })
    })

    describe('deleteTemporaryBasket', () => {
        it('should delete a temporary basket successfully', async () => {
            global.fetch.mockResolvedValue({ok: true})

            const result = await deleteTemporaryBasket(mockBasketId, mockAuthToken, mockSite)

            expect(global.fetch).toHaveBeenCalledWith(
                `/mobify/proxy/api/checkout/shopper-baskets/v2/organizations/${mockOrganizationId}/baskets/${mockBasketId}?siteId=${mockSite.id}`,
                {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${mockAuthToken}`
                    }
                }
            )
            expect(result).toBe(true)
        })

        it('should return false if basketId is not provided', async () => {
            const result = await deleteTemporaryBasket(null, mockAuthToken, mockSite)
            expect(result).toBe(false)
            expect(global.fetch).not.toHaveBeenCalled()
        })

        it('should return false if authToken is not provided', async () => {
            const result = await deleteTemporaryBasket(mockBasketId, null, mockSite)
            expect(result).toBe(false)
            expect(global.fetch).not.toHaveBeenCalled()
        })

        it('should return false if site ID is not provided', async () => {
            const result = await deleteTemporaryBasket(mockBasketId, mockAuthToken, {})
            expect(result).toBe(false)
            expect(global.fetch).not.toHaveBeenCalled()
        })

        it('should return false if organization ID is missing from config', async () => {
            getConfig.mockReturnValue({
                app: {
                    commerceAPI: {
                        parameters: {}
                    }
                }
            })

            const result = await deleteTemporaryBasket(mockBasketId, mockAuthToken, mockSite)
            expect(result).toBe(false)
            expect(global.fetch).not.toHaveBeenCalled()
        })

        it('should handle API errors gracefully and return false', async () => {
            global.fetch.mockRejectedValue(new Error('Network failure'))

            const result = await deleteTemporaryBasket(mockBasketId, mockAuthToken, mockSite)
            expect(result).toBe(false)
            expect(console.warn).toHaveBeenCalledWith(
                'Failed to delete temporary basket:',
                expect.any(Error)
            )
        })

        it('should return false for a non-ok response', async () => {
            global.fetch.mockResolvedValue({ok: false})
            const result = await deleteTemporaryBasket(mockBasketId, mockAuthToken, mockSite)
            expect(result).toBe(false)
        })
    })

    describe('cleanupTemporaryBasket', () => {
        it('should not do anything if not in PDP mode', async () => {
            const sharedBasketRef = {basketId: mockBasketId}
            await cleanupTemporaryBasket(false, sharedBasketRef, mockAuthToken, mockSite, jest.fn())
            expect(global.fetch).not.toHaveBeenCalled()
        })

        it('should delete basket and update state if in PDP mode', async () => {
            global.fetch.mockResolvedValue({ok: true})
            const sharedBasketRef = {current: {basketId: mockBasketId}}
            const setTempBasket = jest.fn()

            await cleanupTemporaryBasket(
                true,
                sharedBasketRef.current,
                mockAuthToken,
                mockSite,
                setTempBasket
            )

            expect(global.fetch).toHaveBeenCalledTimes(1)
            expect(setTempBasket).toHaveBeenCalledWith(null)
        })

        it('should handle errors during cleanup gracefully', async () => {
            const error = new Error('Cleanup failed')
            global.fetch.mockRejectedValue(error)
            const sharedBasketRef = {current: {basketId: mockBasketId}}
            const setTempBasket = jest.fn()

            await cleanupTemporaryBasket(
                true,
                sharedBasketRef.current,
                mockAuthToken,
                mockSite,
                setTempBasket
            )

            expect(console.warn).toHaveBeenCalledWith('Failed to delete temporary basket:', error)
            expect(setTempBasket).toHaveBeenCalledWith(null)
        })

        it('should handle deleteTemporaryBasket function errors correctly', async () => {
            // When getConfig throws an error, deleteTemporaryBasket catches it and logs its own warning
            const configError = new Error('Config error')
            getConfig.mockImplementation(() => {
                throw configError
            })

            const sharedBasketRef = {basketId: mockBasketId}
            const setTempBasket = jest.fn()

            await cleanupTemporaryBasket(
                true,
                sharedBasketRef,
                mockAuthToken,
                mockSite,
                setTempBasket
            )

            // deleteTemporaryBasket catches the config error and logs its own warning
            expect(console.warn).toHaveBeenCalledWith(
                'Failed to delete temporary basket:',
                configError
            )
        })

        it('should handle setTempBasket throwing an error', async () => {
            global.fetch.mockResolvedValue({ok: true})
            const setTempBasketError = new Error('setTempBasket failed')
            const setTempBasket = jest.fn().mockImplementation(() => {
                throw setTempBasketError
            })
            const sharedBasketRef = {basketId: mockBasketId}

            await cleanupTemporaryBasket(
                true,
                sharedBasketRef,
                mockAuthToken,
                mockSite,
                setTempBasket
            )

            // Should catch the error from setTempBasket and log cleanup warning
            expect(console.warn).toHaveBeenCalledWith(
                'Failed to cleanup temporary basket:',
                setTempBasketError
            )
        })

        it('should handle cleanup when setTempBasket is null', async () => {
            global.fetch.mockResolvedValue({ok: true})
            const sharedBasketRef = {basketId: mockBasketId}

            await cleanupTemporaryBasket(
                true,
                sharedBasketRef,
                mockAuthToken,
                mockSite,
                null // setTempBasket is null
            )

            expect(global.fetch).toHaveBeenCalledTimes(1)
        })
    })

    describe('createCleanupFunction', () => {
        it('should return a function that calls cleanupTemporaryBasket', () => {
            const sharedBasketRef = {current: {basketId: mockBasketId}}
            const setTempBasket = jest.fn()
            const cleanupFn = createCleanupFunction(
                true,
                sharedBasketRef.current,
                mockAuthToken,
                mockSite,
                setTempBasket
            )

            expect(typeof cleanupFn).toBe('function')

            cleanupFn()
        })
    })
})
