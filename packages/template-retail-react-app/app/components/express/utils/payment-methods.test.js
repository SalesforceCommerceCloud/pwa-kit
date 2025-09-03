/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {AdyenPaymentMethodsService} from '@salesforce/retail-react-app/app/components/express/utils/payment-methods'
import {ApiClient} from '@salesforce/retail-react-app/app/components/express/utils/api'

// Mock the ApiClient
jest.mock('@salesforce/retail-react-app/app/components/express/utils/api')

describe('AdyenPaymentMethodsService', () => {
    let paymentMethodsService
    let mockApiClient
    const mockToken = 'test-token'
    const mockRefreshToken = 'test-refresh-token'
    const mockSite = {id: 'test-site'}

    beforeEach(() => {
        mockApiClient = {
            get: jest.fn()
        }
        ApiClient.mockImplementation(() => mockApiClient)
        paymentMethodsService = new AdyenPaymentMethodsService(mockToken, mockRefreshToken, mockSite)
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    describe('constructor', () => {
        it('should initialize with correct baseUrl', () => {
            expect(paymentMethodsService.baseUrl).toBe('/api/adyen/paymentMethods/standalone')
        })

        it('should create ApiClient with correct parameters', () => {
            expect(ApiClient).toHaveBeenCalledWith(
                '/api/adyen/paymentMethods/standalone',
                mockToken,
                mockRefreshToken,
                mockSite
            )
        })
    })

    describe('getPaymentMethods', () => {
        const mockResponseData = {
            paymentMethods: [
                {
                    type: 'applepay',
                    configuration: {
                        merchantName: 'Test Merchant',
                        merchantIdentifier: 'merchant.test'
                    }
                },
                {
                    type: 'scheme',
                    name: 'Credit Card'
                }
            ],
            environment: {
                ADYEN_ENVIRONMENT: 'test',
                ADYEN_CLIENT_KEY: 'test_client_key'
            },
            applicationInfo: {
                adyenLibrary: {
                    name: 'adyen-salesforce-pwa',
                    version: '3.0.0'
                }
            }
        }

        it('should get payment methods successfully', async () => {
            const mockResponse = {
                status: 200,
                json: jest.fn().mockResolvedValue(mockResponseData)
            }
            mockApiClient.get.mockResolvedValue(mockResponse)

            const result = await paymentMethodsService.getPaymentMethods()

            expect(mockApiClient.get).toHaveBeenCalledWith({
                headers: {
                    // No basket ID required for this standalone endpoint
                }
            })
            expect(result).toEqual(mockResponseData)
        })

        it('should handle error response (status >= 300)', async () => {
            const errorMessage = 'Failed to fetch payment methods'
            const mockResponse = {
                status: 400,
                text: jest.fn().mockResolvedValue(errorMessage)
            }
            mockApiClient.get.mockResolvedValue(mockResponse)

            await expect(paymentMethodsService.getPaymentMethods()).rejects.toThrow(
                `Request failed with status 400: ${errorMessage}`
            )

            expect(mockApiClient.get).toHaveBeenCalledWith({
                headers: {}
            })
        })

        it('should handle 500 error response', async () => {
            const errorMessage = 'Internal server error'
            const mockResponse = {
                status: 500,
                text: jest.fn().mockResolvedValue(errorMessage)
            }
            mockApiClient.get.mockResolvedValue(mockResponse)

            await expect(paymentMethodsService.getPaymentMethods()).rejects.toThrow(
                `Request failed with status 500: ${errorMessage}`
            )
        })

        it('should handle network errors', async () => {
            mockApiClient.get.mockRejectedValue(new Error('Network error'))

            await expect(paymentMethodsService.getPaymentMethods()).rejects.toThrow('Network error')
        })
    })
})
