/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ApiClient} from '@salesforce/retail-react-app/app/api/adyen/api'
import {ADYEN_API_BASEPATH} from '@salesforce/retail-react-app/app/api/adyen/utils/constants'

describe('ApiClient', () => {
    let apiClient
    let mockSite = {id: 'RefArch'}

    beforeEach(() => {
        apiClient = new ApiClient(ADYEN_API_BASEPATH, 'mockToken', mockSite)
    })

    afterEach(() => {
        jest.restoreAllMocks()
    })

    it('should construct ApiClient with url and token', () => {
        expect(apiClient.url).toBe(ADYEN_API_BASEPATH)
        expect(apiClient.token).toBe('mockToken')
    })

    it('should call fetch with correct parameters for GET request', async () => {
        const mockResponse = {data: 'some data'}
        const mockJsonPromise = Promise.resolve(mockResponse)
        const mockFetchPromise = Promise.resolve({
            json: () => mockJsonPromise,
            ok: true
        })

        jest.spyOn(global, 'fetch').mockImplementation(() => mockFetchPromise)

        const options = {
            queryParams: {param: 'value'},
            headers: {customHeader: 'customValue'}
        }

        await apiClient.get(options)

        expect(global.fetch).toHaveBeenCalledWith(
            `${ADYEN_API_BASEPATH}?siteId=${mockSite.id}&param=value`,
            expect.objectContaining({
                method: 'get',
                body: null,
                headers: {
                    'Content-Type': 'application/json',
                    authorization: `Bearer mockToken`,
                    customHeader: 'customValue'
                }
            })
        )
    })

    it('should call fetch with correct parameters for POST request', async () => {
        const mockResponse = {success: true}
        const mockJsonPromise = Promise.resolve(mockResponse)
        const mockFetchPromise = Promise.resolve({
            json: () => mockJsonPromise,
            ok: true
        })

        jest.spyOn(global, 'fetch').mockImplementation(() => mockFetchPromise)

        const options = {
            body: JSON.stringify({key: 'value'}),
            headers: {customHeader: 'customValue'}
        }

        await apiClient.post(options)

        expect(global.fetch).toHaveBeenCalledWith(
            `${ADYEN_API_BASEPATH}?siteId=${mockSite.id}`,
            expect.objectContaining({
                method: 'post',
                body: JSON.stringify({key: 'value'}),
                headers: {
                    'Content-Type': 'application/json',
                    authorization: `Bearer mockToken`,
                    customHeader: 'customValue'
                }
            })
        )
    })
})
