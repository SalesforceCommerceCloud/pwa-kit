import {einsteinAPIConfig} from '../einstein-api.config'
import EinsteinAPI from './index'
import {
    mockAddToCartProduct,
    mockGetZoneRecommendationsResponse,
    mockProduct,
    mockRecommendationsResponse,
    mockRecommenderDetails,
    mockRecommendersResponse
} from './mock-data'

const einsteinApiConfig = {...einsteinAPIConfig, proxy: undefined}
const usid = 'defbae50-1b96-438c-a044-6f6dbc0eaeb5'
const einsteinApi = new EinsteinAPI(einsteinApiConfig, usid)

beforeEach(() => {
    jest.resetModules()
})

describe('test Einstein Api class', () => {
    test('viewProduct call returns an object with resquetId and uuid', async () => {
        global.fetch = jest.fn().mockImplementation(() => {
            return {
                status: 200,
                json: async () => {
                    return {
                        uuid: '923fc6a0-b290-11eb-9abf-3126730c6f3f',
                        requestId: 'f1b23514-babc-4b9e-9901-7695b2e082ce'
                    }
                }
            }
        })

        const viewProductResponse = await einsteinApi.sendViewProduct(mockProduct)
        expect(viewProductResponse).toBeDefined()
        expect(viewProductResponse.uuid).toBeDefined()
        expect(viewProductResponse.requestId).toBeDefined()
    })

    test('getZoneRecommendations call returns an object with recommendations in camelCase', async () => {
        global.fetch = jest.fn().mockImplementation(() => {
            return {
                status: 200,
                json: async () => {
                    return mockGetZoneRecommendationsResponse
                }
            }
        })

        const getZoneRecommendationsResponse = await einsteinApi.getZoneRecommendations(
            'mockZoneName'
        )
        expect(getZoneRecommendationsResponse).toBeDefined()
        expect(getZoneRecommendationsResponse.recs[0].productName).toBeDefined()
        expect(getZoneRecommendationsResponse.recs[0].imageUrl).toBeDefined()
    })

    test('addToCart call returns an object with resquetId and uuid', async () => {
        global.fetch = jest.fn().mockImplementation(() => {
            return {
                status: 200,
                json: async () => {
                    return {
                        uuid: '923fc6a0-b290-11eb-9abf-3126730c6f3f',
                        requestId: 'f1b23514-babc-4b9e-9901-7695b2e082ce'
                    }
                }
            }
        })

        const addToCartResponse = await einsteinApi.sendAddToCart(mockAddToCartProduct)
        expect(addToCartResponse).toBeDefined()
        expect(addToCartResponse.uuid).toBeDefined()
        expect(addToCartResponse.requestId).toBeDefined()
    })

    test('clickRecommendation call returns an object with resquetId and uuid', async () => {
        global.fetch = jest.fn().mockImplementation(() => {
            return {
                status: 200,
                json: async () => {
                    return {
                        uuid: '923fc6a0-b290-11eb-9abf-3126730c6f3f',
                        requestId: 'f1b23514-babc-4b9e-9901-7695b2e082ce'
                    }
                }
            }
        })

        const clickRecommendationResponse = await einsteinApi.sendClickReco(
            mockRecommenderDetails,
            mockProduct
        )
        expect(clickRecommendationResponse).toBeDefined()
        expect(clickRecommendationResponse.uuid).toBeDefined()
        expect(clickRecommendationResponse.requestId).toBeDefined()
    })

    test('getRecommendations call returns an object with array of rec in camel case', async () => {
        global.fetch = jest.fn().mockImplementation(() => {
            return {
                status: 200,
                json: async () => {
                    return mockRecommendationsResponse
                }
            }
        })

        const getRecommendationsResponse = await einsteinApi.getRecommendations(
            'testRecommenderName'
        )
        expect(getRecommendationsResponse).toBeDefined()
        expect(getRecommendationsResponse.recs).toBeDefined()
        expect(getRecommendationsResponse.recs[0].productName).toBeDefined()
    })

    test('getRecommenders call returns an object with an array of recommenders', async () => {
        global.fetch = jest.fn().mockImplementation(() => {
            return {
                status: 200,
                json: async () => {
                    return mockRecommendersResponse
                }
            }
        })

        const getRecommendersResponse = await einsteinApi.getRecommenders()
        expect(getRecommendersResponse).toBeDefined()
        expect(getRecommendersResponse.recommenders).toBeDefined()
        expect(getRecommendersResponse.recommenders[0].description).toBeDefined()
    })

    test('viewRecommendation call returns an object with resquetId and uuid', async () => {
        global.fetch = jest.fn().mockImplementation(() => {
            return {
                status: 200,
                json: async () => {
                    return {
                        uuid: '923fc6a0-b290-11eb-9abf-3126730c6f3f',
                        requestId: 'f1b23514-babc-4b9e-9901-7695b2e082ce'
                    }
                }
            }
        })

        const viewRecommendationResponse = await einsteinApi.sendViewReco(
            mockRecommenderDetails,
            mockProduct
        )
        expect(viewRecommendationResponse).toBeDefined()
        expect(viewRecommendationResponse.uuid).toBeDefined()
        expect(viewRecommendationResponse.requestId).toBeDefined()
    })
})
