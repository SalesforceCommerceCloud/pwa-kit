/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {AdyenShippingMethodsService} from '@salesforce/retail-react-app/app/api/adyen/services/shipping-methods'
import {ApiClient} from '@salesforce/retail-react-app/app/api/adyen/api'

jest.mock('@salesforce/retail-react-app/app/api/adyen/api', () => {
    return {
        ApiClient: jest.fn().mockImplementation(() => ({
            post: jest.fn()
        }))
    }
})

describe('AdyenShippingMethodsService', () => {
    let adyenService, apiClientMock

    beforeEach(() => {
        apiClientMock = {
            get: jest.fn().mockResolvedValue({}),
            post: jest.fn().mockResolvedValue({})
        }
        ApiClient.mockImplementation(() => apiClientMock)
        adyenService = new AdyenShippingMethodsService('token', 'site')
    })

    it('should create an instance with the correct properties', () => {
        expect(adyenService.baseUrl).toBe('/api/adyen/shipping-methods')
        expect(adyenService.apiClient).toBe(apiClientMock)
    })

    describe('getShippingMethods', () => {
        it('should call apiClient get method with correct parameters and return response', async () => {
            const basketId = 'basket-id'
            const expectedHeaders = {basketid: basketId}
            const mockResponse = {}
            const mockJsonPromise = Promise.resolve(mockResponse)
            const mockFetchPromise = Promise.resolve({
                json: () => mockJsonPromise,
                status: 200
            })

            apiClientMock.get.mockResolvedValueOnce(mockFetchPromise)

            const result = await adyenService.getShippingMethods(basketId)

            expect(apiClientMock.get).toHaveBeenCalledWith({
                headers: expectedHeaders
            })
            expect(result).toEqual(mockResponse)
        })

        it('should throw an error if response status is >= 300', async () => {
            const basketId = 'basket-id'
            const mockFetchPromise = Promise.resolve({
                status: 400,
                statusText: 'Bad Request'
            })

            adyenService.apiClient.get.mockResolvedValueOnce(mockFetchPromise)

            await expect(adyenService.getShippingMethods(basketId)).rejects.toThrow(
                '[object Object]'
            )
        })
    })

    describe('updateShippingMethod', () => {
        it('should call apiClient post method with correct parameters and return response', async () => {
            const shippingMethodId = 'method-id'
            const basketId = 'basket-id'
            const expectedBody = {shippingMethodId}
            const expectedHeaders = {basketid: basketId}
            const mockResponse = {}
            const mockJsonPromise = Promise.resolve(mockResponse)
            const mockFetchPromise = Promise.resolve({
                json: () => mockJsonPromise,
                status: 200
            })

            apiClientMock.post.mockResolvedValueOnce(mockFetchPromise)

            const result = await adyenService.updateShippingMethod(shippingMethodId, basketId)

            expect(apiClientMock.post).toHaveBeenCalledWith({
                body: JSON.stringify(expectedBody),
                headers: expectedHeaders
            })
            expect(result).toEqual(mockResponse)
        })

        it('should throw an error if response status is >= 300', async () => {
            const shippingMethodId = 'method-id'
            const basketId = 'basket-id'
            const mockFetchPromise = Promise.resolve({
                status: 400,
                statusText: 'Bad Request'
            })

            adyenService.apiClient.post.mockResolvedValueOnce(mockFetchPromise)

            await expect(
                adyenService.updateShippingMethod(shippingMethodId, basketId)
            ).rejects.toThrow('[object Object]')
        })
    })
})
