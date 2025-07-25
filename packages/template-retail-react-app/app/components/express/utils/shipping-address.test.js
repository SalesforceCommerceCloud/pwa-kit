/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {AdyenShippingAddressService} from '@salesforce/retail-react-app/app/components/express/utils/shipping-address'

// Mock the ApiClient
jest.mock('./api')

describe('AdyenShippingAddressService', () => {
    let shippingAddressService
    let mockApiClient
    const mockToken = 'test-token'
    const mockSite = {id: 'test-site'}

    beforeEach(async () => {
        mockApiClient = {
            post: jest.fn()
        }

        // Mock the ApiClient constructor
        const {ApiClient} = await import('./api')
        ApiClient.mockImplementation(() => mockApiClient)

        shippingAddressService = new AdyenShippingAddressService(mockToken, mockSite)
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    describe('constructor', () => {
        it('should initialize with correct base URL', () => {
            expect(shippingAddressService.baseUrl).toBe('/api/adyen/shipping-address')
        })

        it('should create ApiClient with correct parameters', async () => {
            const {ApiClient} = await import('./api')
            expect(ApiClient).toHaveBeenCalledWith(
                '/api/adyen/shipping-address',
                mockToken,
                mockSite
            )
        })
    })

    describe('updateShippingAddress', () => {
        const mockBasketId = 'test-basket-id'
        const mockData = {
            deliveryAddress: {
                city: 'San Francisco',
                country: 'US',
                street: '123 Main St',
                postalCode: '94102',
                stateOrProvince: 'CA'
            },
            profile: {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                phone: '+1234567890'
            }
        }

        it('should update shipping address successfully', async () => {
            const mockResponse = {
                status: 200,
                json: () =>
                    Promise.resolve({
                        success: true,
                        basketId: mockBasketId
                    })
            }
            mockApiClient.post.mockResolvedValue(mockResponse)

            const result = await shippingAddressService.updateShippingAddress(
                mockBasketId,
                mockData
            )

            expect(mockApiClient.post).toHaveBeenCalledWith({
                body: JSON.stringify({
                    data: mockData
                }),
                headers: {
                    basketid: mockBasketId
                }
            })

            expect(result).toEqual({
                success: true,
                basketId: mockBasketId
            })
        })

        it('should throw error on failed request', async () => {
            const mockResponse = {
                status: 400,
                text: () => Promise.resolve('Invalid address')
            }
            mockApiClient.post.mockResolvedValue(mockResponse)

            await expect(
                shippingAddressService.updateShippingAddress(mockBasketId, mockData)
            ).rejects.toThrow('Request failed with status 400: Invalid address')
        })

        it('should throw error on network error', async () => {
            const networkError = new Error('Network error')
            mockApiClient.post.mockRejectedValue(networkError)

            await expect(
                shippingAddressService.updateShippingAddress(mockBasketId, mockData)
            ).rejects.toThrow('Network error')
        })

        it('should handle server error response', async () => {
            const mockResponse = {
                status: 500,
                text: () => Promise.resolve('Internal Server Error')
            }
            mockApiClient.post.mockResolvedValue(mockResponse)

            await expect(
                shippingAddressService.updateShippingAddress(mockBasketId, mockData)
            ).rejects.toThrow('Request failed with status 500: Internal Server Error')
        })
    })
})
