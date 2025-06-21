/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {AdyenShippingAddressService} from '@salesforce/retail-react-app/app/components/apple-pay-express/utils/shipping-address'
import {ApiClient} from '@salesforce/retail-react-app/app/components/apple-pay-express/utils/api'

// Mock the ApiClient
jest.mock('@salesforce/retail-react-app/app/components/apple-pay-express/utils/api')

describe('AdyenShippingAddressService', () => {
    let shippingAddressService
    let mockApiClient
    const mockToken = 'test-token'
    const mockSite = {id: 'test-site'}

    beforeEach(() => {
        mockApiClient = {
            post: jest.fn()
        }
        ApiClient.mockImplementation(() => mockApiClient)
        shippingAddressService = new AdyenShippingAddressService(mockToken, mockSite)
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    describe('constructor', () => {
        it('should initialize with correct baseUrl', () => {
            expect(shippingAddressService.baseUrl).toBe('/api/adyen/shipping-address')
        })

        it('should create ApiClient with correct parameters', () => {
            expect(ApiClient).toHaveBeenCalledWith(
                '/api/adyen/shipping-address',
                mockToken,
                mockSite
            )
        })
    })

    describe('updateShippingAddress', () => {
        const mockBasketId = 'basket-123'
        const mockAddressData = {
            street: '123 Main St',
            city: 'Test City',
            state: 'CA',
            zipCode: '12345',
            country: 'US'
        }
        const mockResponseData = {result: 'success'}

        it('should update shipping address successfully', async () => {
            const mockResponse = {
                status: 200,
                json: jest.fn().mockResolvedValue(mockResponseData)
            }
            mockApiClient.post.mockResolvedValue(mockResponse)

            const result = await shippingAddressService.updateShippingAddress(
                mockBasketId,
                mockAddressData
            )

            expect(mockApiClient.post).toHaveBeenCalledWith({
                body: JSON.stringify({
                    data: mockAddressData
                }),
                headers: {
                    basketid: mockBasketId
                }
            })
            expect(result).toEqual(mockResponseData)
        })

        it('should handle error response (status >= 300)', async () => {
            const errorMessage = 'Address update failed'
            const mockResponse = {
                status: 400,
                text: jest.fn().mockResolvedValue(errorMessage)
            }
            mockApiClient.post.mockResolvedValue(mockResponse)

            await expect(
                shippingAddressService.updateShippingAddress(mockBasketId, mockAddressData)
            ).rejects.toThrow(`Request failed with status 400: ${errorMessage}`)

            expect(mockApiClient.post).toHaveBeenCalledWith({
                body: JSON.stringify({
                    data: mockAddressData
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
                shippingAddressService.updateShippingAddress(mockBasketId, mockAddressData)
            ).rejects.toThrow(`Request failed with status 500: ${errorMessage}`)
        })

        it('should handle 404 error response', async () => {
            const errorMessage = 'Basket not found'
            const mockResponse = {
                status: 404,
                text: jest.fn().mockResolvedValue(errorMessage)
            }
            mockApiClient.post.mockResolvedValue(mockResponse)

            await expect(
                shippingAddressService.updateShippingAddress(mockBasketId, mockAddressData)
            ).rejects.toThrow(`Request failed with status 404: ${errorMessage}`)
        })

        it('should handle empty address data', async () => {
            const mockResponse = {
                status: 200,
                json: jest.fn().mockResolvedValue(mockResponseData)
            }
            mockApiClient.post.mockResolvedValue(mockResponse)

            const result = await shippingAddressService.updateShippingAddress(mockBasketId, {})

            expect(mockApiClient.post).toHaveBeenCalledWith({
                body: JSON.stringify({
                    data: {}
                }),
                headers: {
                    basketid: mockBasketId
                }
            })
            expect(result).toEqual(mockResponseData)
        })
    })
})
