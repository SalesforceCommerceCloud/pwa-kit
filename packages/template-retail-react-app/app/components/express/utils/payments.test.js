/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {AdyenPaymentsService} from '@salesforce/retail-react-app/app/components/express/utils/payments'

// Mock the ApiClient
jest.mock('./api')

describe('AdyenPaymentsService', () => {
    let paymentsService
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

        paymentsService = new AdyenPaymentsService(mockToken, mockSite)
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    describe('constructor', () => {
        it('should initialize with correct base URL', () => {
            expect(paymentsService.baseUrl).toBe('/api/adyen/payments')
        })

        it('should create ApiClient with correct parameters', async () => {
            const {ApiClient} = await import('./api')
            expect(ApiClient).toHaveBeenCalledWith('/api/adyen/payments', mockToken, mockSite)
        })
    })

    describe('submitPayment', () => {
        const mockAdyenStateData = {
            paymentType: 'express',
            paymentMethod: {
                type: 'googlepay',
                googlePayToken: 'test-token'
            }
        }
        const mockBasketId = 'test-basket-id'
        const mockCustomerId = 'test-customer-id'

        it('should submit payment successfully', async () => {
            const mockResponse = {
                status: 200,
                json: () =>
                    Promise.resolve({
                        isFinal: true,
                        isSuccessful: true,
                        merchantReference: 'order-123'
                    })
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

            expect(result).toEqual({
                isFinal: true,
                isSuccessful: true,
                merchantReference: 'order-123'
            })
        })

        it('should throw error on failed request', async () => {
            const mockResponse = {
                status: 400,
                text: () => Promise.resolve('Bad Request')
            }
            mockApiClient.post.mockResolvedValue(mockResponse)

            await expect(
                paymentsService.submitPayment(mockAdyenStateData, mockBasketId, mockCustomerId)
            ).rejects.toThrow('Request failed with status 400: Bad Request')
        })

        it('should throw error on network error', async () => {
            const networkError = new Error('Network error')
            mockApiClient.post.mockRejectedValue(networkError)

            await expect(
                paymentsService.submitPayment(mockAdyenStateData, mockBasketId, mockCustomerId)
            ).rejects.toThrow('Network error')
        })
    })
})
