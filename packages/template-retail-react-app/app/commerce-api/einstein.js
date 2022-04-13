/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import fetch from 'cross-fetch'
import {getAppOrigin} from 'pwa-kit-react-sdk/utils/url'
import {keysToCamel} from './utils'

class EinsteinAPI {
    constructor(commerceAPI) {
        this.commerceAPI = commerceAPI
        this.config = commerceAPI?._config?.einsteinConfig
    }

    /**
     * Given a POJO append the correct user and cookie identifier values using the current auth state.
     *
     * @param {object} params
     * @returns {object} The decorated body object.
     */
    _buildBody(params) {
        const body = {...params}

        // If we have an encrypted user id (authenticaed users only) use it as the `userId` otherwise
        // we won't send a `userId` param for guest users.
        if (this.commerceAPI.auth.encUserId) {
            body.userId = this.commerceAPI.auth.encUserId
        }

        // Append the `usid` as the `cookieId` value if present. (It should always be present as long
        // as the user is initilized)
        if (this.commerceAPI.auth.usid) {
            body.cookieId = this.commerceAPI.auth.usid
        } else {
            console.warn('Missing `cookieId`. For optimal results this value must be defined.')
        }

        return body
    }

    async einsteinFetch(endpoint, method, body) {
        const config = this.config
        const {proxyPath, einsteinId} = config
        const host = `${getAppOrigin()}${proxyPath}`

        const headers = {
            'Content-Type': 'application/json',
            'x-cq-client-id': einsteinId
        }

        // Include `userId` and `cookieId` parameters.
        if (body) {
            body = this._buildBody(body)
        }

        let response
        response = await fetch(`${host}/v3${endpoint}`, {
            method: method,
            headers: headers,
            ...(body && {
                body: JSON.stringify(body)
            })
        })

        const responseJson = await response.json()

        return keysToCamel(responseJson)
    }

    /**
     * Tells the Einstein engine when a user views a product.
     * https://developer.salesforce.com/docs/commerce/einstein-api/references#einstein-recommendations:Summary
     **/
    async sendViewProduct(product, args) {
        const endpoint = `/activities/${this.config.siteId}/viewProduct`
        const method = 'POST'
        const {id, sku = '', altId = '', altIdType = ''} = product
        const body = {
            product: {
                id,
                sku,
                altId,
                altIdType
            },
            ...args
        }

        return this.einsteinFetch(endpoint, method, body)
    }

    /**
     * Tells the Einstein engine when a user views a set of recommendations
     * https://developer.salesforce.com/docs/commerce/einstein-api/references#einstein-recommendations:Summary
     **/
    async sendViewReco(recommenderDetails, products, args) {
        const endpoint = `/activities/${this.config.siteId}/viewReco`
        const method = 'POST'
        const {__recoUUID, recommenderName} = recommenderDetails
        const body = {
            recommenderName,
            __recoUUID,
            products: products,
            ...args
        }

        return this.einsteinFetch(endpoint, method, body)
    }

    /**
     * Tells the Einstein engine when a user clicks on a recommendation
     * https://developer.salesforce.com/docs/commerce/einstein-api/references#einstein-recommendations:Summary
     **/
    async sendClickReco(recommenderDetails, product, args) {
        const endpoint = `/activities/${this.config.siteId}/clickReco`
        const method = 'POST'
        const {__recoUUID, recommenderName} = recommenderDetails
        const {id, sku = '', altId = '', altIdType = ''} = product
        const body = {
            recommenderName,
            __recoUUID,
            product: {
                id,
                sku,
                altId,
                altIdType
            },
            ...args
        }

        return this.einsteinFetch(endpoint, method, body)
    }

    /**
     * Tells the Einstein engine when a user adds an item to their cart.
     * https://developer.salesforce.com/docs/commerce/einstein-api/references#einstein-recommendations:Summary
     **/
    async sendAddToCart(product, args) {
        const endpoint = `/activities/${this.config.siteId}/addToCart`
        const method = 'POST'
        const body = {
            products: [product],
            ...args
        }

        return this.einsteinFetch(endpoint, method, body)
    }

    /**
     * Get a list of recommenders that can be used in recommendation requests.
     * https://developer.salesforce.com/docs/commerce/einstein-api/references#einstein-recommendations:Summary
     **/
    async getRecommenders() {
        const endpoint = `/personalization/recommenders/${this.config.siteId}`
        const method = 'GET'
        const body = null

        return this.einsteinFetch(endpoint, method, body)
    }

    /**
     * Get a set of recommendations
     * https://developer.salesforce.com/docs/commerce/einstein-api/references#einstein-recommendations:Summary
     **/
    async getRecommendations(recommenderName, args) {
        const endpoint = `/personalization/recs/${this.config.siteId}/${recommenderName}`
        const method = 'POST'
        const body = {...args}

        // Fetch the recommendations
        const reco = await this.einsteinFetch(endpoint, method, body)

        reco.recommenderName = recommenderName

        return this.fetchRecProductDetails(reco)
    }

    /**
     * Get a set of recommendations for a zone
     * https://developer.salesforce.com/docs/commerce/einstein-api/references#einstein-recommendations:Summary
     **/
    async getZoneRecommendations(zoneName, args) {
        const endpoint = `/personalization/${this.config.siteId}/zones/${zoneName}/recs`
        const method = 'POST'
        const body = {...args}

        // Fetch the recommendations
        const reco = await this.einsteinFetch(endpoint, method, body)

        return this.fetchRecProductDetails(reco)
    }

    async fetchRecProductDetails(reco) {
        const ids = reco.recs?.map((rec) => rec.id)
        if (ids?.length > 0) {
            // Fetch the product details for the recommendations
            const products = await this.commerceAPI.shopperProducts.getProducts({
                parameters: {ids: ids.join(',')}
            })

            // Merge the product detail into the recommendations response
            return {
                ...reco,
                recs: reco.recs.map((rec) => {
                    const product = products?.data?.find((product) => product.id === rec.id)
                    return {
                        ...rec,
                        ...product,
                        productId: rec.id,
                        image: {disBaseLink: rec.imageUrl, alt: rec.productName}
                    }
                })
            }
        }
        return reco
    }
}

export default EinsteinAPI
