/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
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
