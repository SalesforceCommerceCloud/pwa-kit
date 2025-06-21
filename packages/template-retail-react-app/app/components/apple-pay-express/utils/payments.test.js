/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {AdyenPaymentsService} from '@salesforce/retail-react-app/app/components/apple-pay-express/utils/payments'
import {ApiClient} from '@salesforce/retail-react-app/app/components/apple-pay-express/utils/api'

// Mock the ApiClient
jest.mock('@salesforce/retail-react-app/app/components/apple-pay-express/utils/api')

describe('AdyenPaymentsService', () => {
    let paymentsService
    let mockApiClient
    const mockToken = 'test-token'
    const mockSite = {id: 'test-site'}

    beforeEach(() => {
        mockApiClient = {
            post: jest.fn()
        }
        ApiClient.mockImplementation(() => mockApiClient)
        paymentsService = new AdyenPaymentsService(mockToken, mockSite)
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    describe('constructor', () => {
        it('should initialize with correct baseUrl', () => {
            expect(paymentsService.baseUrl).toBe('/api/adyen/payments')
        })

        it('should create ApiClient with correct parameters', () => {
            expect(ApiClient).toHaveBeenCalledWith('/api/adyen/payments', mockToken, mockSite)
        })
    })

    describe('submitPayment', () => {
        const mockAdyenStateData = {paymentMethod: 'applepay'}
        const mockBasketId = 'basket-123'
        const mockCustomerId = 'customer-456'
        const mockResponseData = {result: 'success'}

        it('should submit payment successfully', async () => {
            const mockResponse = {
                status: 200,
                json: jest.fn().mockResolvedValue(mockResponseData)
            }
            mockApiClient.post.mockResolvedValue(mockResponse)

            const result = await paymentsService.submitPayment(
                mockAdyenStateData,
                mockBasketId,
                mockCustomerId
            )

            expect(mockApiClient.post).toHaveBeenCalledWith({
                body: JSON.stringify({
                    data: mockAdyenStateData
                }),
                headers: {
                    customerid: mockCustomerId,
                    basketid: mockBasketId
                }
            })
            expect(result).toEqual(mockResponseData)
        })

        it('should handle error response (status >= 300)', async () => {
            const errorMessage = 'Payment failed'
            const mockResponse = {
                status: 400,
                text: jest.fn().mockResolvedValue(errorMessage)
            }
            mockApiClient.post.mockResolvedValue(mockResponse)

            await expect(
                paymentsService.submitPayment(mockAdyenStateData, mockBasketId, mockCustomerId)
            ).rejects.toThrow(`Request failed with status 400: ${errorMessage}`)

            expect(mockApiClient.post).toHaveBeenCalledWith({
                body: JSON.stringify({
                    data: mockAdyenStateData
                }),
                headers: {
                    customerid: mockCustomerId,
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
                paymentsService.submitPayment(mockAdyenStateData, mockBasketId, mockCustomerId)
            ).rejects.toThrow(`Request failed with status 500: ${errorMessage}`)
        })

        it('should handle 404 error response', async () => {
            const errorMessage = 'Not found'
            const mockResponse = {
                status: 404,
                text: jest.fn().mockResolvedValue(errorMessage)
            }
            mockApiClient.post.mockResolvedValue(mockResponse)

            await expect(
                paymentsService.submitPayment(mockAdyenStateData, mockBasketId, mockCustomerId)
            ).rejects.toThrow(`Request failed with status 404: ${errorMessage}`)
        })
    })
})
