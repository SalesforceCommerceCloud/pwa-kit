/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * *
 * Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. *
 * * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
import {
    mockGetZoneRecommendationsResponse,
    mockRecommendationsResponse,
    mockRecommendersResponse
} from '../mocks/einstein-mock-data'
import {keysToCamel} from '../utils'

class EinsteinAPI {
    constructor(commerceAPI) {
        this.commerceAPI = commerceAPI
        this.config = commerceAPI._config.einsteinConfig
    }

    async sendViewProduct() {
        return {requestId: 'test-req-id', uuid: 'test-uuid'}
    }

    async sendViewReco() {
        return {requestId: 'test-req-id', uuid: 'test-uuid'}
    }

    async sendClickReco() {
        return {requestId: 'test-req-id', uuid: 'test-uuid'}
    }

    async sendAddToCart() {
        return {requestId: 'test-req-id', uuid: 'test-uuid'}
    }

    async getRecommenders() {
        return keysToCamel(mockRecommendersResponse)
    }

    async getRecommendations() {
        return this.fetchRecProductDetails(mockRecommendationsResponse)
    }

    async getZoneRecommendations() {
        return this.fetchRecProductDetails(mockGetZoneRecommendationsResponse)
    }

    async fetchRecProductDetails(reco) {
        return {
            ...reco,
            recs: keysToCamel(reco).recs.map((r) => ({
                ...r,
                productId: r.id,
                image: {disBaseLink: r.imageUrl},
                currency: 'USD',
                price: 5.99
            }))
        }
    }
}

export default EinsteinAPI
