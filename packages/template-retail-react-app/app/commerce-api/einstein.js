/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import fetch from 'cross-fetch'
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
        const instanceType_prd = 'prd'
        const instanceType_sbx = 'sbx'

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

        // The first part of the siteId is the realm
        if (this.config.siteId) {
            body.realm = this.config.siteId.split('-')[0]
        }

        if (this.config.isProduction) {
            body.instanceType = instanceType_prd
        } else {
            body.instanceType = instanceType_sbx
        }

        return body
    }

    /**
     * Given a product or item source, returns the product data that Einstein requires
     */
    _constructEinsteinProduct(product) {
        if (product.type && (product.type.master || product.type.variant)) {
            // handle variants for PDP / viewProduct
            // Assumes product is a Product object from SCAPI Shopper-Products:
            // https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-products?meta=type%3AProduct
            return {
                id: product.master.masterId,
                sku: product.id,
                altId: '',
                altIdType: ''
            }
        } else if (
            product.productType &&
            (product.productType.master || product.productType.variant)
        ) {
            // handle variants for PLP / viewCategory & viewSearch
            // Assumes product is a ProductSearchHit from SCAPI Shopper-Search:
            // https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-search?meta=type%3AProductSearchHit
            return {
                id: product.productId,
                sku: product.productId, //TODO: Should we switch this to product.representedProduct.id once we allow non-master products in search results?
                altId: '',
                altIdType: ''
            }
        } else {
            // handles non-variants
            return {
                id: product.id,
                sku: '',
                altId: '',
                altIdType: ''
            }
        }
    }

    /**
     * Given a cart item, returns the data that Einstein requires
     *
     * Assumes item is a ProductItemfrom SCAPI Shopper-Baskets:
     * https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-baskets?meta=type%3AProductItem
     */
    _constructEinsteinItem(item) {
        return {
            id: item.productId,
            sku: '',
            price: item.price,
            quantity: item.quantity
        }
    }

    async einsteinFetch(endpoint, method, body) {
        const config = this.config
        const {host, einsteinId} = config

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
        const body = {
            product: this._constructEinsteinProduct(product),
            ...args
        }

        return this.einsteinFetch(endpoint, method, body)
    }

    /**
     * Tells the Einstein engine when a user views search results.
     **/
    async sendViewSearch(searchText, searchResults, args) {
        const endpoint = `/activities/${this.config.siteId}/viewSearch`
        const method = 'POST'

        const products = searchResults?.hits?.map((product) =>
            this._constructEinsteinProduct(product)
        )

        const body = {
            searchText,
            products,
            showProducts: true, // Needed by Reports and Dashboards to differentiate searches with results vs no results
            ...args
        }

        return this.einsteinFetch(endpoint, method, body)
    }

    /**
     * Tells the Einstein engine when a user clicks on a search result.
     **/
    async sendClickSearch(searchText, product, args) {
        const endpoint = `/activities/${this.config.siteId}/clickSearch`
        const method = 'POST'
        const body = {
            searchText,
            product: this._constructEinsteinProduct(product),
            ...args
        }

        return this.einsteinFetch(endpoint, method, body)
    }

    /**
     * Tells the Einstein engine when a user views a category.
     **/
    async sendViewCategory(category, searchResults, args) {
        const endpoint = `/activities/${this.config.siteId}/viewCategory`
        const method = 'POST'

        const products = searchResults?.hits?.map((product) =>
            this._constructEinsteinProduct(product)
        )

        const body = {
            category: {
                id: category.id
            },
            products,
            showProducts: true, // Needed by Reports and Dashboards to differentiate searches with results vs no results
            ...args
        }

        return this.einsteinFetch(endpoint, method, body)
    }

    /**
     * Tells the Einstein engine when a user clicks a product from the category page.
     * Not meant to be used when the user clicks a category from the nav bar.
     **/
    async sendClickCategory(category, product, args) {
        const endpoint = `/activities/${this.config.siteId}/clickCategory`
        const method = 'POST'
        const body = {
            category: {
                id: category.id
            },
            product: this._constructEinsteinProduct(product),
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
        const body = {
            recommenderName,
            __recoUUID,
            product: this._constructEinsteinProduct(product),
            ...args
        }

        return this.einsteinFetch(endpoint, method, body)
    }

    /**
     * Tells the Einstein engine when a user views a page.
     * Use this only for pages where another activity does not fit. (ie. on the PDP, use viewProduct rather than this)
     **/
    async sendViewPage(path, args) {
        const endpoint = `/activities/${this.config.siteId}/viewPage`
        const method = 'POST'
        const body = {
            currentLocation: path,
            ...args
        }

        return this.einsteinFetch(endpoint, method, body)
    }

    /**
     * Tells the Einstein engine when a user starts the checkout process.
     **/
    async sendBeginCheckout(basket, args) {
        const endpoint = `/activities/${this.config.siteId}/beginCheckout`
        const method = 'POST'
        const products = basket.productItems.map((item) => this._constructEinsteinItem(item))
        const subTotal = basket.productSubTotal
        const body = {
            products: products,
            amount: subTotal,
            ...args
        }

        return this.einsteinFetch(endpoint, method, body)
    }

    /**
     * Tells the Einstein engine when a user reaches the given step during checkout.
     * https://developer.salesforce.com/docs/commerce/einstein-api/references#einstein-recommendations:Summary
     **/
    async sendCheckoutStep(stepName, stepNumber, basket, args) {
        const endpoint = `/activities/${this.config.siteId}/checkoutStep`
        const method = 'POST'
        const body = {
            stepName,
            stepNumber,
            basketId: basket.basketId,
            ...args
        }

        return this.einsteinFetch(endpoint, method, body)
    }

    /**
     * Tells the Einstein engine when a user adds an item to their cart.
     * https://developer.salesforce.com/docs/commerce/einstein-api/references#einstein-recommendations:Summary
     **/
    async sendAddToCart(item, args) {
        const endpoint = `/activities/${this.config.siteId}/addToCart`
        const method = 'POST'
        const body = {
            products: [this._constructEinsteinItem(item)],
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
    async getRecommendations(recommenderName, products, args) {
        const endpoint = `/personalization/recs/${this.config.siteId}/${recommenderName}`
        const method = 'POST'
        const body = {
            products: products?.map((product) => this._constructEinsteinProduct(product)),
            ...args
        }

        // Fetch the recommendations
        const reco = await this.einsteinFetch(endpoint, method, body)

        reco.recommenderName = recommenderName

        return this.fetchRecProductDetails(reco)
    }

    /**
     * Get a set of recommendations for a zone
     * https://developer.salesforce.com/docs/commerce/einstein-api/references#einstein-recommendations:Summary
     **/
    async getZoneRecommendations(zoneName, products, args) {
        const endpoint = `/personalization/${this.config.siteId}/zones/${zoneName}/recs`
        const method = 'POST'

        const body = {
            products: products?.map((product) => this._constructEinsteinProduct(product)),
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
