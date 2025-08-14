/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {AdyenEnvironmentService} from '@salesforce/retail-react-app/app/api/adyen/services/environment'
import {ApiClient} from '@salesforce/retail-react-app/app/api/adyen/api'

jest.mock('@salesforce/retail-react-app/app/api/adyen/api', () => {
    return {
        ApiClient: jest.fn().mockImplementation(() => ({
            get: jest.fn()
        }))
    }
})

describe('AdyenEnvironmentService', () => {
    let adyenService
    let mockToken = 'mockToken'
    let mockSite = {id: 'RefArch'}

    beforeEach(() => {
        adyenService = new AdyenEnvironmentService(mockToken, mockSite)
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    it('should create an instance of AdyenEnvironmentService with ApiClient', () => {
        expect(ApiClient).toHaveBeenCalledWith('/api/adyen/environment', mockToken, mockSite)
    })

    it('should fetch environment successfully', async () => {
        const mockResponse = {environmentData: 'some data'}
        const mockJsonPromise = Promise.resolve(mockResponse)
        const mockFetchPromise = Promise.resolve({
            json: () => mockJsonPromise,
            status: 200
        })

        adyenService.apiClient.get.mockResolvedValueOnce(mockFetchPromise)

        const environmentData = await adyenService.fetchEnvironment()

        expect(adyenService.apiClient.get).toHaveBeenCalled()
        expect(environmentData).toEqual(mockResponse)
    })

    it('should throw an error when fetchEnvironment gets a status >= 300', async () => {
        const mockFetchPromise = Promise.resolve({
            status: 400,
            statusText: 'Bad Request'
        })

        adyenService.apiClient.get.mockResolvedValueOnce(mockFetchPromise)

        await expect(adyenService.fetchEnvironment()).rejects.toThrow('[object Object]')
    })
})
