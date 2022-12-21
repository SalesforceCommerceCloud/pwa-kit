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
    mockCategory,
    mockSearchResults,
    mockBasket,
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
            host: `http://localhost/test-path`,
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
                    '{"product":{"id":"56736828M","sku":"56736828M","altId":"","altIdType":""},"cookieId":"test-usid","realm":"test","instanceType":"sbx"}'
            }
        )
    })

    test('viewSearch sends expected api request', async () => {
        const searchTerm = 'tie'
        await einsteinApi.sendViewSearch(searchTerm, mockSearchResults)
        expect(fetch).toHaveBeenCalledWith(
            'http://localhost/test-path/v3/activities/test-site-id/viewSearch',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-cq-client-id': 'test-id'
                },
                body:
                    '{"searchText":"tie","products":[{"id":"25752986M","sku":"25752986M","altId":"","altIdType":""},{"id":"25752235M","sku":"25752235M","altId":"","altIdType":""},{"id":"25752218M","sku":"25752218M","altId":"","altIdType":""},{"id":"25752981M","sku":"25752981M","altId":"","altIdType":""}],"showProducts":true,"cookieId":"test-usid","realm":"test","instanceType":"sbx"}'
            }
        )
    })

    test('viewCategory sends expected api request', async () => {
        await einsteinApi.sendViewCategory(mockCategory, mockSearchResults)
        expect(fetch).toHaveBeenCalledWith(
            'http://localhost/test-path/v3/activities/test-site-id/viewCategory',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-cq-client-id': 'test-id'
                },
                body:
                    '{"category":{"id":"mens-accessories-ties"},"products":[{"id":"25752986M","sku":"25752986M","altId":"","altIdType":""},{"id":"25752235M","sku":"25752235M","altId":"","altIdType":""},{"id":"25752218M","sku":"25752218M","altId":"","altIdType":""},{"id":"25752981M","sku":"25752981M","altId":"","altIdType":""}],"showProducts":true,"cookieId":"test-usid","realm":"test","instanceType":"sbx"}'
            }
        )
    })

    test('clickSearch sends expected api request', async () => {
        const searchTerm = 'tie'
        const clickedProduct = mockSearchResults.hits[0]
        await einsteinApi.sendClickSearch(searchTerm, clickedProduct)
        expect(fetch).toHaveBeenCalledWith(
            'http://localhost/test-path/v3/activities/test-site-id/clickSearch',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-cq-client-id': 'test-id'
                },
                body:
                    '{"searchText":"tie","product":{"id":"25752986M","sku":"25752986M","altId":"","altIdType":""},"cookieId":"test-usid","realm":"test","instanceType":"sbx"}'
            }
        )
    })

    test('clickCategory sends expected api request', async () => {
        const clickedProduct = mockSearchResults.hits[0]
        await einsteinApi.sendClickCategory(mockCategory, clickedProduct)
        expect(fetch).toHaveBeenCalledWith(
            'http://localhost/test-path/v3/activities/test-site-id/clickCategory',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-cq-client-id': 'test-id'
                },
                body:
                    '{"category":{"id":"mens-accessories-ties"},"product":{"id":"25752986M","sku":"25752986M","altId":"","altIdType":""},"cookieId":"test-usid","realm":"test","instanceType":"sbx"}'
            }
        )
    })

    test('viewPage sends expected api request', async () => {
        const path = '/'
        await einsteinApi.sendViewPage(path)
        expect(fetch).toHaveBeenCalledWith(
            'http://localhost/test-path/v3/activities/test-site-id/viewPage',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-cq-client-id': 'test-id'
                },
                body:
                    '{"currentLocation":"/","cookieId":"test-usid","realm":"test","instanceType":"sbx"}'
            }
        )
    })

    test('beginCheckout sends expected api request', async () => {
        await einsteinApi.sendBeginCheckout(mockBasket)
        expect(fetch).toHaveBeenCalledWith(
            'http://localhost/test-path/v3/activities/test-site-id/beginCheckout',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-cq-client-id': 'test-id'
                },
                body:
                    '{"products":[{"id":"682875719029M","sku":"","price":29.99,"quantity":1}],"amount":29.99,"cookieId":"test-usid","realm":"test","instanceType":"sbx"}'
            }
        )
    })

    test('checkouStep sends expected api request', async () => {
        const checkoutStepName = 'CheckoutStep'
        const checkoutStep = 0
        await einsteinApi.sendCheckoutStep(checkoutStepName, checkoutStep, mockBasket)
        expect(fetch).toHaveBeenCalledWith(
            'http://localhost/test-path/v3/activities/test-site-id/checkoutStep',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-cq-client-id': 'test-id'
                },
                body:
                    '{"stepName":"CheckoutStep","stepNumber":0,"basketId":"f6bbeee30fb93c2f94213f60f8","cookieId":"test-usid","realm":"test","instanceType":"sbx"}'
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
                    '{"products":[{"id":"883360544021M","sku":"","price":155,"quantity":1}],"cookieId":"test-usid","realm":"test","instanceType":"sbx"}'
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
                    '{"recommenderName":"testRecommender","__recoUUID":"883360544021M","product":{"id":"56736828M","sku":"56736828M","altId":"","altIdType":""},"cookieId":"test-usid","realm":"test","instanceType":"sbx"}'
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
                    '{"recommenderName":"testRecommender","__recoUUID":"883360544021M","products":{"id":"test-reco"},"cookieId":"test-usid","realm":"test","instanceType":"sbx"}'
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
                body: '{"cookieId":"test-usid","realm":"test","instanceType":"sbx"}'
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
                body: '{"cookieId":"test-usid","realm":"test","instanceType":"sbx"}'
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
