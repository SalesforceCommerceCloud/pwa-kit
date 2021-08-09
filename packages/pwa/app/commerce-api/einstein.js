/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * *
 * Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. *
 * * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
import fetch from 'cross-fetch'
import {getAppOrigin} from 'pwa-kit-react-sdk/dist/utils/url'
import {keysToCamel} from './utils'

class EinsteinAPI {
    constructor(commerceAPI) {
        this.commerceAPI = commerceAPI
        this.config = commerceAPI?._config?.einsteinConfig
    }

    async einsteinFetch(endpoint, method, body) {
        const config = this.config
        const {proxyPath, einsteinId} = config
        const host = `${getAppOrigin()}${proxyPath}`

        const headers = {
            'Content-Type': 'application/json',
            'x-cq-client-id': einsteinId
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
     * https://developer.commercecloud.com/s/api-details/a003k00000UI4hPAAT/commerce-cloud-developer-centereinsteinrecommendations?tabset-888ee=2
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
            userId: this.commerceAPI.auth.encUserId
                ? this.commerceAPI.auth.encUserId
                : this.commerceAPI.auth.usid,
            cookieId: this.commerceAPI.auth.encUserId ? this.commerceAPI.auth.usid : '',
            ...args
        }

        return this.einsteinFetch(endpoint, method, body)
    }

    /**
     * Tells the Einstein engine when a user views a set of recommendations
     * https://developer.commercecloud.com/s/api-details/a003k00000UI4hPAAT/commerce-cloud-developer-centereinsteinrecommendations?tabset-888ee=2
     **/
    async sendViewReco(recommenderDetails, products, args) {
        const endpoint = `/activities/${this.config.siteId}/viewReco`
        const method = 'POST'
        const {__recoUUID, recommenderName} = recommenderDetails
        const body = {
            recommenderName,
            __recoUUID,
            products: products,
            userId: this.commerceAPI.auth.encUserId
                ? this.commerceAPI.auth.encUserId
                : this.commerceAPI.auth.usid,
            cookieId: this.commerceAPI.auth.encUserId ? this.commerceAPI.auth.usid : '',
            ...args
        }

        return this.einsteinFetch(endpoint, method, body)
    }

    /**
     * Tells the Einstein engine when a user clicks on a recommendation
     * https://developer.commercecloud.com/s/api-details/a003k00000UI4hPAAT/commerce-cloud-developer-centereinsteinrecommendations?tabset-888ee=2
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
            userId: this.commerceAPI.auth.encUserId
                ? this.commerceAPI.auth.encUserId
                : this.commerceAPI.auth.usid,
            cookieId: this.commerceAPI.auth.encUserId ? this.commerceAPI.auth.usid : '',
            ...args
        }

        return this.einsteinFetch(endpoint, method, body)
    }

    /**
     * Tells the Einstein engine when a user adds an item to their cart.
     * https://developer.commercecloud.com/s/api-details/a003k00000UI4hPAAT/commerce-cloud-developer-centereinsteinrecommendations?tabset-888ee=2
     **/
    async sendAddToCart(product, args) {
        const endpoint = `/activities/${this.config.siteId}/addToCart`
        const method = 'POST'
        const body = {
            products: [product],
            userId: this.commerceAPI.auth.encUserId
                ? this.commerceAPI.auth.encUserId
                : this.commerceAPI.auth.usid,
            cookieId: this.commerceAPI.auth.encUserId ? this.commerceAPI.auth.usid : '',
            ...args
        }

        return this.einsteinFetch(endpoint, method, body)
    }

    /**
     * Get a list of recommenders that can be used in recommendation requests.
     * https://developer.commercecloud.com/s/api-details/a003k00000UI4hPAAT/commerce-cloud-developer-centereinsteinrecommendations?tabset-888ee=2
     **/
    async getRecommenders() {
        const endpoint = `/personalization/recommenders/${this.config.siteId}`
        const method = 'GET'
        const body = null

        return this.einsteinFetch(endpoint, method, body)
    }

    /**
     * Get a set of recommendations
     * https://developer.commercecloud.com/s/api-details/a003k00000UI4hPAAT/commerce-cloud-developer-centereinsteinrecommendations?tabset-888ee=2
     **/
    async getRecommendations(recommenderName, args) {
        const endpoint = `/personalization/recs/${this.config.siteId}/${recommenderName}`
        const method = 'POST'
        const body = {
            userId: this.commerceAPI.auth.encUserId
                ? this.commerceAPI.auth.encUserId
                : this.commerceAPI.auth.usid,
            cookieId: this.commerceAPI.auth.encUserId ? this.commerceAPI.auth.usid : '',
            ...args
        }

        // Fetch the recommendations
        const reco = await this.einsteinFetch(endpoint, method, body)

        reco.recommenderName = recommenderName

        return this.fetchRecProductDetails(reco)
    }

    /**
     * Get a set of recommendations for a zone
     * https://developer.commercecloud.com/s/api-details/a003k00000UI4hPAAT/commerce-cloud-developer-centereinsteinrecommendations?tabset-888ee=2
     **/
    async getZoneRecommendations(zoneName, args) {
        const endpoint = `/personalization/${this.config.siteId}/zones/${zoneName}/recs`
        const method = 'POST'
        const body = {
            userId: this.commerceAPI.auth.encUserId
                ? this.commerceAPI.auth.encUserId
                : this.commerceAPI.auth.usid,
            cookieId: this.commerceAPI.auth.encUserId ? this.commerceAPI.auth.usid : '',
            ...args
        }

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
                    const product = products?.data.find((product) => product.id === rec.id)
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
