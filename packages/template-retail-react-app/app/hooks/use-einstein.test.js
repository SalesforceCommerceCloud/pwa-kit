/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {EinsteinAPI} from '@salesforce/retail-react-app/app/hooks/use-einstein'
import {
    mockAddToCartProduct,
    mockProduct,
    mockCategory,
    mockSearchResults,
    mockBasket,
    mockRecommenderDetails
} from '@salesforce/retail-react-app/app/hooks/einstein-mock-data'
import fetchMock from 'jest-fetch-mock'

const einsteinApi = new EinsteinAPI({
    host: `http://localhost/test-path`,
    einsteinId: 'test-id',
    siteId: 'test-site-id'
})

const fetchOriginal = global.fetch

beforeAll(() => {
    global.fetch = fetchMock
    global.fetch.mockResponse(JSON.stringify({}))
})

afterAll(() => {
    global.fetch = fetchOriginal
})

describe('EinsteinAPI', () => {
    test('viewProduct sends expected api request', async () => {
        await einsteinApi.sendViewProduct(mockProduct, {cookieId: 'test-usid'})

        expect(fetch).toHaveBeenCalledWith(
            'http://localhost/test-path/v3/activities/test-site-id/viewProduct',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-cq-client-id': 'test-id'
                },
                body: '{"product":{"id":"56736828M","sku":"56736828M","altId":"","altIdType":""},"cookieId":"test-usid","realm":"test","instanceType":"sbx"}'
            }
        )
    })

    test('viewSearch sends expected api request', async () => {
        const searchTerm = 'tie'
        await einsteinApi.sendViewSearch(searchTerm, mockSearchResults, {cookieId: 'test-usid'})
        expect(fetch).toHaveBeenCalledWith(
            'http://localhost/test-path/v3/activities/test-site-id/viewSearch',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-cq-client-id': 'test-id'
                },
                body: '{"searchText":"tie","products":[{"id":"25752986M","sku":"25752986M","altId":"","altIdType":""},{"id":"25752235M","sku":"25752235M","altId":"","altIdType":""},{"id":"25752218M","sku":"25752218M","altId":"","altIdType":""},{"id":"25752981M","sku":"25752981M","altId":"","altIdType":""}],"showProducts":true,"cookieId":"test-usid","realm":"test","instanceType":"sbx"}'
            }
        )
    })

    test('viewCategory sends expected api request', async () => {
        await einsteinApi.sendViewCategory(mockCategory, mockSearchResults, {cookieId: 'test-usid'})
        expect(fetch).toHaveBeenCalledWith(
            'http://localhost/test-path/v3/activities/test-site-id/viewCategory',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-cq-client-id': 'test-id'
                },
                body: '{"category":{"id":"mens-accessories-ties"},"products":[{"id":"25752986M","sku":"25752986M","altId":"","altIdType":""},{"id":"25752235M","sku":"25752235M","altId":"","altIdType":""},{"id":"25752218M","sku":"25752218M","altId":"","altIdType":""},{"id":"25752981M","sku":"25752981M","altId":"","altIdType":""}],"showProducts":true,"cookieId":"test-usid","realm":"test","instanceType":"sbx"}'
            }
        )
    })

    test('clickSearch sends expected api request', async () => {
        const searchTerm = 'tie'
        const clickedProduct = mockSearchResults.hits[0]
        await einsteinApi.sendClickSearch(searchTerm, clickedProduct, {cookieId: 'test-usid'})
        expect(fetch).toHaveBeenCalledWith(
            'http://localhost/test-path/v3/activities/test-site-id/clickSearch',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-cq-client-id': 'test-id'
                },
                body: '{"searchText":"tie","product":{"id":"25752986M","sku":"25752986M","altId":"","altIdType":""},"cookieId":"test-usid","realm":"test","instanceType":"sbx"}'
            }
        )
    })

    test('clickCategory sends expected api request', async () => {
        const clickedProduct = mockSearchResults.hits[0]
        await einsteinApi.sendClickCategory(mockCategory, clickedProduct, {cookieId: 'test-usid'})
        expect(fetch).toHaveBeenCalledWith(
            'http://localhost/test-path/v3/activities/test-site-id/clickCategory',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-cq-client-id': 'test-id'
                },
                body: '{"category":{"id":"mens-accessories-ties"},"product":{"id":"25752986M","sku":"25752986M","altId":"","altIdType":""},"cookieId":"test-usid","realm":"test","instanceType":"sbx"}'
            }
        )
    })

    test('viewPage sends expected api request', async () => {
        const path = '/'
        await einsteinApi.sendViewPage(path, {cookieId: 'test-usid'})
        expect(fetch).toHaveBeenCalledWith(
            'http://localhost/test-path/v3/activities/test-site-id/viewPage',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-cq-client-id': 'test-id'
                },
                body: '{"currentLocation":"/","cookieId":"test-usid","realm":"test","instanceType":"sbx"}'
            }
        )
    })

    test('beginCheckout sends expected api request', async () => {
        await einsteinApi.sendBeginCheckout(mockBasket, {cookieId: 'test-usid'})
        expect(fetch).toHaveBeenCalledWith(
            'http://localhost/test-path/v3/activities/test-site-id/beginCheckout',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-cq-client-id': 'test-id'
                },
                body: '{"products":[{"id":"682875719029M","sku":"","price":29.99,"quantity":1}],"amount":29.99,"cookieId":"test-usid","realm":"test","instanceType":"sbx"}'
            }
        )
    })

    test('checkouStep sends expected api request', async () => {
        const checkoutStepName = 'CheckoutStep'
        const checkoutStep = 0
        await einsteinApi.sendCheckoutStep(checkoutStepName, checkoutStep, mockBasket, {
            cookieId: 'test-usid'
        })
        expect(fetch).toHaveBeenCalledWith(
            'http://localhost/test-path/v3/activities/test-site-id/checkoutStep',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-cq-client-id': 'test-id'
                },
                body: '{"stepName":"CheckoutStep","stepNumber":0,"basketId":"f6bbeee30fb93c2f94213f60f8","cookieId":"test-usid","realm":"test","instanceType":"sbx"}'
            }
        )
    })

    test('addToCart sends expected api request', async () => {
        await einsteinApi.sendAddToCart([mockAddToCartProduct], {cookieId: 'test-usid'})
        expect(fetch).toHaveBeenCalledWith(
            'http://localhost/test-path/v3/activities/test-site-id/addToCart',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-cq-client-id': 'test-id'
                },
                body: '{"products":[{"id":"883360544021M","sku":"","price":155,"quantity":1}],"cookieId":"test-usid","realm":"test","instanceType":"sbx"}'
            }
        )
    })

    test('clickRecommendation sends expected api request', async () => {
        await einsteinApi.sendClickReco(mockRecommenderDetails, mockProduct, {
            cookieId: 'test-usid'
        })
        expect(fetch).toHaveBeenCalledWith(
            'http://localhost/test-path/v3/activities/test-site-id/clickReco',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-cq-client-id': 'test-id'
                },
                body: '{"recommenderName":"testRecommender","__recoUUID":"883360544021M","product":{"id":"56736828M","sku":"56736828M","altId":"","altIdType":""},"cookieId":"test-usid","realm":"test","instanceType":"sbx"}'
            }
        )
    })

    test('viewRecommendation sends expected api request', async () => {
        await einsteinApi.sendViewReco(
            mockRecommenderDetails,
            {
                id: 'test-reco'
            },
            {cookieId: 'test-usid'}
        )
        expect(fetch).toHaveBeenCalledWith(
            'http://localhost/test-path/v3/activities/test-site-id/viewReco',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-cq-client-id': 'test-id'
                },
                body: '{"recommenderName":"testRecommender","__recoUUID":"883360544021M","products":{"id":"test-reco"},"cookieId":"test-usid","realm":"test","instanceType":"sbx"}'
            }
        )
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
