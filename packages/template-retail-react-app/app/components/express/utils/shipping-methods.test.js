/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {AdyenShippingMethodsService} from '@salesforce/retail-react-app/app/components/express/utils/shipping-methods'

// Mock the ApiClient
jest.mock('./api')

describe('AdyenShippingMethodsService', () => {
    let shippingMethodsService
    let mockApiClient
    const mockToken = 'test-token'
    const mockSite = {id: 'test-site'}

    beforeEach(async () => {
        mockApiClient = {
            get: jest.fn(),
            post: jest.fn()
        }

        // Mock the ApiClient constructor
        const {ApiClient} = await import('./api')
        ApiClient.mockImplementation(() => mockApiClient)

        shippingMethodsService = new AdyenShippingMethodsService(mockToken, mockSite)
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    describe('constructor', () => {
        it('should initialize with correct base URL', () => {
            expect(shippingMethodsService.baseUrl).toBe('/api/adyen/shipping-methods')
        })

        it('should create ApiClient with correct parameters', async () => {
            const {ApiClient} = await import('./api')
            expect(ApiClient).toHaveBeenCalledWith(
                '/api/adyen/shipping-methods',
                mockToken,
                mockSite
            )
        })
    })

    describe('_handleResponse', () => {
        it('should return JSON response for successful request', async () => {
            const mockResponse = {
                status: 200,
                json: () => Promise.resolve({shippingMethods: []})
            }

            const result = await shippingMethodsService._handleResponse(mockResponse)

            expect(result).toEqual({shippingMethods: []})
        })

        it('should throw error for failed request', async () => {
            const mockResponse = {
                status: 400,
                text: () => Promise.resolve('Bad Request')
            }

            await expect(shippingMethodsService._handleResponse(mockResponse)).rejects.toThrow(
                'Request failed with status 400: Bad Request'
            )
        })
    })

    describe('getShippingMethods', () => {
        const mockBasketId = 'test-basket-id'

        it('should get shipping methods successfully', async () => {
            const mockResponse = {
                status: 200,
                json: () =>
                    Promise.resolve({
                        shippingMethods: [
                            {id: 'method-1', name: 'Standard Shipping'},
                            {id: 'method-2', name: 'Express Shipping'}
                        ]
                    })
            }
            mockApiClient.get.mockResolvedValue(mockResponse)

            const result = await shippingMethodsService.getShippingMethods(mockBasketId)

            expect(mockApiClient.get).toHaveBeenCalledWith({
                headers: {
                    basketid: mockBasketId
                }
            })

            expect(result).toEqual({
                shippingMethods: [
                    {id: 'method-1', name: 'Standard Shipping'},
                    {id: 'method-2', name: 'Express Shipping'}
                ]
            })
        })

        it('should handle error response', async () => {
            const mockResponse = {
                status: 500,
                text: () => Promise.resolve('Internal Server Error')
            }
            mockApiClient.get.mockResolvedValue(mockResponse)

            await expect(shippingMethodsService.getShippingMethods(mockBasketId)).rejects.toThrow(
                'Request failed with status 500: Internal Server Error'
            )
        })
    })

    describe('updateShippingMethod', () => {
        const mockShippingMethodId = 'method-1'
        const mockBasketId = 'test-basket-id'

        it('should update shipping method successfully', async () => {
            const mockResponse = {
                status: 200,
                json: () =>
                    Promise.resolve({
                        success: true,
                        orderTotal: 105.99,
                        currency: 'USD'
                    })
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

            expect(result).toEqual({
                success: true,
                orderTotal: 105.99,
                currency: 'USD'
            })
        })

        it('should handle error response', async () => {
            const mockResponse = {
                status: 400,
                text: () => Promise.resolve('Invalid shipping method')
            }
            mockApiClient.post.mockResolvedValue(mockResponse)

            await expect(
                shippingMethodsService.updateShippingMethod(mockShippingMethodId, mockBasketId)
            ).rejects.toThrow('Request failed with status 400: Invalid shipping method')
        })
    })
})
