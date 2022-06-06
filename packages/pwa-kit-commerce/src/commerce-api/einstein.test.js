/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import fetch from 'cross-fetch'
import EinsteinAPI from './einstein'
import {
    mockAddToCartProduct,
    mockGetZoneRecommendationsResponse,
    mockProduct,
    mockRecommendationsResponse,
    mockRecommenderDetails
} from './mocks/einstein-mock-data'

jest.mock('cross-fetch', () => {
    return {
        __esModule: true,
        default: jest.fn(() => ({json: jest.fn()}))
    }
})

const getProductsSpy = jest.fn()
const config = {
    _config: {
        einsteinConfig: {
            proxyPath: `/test-path`,
            einsteinId: 'test-id',
            siteId: 'test-site-id'
        }
    },
    auth: {usid: 'test-usid'},
    shopperProducts: {
        getProducts: getProductsSpy
    }
}

const einsteinApi = new EinsteinAPI(config)

beforeEach(() => {
    jest.resetModules()
    fetch.mockClear()
})

describe('EinsteinAPI', () => {
    test('viewProduct sends expected api request', async () => {
        await einsteinApi.sendViewProduct(mockProduct)
        expect(fetch).toHaveBeenCalledWith(
            'http://localhost/test-path/v3/activities/test-site-id/viewProduct',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-cq-client-id': 'test-id'
                },
                body:
                    '{"product":{"id":"56736828M","sku":"","altId":"","altIdType":""},"cookieId":"test-usid"}'
            }
        )
    })

    test('addToCart sends expected api request', async () => {
        await einsteinApi.sendAddToCart(mockAddToCartProduct)
        expect(fetch).toHaveBeenCalledWith(
            'http://localhost/test-path/v3/activities/test-site-id/addToCart',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-cq-client-id': 'test-id'
                },
                body:
                    '{"products":[{"id":"883360544021M","sku":"","price":155,"quantity":1}],"cookieId":"test-usid"}'
            }
        )
    })

    test('clickRecommendation sends expected api request', async () => {
        await einsteinApi.sendClickReco(mockRecommenderDetails, mockProduct)
        expect(fetch).toHaveBeenCalledWith(
            'http://localhost/test-path/v3/activities/test-site-id/clickReco',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-cq-client-id': 'test-id'
                },
                body:
                    '{"recommenderName":"testRecommender","__recoUUID":"883360544021M","product":{"id":"56736828M","sku":"","altId":"","altIdType":""},"cookieId":"test-usid"}'
            }
        )
    })

    test('viewRecommendation sends expected api request', async () => {
        await einsteinApi.sendViewReco(mockRecommenderDetails, {id: 'test-reco'})
        expect(fetch).toHaveBeenCalledWith(
            'http://localhost/test-path/v3/activities/test-site-id/viewReco',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-cq-client-id': 'test-id'
                },
                body:
                    '{"recommenderName":"testRecommender","__recoUUID":"883360544021M","products":{"id":"test-reco"},"cookieId":"test-usid"}'
            }
        )
    })

    test('getZoneRecommendations fetches recs and product detail and returns merged results', async () => {
        fetch.mockImplementationOnce(() => {
            return {
                json: async () => {
                    return mockGetZoneRecommendationsResponse
                }
            }
        })

        getProductsSpy.mockImplementationOnce(() => ({
            data: [
                {
                    id: 'prod_123',
                    price: 5.99
                }
            ]
        }))

        const res = await einsteinApi.getZoneRecommendations('mockZoneName')

        expect(fetch).toHaveBeenCalledWith(
            'http://localhost/test-path/v3/personalization/test-site-id/zones/mockZoneName/recs',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-cq-client-id': 'test-id'
                },
                body: '{"cookieId":"test-usid"}'
            }
        )

        expect(res).toEqual({
            displayMessage: 'Recently Viewed',
            recommenderName: 'recently-viewed-products',
            recoUUID: '05e0bd80-64eb-4149-ad5a-dfe1996f8f57',
            recs: [
                {
                    id: 'prod_123',
                    productName: 'Product ABC',
                    productUrl: 'prod_abc.test.com',
                    imageUrl: 'prod_abc.test.com',
                    price: 5.99,
                    productId: 'prod_123',
                    image: {
                        disBaseLink: 'prod_abc.test.com',
                        alt: 'Product ABC'
                    }
                }
            ]
        })
    })

    test('getRecommendations fetches recs and product detail and returns merged results', async () => {
        fetch.mockImplementationOnce(() => {
            return {
                json: async () => {
                    return mockRecommendationsResponse
                }
            }
        })

        getProductsSpy.mockImplementationOnce(() => ({
            data: [
                {
                    id: 'prod_123',
                    price: 5.99
                }
            ]
        }))

        const res = await einsteinApi.getRecommendations('testRecommenderName')

        expect(fetch).toHaveBeenCalledWith(
            'http://localhost/test-path/v3/personalization/recs/test-site-id/testRecommenderName',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-cq-client-id': 'test-id'
                },
                body: '{"cookieId":"test-usid"}'
            }
        )

        expect(res).toEqual({
            recommenderName: 'testRecommenderName',
            recoUUID: '05e0bd80-64eb-4149-ad5a-dfe1996f8f57',
            recs: [
                {
                    id: 'prod_123',
                    productName: 'Product ABC',
                    productUrl: 'prod_abc.test.com',
                    imageUrl: 'prod_abc.test.com',
                    price: 5.99,
                    productId: 'prod_123',
                    image: {
                        disBaseLink: 'prod_abc.test.com',
                        alt: 'Product ABC'
                    }
                }
            ]
        })
    })

    test('getRecommenders send expected api request', async () => {
        await einsteinApi.getRecommenders()

        expect(fetch).toHaveBeenCalledWith(
            'http://localhost/test-path/v3/personalization/recommenders/test-site-id',
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'x-cq-client-id': 'test-id'
                }
            }
        )
    })
})
