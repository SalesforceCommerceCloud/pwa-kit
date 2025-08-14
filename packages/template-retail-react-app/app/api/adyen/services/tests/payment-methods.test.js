/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {AdyenPaymentMethodsService} from '@salesforce/retail-react-app/app/api/adyen/services/payment-methods'
import {ApiClient} from '@salesforce/retail-react-app/app/api/adyen/api'
import {
    CUSTOMER_ID_MOCK,
    LOCALE_MOCK
} from '@salesforce/retail-react-app/app/api/adyen/utils/constants'

jest.mock('../api', () => {
    return {
        ApiClient: jest.fn().mockImplementation(() => ({
            get: jest.fn()
        }))
    }
})

describe('AdyenPaymentMethodsService', () => {
    let paymentMethodsService
    let mockToken = 'mockToken'
    let mockCustomerId = CUSTOMER_ID_MOCK
    let mockLocale = {id: LOCALE_MOCK}
    let mockSite = {id: 'RefArch'}

    beforeEach(() => {
        paymentMethodsService = new AdyenPaymentMethodsService(mockToken, mockSite)
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    it('should create an instance of AdyenPaymentMethodsService with ApiClient', () => {
        expect(ApiClient).toHaveBeenCalledWith('/api/adyen/paymentMethods', mockToken, mockSite)
    })

    it('should fetch payment methods successfully', async () => {
        const mockResponse = {paymentMethods: ['visa', 'paypal']}
        const mockJsonPromise = Promise.resolve(mockResponse)
        const mockFetchPromise = Promise.resolve({
            json: () => mockJsonPromise,
            status: 200
        })

        paymentMethodsService.apiClient.get.mockResolvedValueOnce(mockFetchPromise)

        const paymentMethods = await paymentMethodsService.fetchPaymentMethods(
            mockCustomerId,
            mockLocale
        )

        expect(paymentMethodsService.apiClient.get).toHaveBeenCalledWith({
            queryParams: {locale: mockLocale.id},
            headers: {customerid: mockCustomerId}
        })
        expect(paymentMethods).toEqual(mockResponse)
    })

    it('should throw an error when fetchPaymentMethods gets a status >= 300', async () => {
        const mockFetchPromise = Promise.resolve({
            status: 400,
            statusText: 'Bad Request'
        })

        paymentMethodsService.apiClient.get.mockResolvedValueOnce(mockFetchPromise)

        await expect(
            paymentMethodsService.fetchPaymentMethods(mockCustomerId, mockLocale)
        ).rejects.toThrow('[object Object]')
    })
})
