/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {AdyenShippingMethodsService} from '@salesforce/retail-react-app/app/components/apple-pay-express/utils/shipping-methods'
import {ApiClient} from '@salesforce/retail-react-app/app/components/apple-pay-express/utils/api'

// Mock the ApiClient
jest.mock('@salesforce/retail-react-app/app/components/apple-pay-express/utils/api')

describe('AdyenShippingMethodsService', () => {
    let shippingMethodsService
    let mockApiClient
    const mockToken = 'test-token'
    const mockSite = {id: 'test-site'}

    beforeEach(() => {
        mockApiClient = {
            get: jest.fn(),
            post: jest.fn()
        }
        ApiClient.mockImplementation(() => mockApiClient)
        shippingMethodsService = new AdyenShippingMethodsService(mockToken, mockSite)
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    describe('constructor', () => {
        it('should initialize with correct baseUrl', () => {
            expect(shippingMethodsService.baseUrl).toBe('/api/adyen/shipping-methods')
        })

        it('should create ApiClient with correct parameters', () => {
            expect(ApiClient).toHaveBeenCalledWith(
                '/api/adyen/shipping-methods',
                mockToken,
                mockSite
            )
        })
    })

    describe('getShippingMethods', () => {
        const mockBasketId = 'basket-123'
        const mockResponseData = {
            applicableShippingMethods: [
                {id: 'method1', name: 'Standard Shipping'},
                {id: 'method2', name: 'Express Shipping'}
            ]
        }

        it('should get shipping methods successfully', async () => {
            const mockResponse = {
                status: 200,
                json: jest.fn().mockResolvedValue(mockResponseData)
            }
            mockApiClient.get.mockResolvedValue(mockResponse)

            const result = await shippingMethodsService.getShippingMethods(mockBasketId)

            expect(mockApiClient.get).toHaveBeenCalledWith({
                headers: {
                    basketid: mockBasketId
                }
            })
            expect(result).toEqual(mockResponseData)
        })

        it('should handle error response (status >= 300)', async () => {
            const errorMessage = 'Failed to fetch shipping methods'
            const mockResponse = {
                status: 400,
                text: jest.fn().mockResolvedValue(errorMessage)
            }
            mockApiClient.get.mockResolvedValue(mockResponse)

            await expect(shippingMethodsService.getShippingMethods(mockBasketId)).rejects.toThrow(
                `Request failed with status 400: ${errorMessage}`
            )

            expect(mockApiClient.get).toHaveBeenCalledWith({
                headers: {
                    basketid: mockBasketId
                }
            })
        })

        it('should handle 500 error response', async () => {
            const errorMessage = 'Internal server error'
            const mockResponse = {
                status: 500,
                text: jest.fn().mockResolvedValue(errorMessage)
            }
            mockApiClient.get.mockResolvedValue(mockResponse)

            await expect(shippingMethodsService.getShippingMethods(mockBasketId)).rejects.toThrow(
                `Request failed with status 500: ${errorMessage}`
            )
        })

        it('should handle 404 error response', async () => {
            const errorMessage = 'Basket not found'
            const mockResponse = {
                status: 404,
                text: jest.fn().mockResolvedValue(errorMessage)
            }
            mockApiClient.get.mockResolvedValue(mockResponse)

            await expect(shippingMethodsService.getShippingMethods(mockBasketId)).rejects.toThrow(
                `Request failed with status 404: ${errorMessage}`
            )
        })
    })

    describe('updateShippingMethod', () => {
        const mockShippingMethodId = 'method-123'
        const mockBasketId = 'basket-123'
        const mockResponseData = {result: 'success'}

        it('should update shipping method successfully', async () => {
            const mockResponse = {
                status: 200,
                json: jest.fn().mockResolvedValue(mockResponseData)
            }
            mockApiClient.post.mockResolvedValue(mockResponse)

            const result = await shippingMethodsService.updateShippingMethod(
                mockShippingMethodId,
                mockBasketId
            )

            expect(mockApiClient.post).toHaveBeenCalledWith({
                body: JSON.stringify({
                    shippingMethodId: mockShippingMethodId
                }),
                headers: {
                    basketid: mockBasketId
                }
            })
            expect(result).toEqual(mockResponseData)
        })

        it('should handle error response (status >= 300)', async () => {
            const errorMessage = 'Failed to update shipping method'
            const mockResponse = {
                status: 400,
                text: jest.fn().mockResolvedValue(errorMessage)
            }
            mockApiClient.post.mockResolvedValue(mockResponse)

            await expect(
                shippingMethodsService.updateShippingMethod(mockShippingMethodId, mockBasketId)
            ).rejects.toThrow(`Request failed with status 400: ${errorMessage}`)

            expect(mockApiClient.post).toHaveBeenCalledWith({
                body: JSON.stringify({
                    shippingMethodId: mockShippingMethodId
                }),
                headers: {
                    basketid: mockBasketId
                }
            })
        })

        it('should handle 500 error response', async () => {
            const errorMessage = 'Internal server error'
            const mockResponse = {
                status: 500,
                text: jest.fn().mockResolvedValue(errorMessage)
            }
            mockApiClient.post.mockResolvedValue(mockResponse)

            await expect(
                shippingMethodsService.updateShippingMethod(mockShippingMethodId, mockBasketId)
            ).rejects.toThrow(`Request failed with status 500: ${errorMessage}`)
        })

        it('should handle 404 error response', async () => {
            const errorMessage = 'Shipping method not found'
            const mockResponse = {
                status: 404,
                text: jest.fn().mockResolvedValue(errorMessage)
            }
            mockApiClient.post.mockResolvedValue(mockResponse)

            await expect(
                shippingMethodsService.updateShippingMethod(mockShippingMethodId, mockBasketId)
            ).rejects.toThrow(`Request failed with status 404: ${errorMessage}`)
        })
    })
})
