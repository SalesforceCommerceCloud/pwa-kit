/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useMemo, useState} from 'react'
import fetch from 'cross-fetch'
import {getConfig} from 'pwa-kit-runtime/utils/ssr-config'
import { useCommerceApi, useUsid, useEncUserId } from 'commerce-sdk-react-preview'
import { keysToCamel } from '../utils/utils'

export class EinsteinAPI {
    constructor({host, einsteinId, userId, cookieId, siteId, isProduction}) {
        this.userId = userId
        this.cookieId = cookieId
        this.siteId = siteId
        this.isProduction = isProduction
        this.host = host
        this.einsteinId = einsteinId
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
        if (this.userId) {
            body.userId = this.userId
        }

        // Append the `usid` as the `cookieId` value if present. (It should always be present as long
        // as the user is initilized)
        if (this.cookieId) {
            body.cookieId = this.cookieId
        } else {
            console.warn('Missing `cookieId`. For optimal results this value must be defined.')
        }

        // The first part of the siteId is the realm
        if (this.siteId) {
            body.realm = this.siteId.split('-')[0]
        }

        if (this.isProduction) {
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
            (product.productType.master ||
                product.productType.variant ||
                product.productType.set ||
                product.productType.bundle ||
                product.productType.variationGroup ||
                product.productType.item)
        ) {
            // handle variants & sets for PLP / viewCategory & viewSearch
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
        const headers = {
            'Content-Type': 'application/json',
            'x-cq-client-id': this.einsteinId
        }

        // Include `userId` and `cookieId` parameters.
        if (body) {
            body = this._buildBody(body)
        }

        let response
        try {
            response = await fetch(`${this.host}/v3${endpoint}`, {
                method: method,
                headers: headers,
                ...(body && {
                    body: JSON.stringify(body)
                })
            })
        } catch {
            console.warn('Einstein request failed')
        }

        if (!response?.ok) {
            return {}
        }

        const responseJson = await response.json()

        return keysToCamel(responseJson)
    }

    /**
     * Tells the Einstein engine when a user views a product.
     * https://developer.salesforce.com/docs/commerce/einstein-api/references#einstein-recommendations:Summary
     **/
    async sendViewProduct(product, args) {
        const endpoint = `/activities/${this.siteId}/viewProduct`
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
        const endpoint = `/activities/${this.siteId}/viewSearch`
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
        const endpoint = `/activities/${this.siteId}/clickSearch`
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
        const endpoint = `/activities/${this.siteId}/viewCategory`
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
        const endpoint = `/activities/${this.siteId}/clickCategory`
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
        const endpoint = `/activities/${this.siteId}/viewReco`
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
        const endpoint = `/activities/${this.siteId}/clickReco`
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
        const endpoint = `/activities/${this.siteId}/viewPage`
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
        const endpoint = `/activities/${this.siteId}/beginCheckout`
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
        const endpoint = `/activities/${this.siteId}/checkoutStep`
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
        const endpoint = `/activities/${this.siteId}/addToCart`
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
        const endpoint = `/personalization/recommenders/${this.siteId}`
        const method = 'GET'
        const body = null

        return this.einsteinFetch(endpoint, method, body)
    }

    /**
     * Get a set of recommendations
     * https://developer.salesforce.com/docs/commerce/einstein-api/references#einstein-recommendations:Summary
     **/
    async getRecommendations(recommenderName, products, args) {
        const endpoint = `/personalization/recs/${this.siteId}/${recommenderName}`
        const method = 'POST'
        const body = {
            products: products?.map((product) => this._constructEinsteinProduct(product)),
            ...args
        }

        return this.einsteinFetch(endpoint, method, body)
    }

    /**
     * Get a set of recommendations for a zone
     * https://developer.salesforce.com/docs/commerce/einstein-api/references#einstein-recommendations:Summary
     **/
    async getZoneRecommendations(zoneName, products, args) {
        const endpoint = `/personalization/${this.siteId}/zones/${zoneName}/recs`
        const method = 'POST'

        const body = {
            products: products?.map((product) => this._constructEinsteinProduct(product)),
            ...args
        }

        return this.einsteinFetch(endpoint, method, body)
    }
}

const useEinstein = () => {
    const api = useCommerceApi()
    const {app: {einsteinAPI: config}} = getConfig()
    const {host, einsteinId, siteId, isProduction} = config
    const usid = useUsid()
    const encUserId = useEncUserId()

    const einstein = useMemo(() => new EinsteinAPI({
        host,
        einsteinId,
        userId: encUserId,
        cookieId: usid,
        siteId,
        isProduction
    }), [host,
        einsteinId,
        encUserId,
        usid,
        siteId,
        isProduction])
    const [state, setState] = useState({loading: false, recommendations: []})

    const fetchRecProductDetails = async (reco) => {
        const ids = reco.recs?.map((rec) => rec.id)
        if (ids?.length > 0) {
            // Fetch the product details for the recommendations
            const products = await this.api.shopperProducts.getProducts({
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

    return {
        ...state,

        async sendViewProduct(...args) {
            return einstein.sendViewProduct(...args)
        },
        async sendViewSearch(...args) {
            return einstein.sendViewSearch(...args)
        },
        async sendClickSearch(...args) {
            return einstein.sendClickSearch(...args)
        },
        async sendViewCategory(...args) {
            return einstein.sendViewCategory(...args)
        },
        async sendClickCategory(...args) {
            return einstein.sendClickCategory(...args)
        },
        async sendViewPage(...args) {
            return einstein.sendViewPage(...args)
        },
        async sendBeginCheckout(...args) {
            return einstein.sendBeginCheckout(...args)
        },
        async sendCheckoutStep(...args) {
            return einstein.sendCheckoutStep(...args)
        },
        async sendViewReco(...args) {
            return einstein.sendViewReco(...args)
        },
        async sendClickReco(...args) {
            return einstein.sendClickReco(...args)
        },
        async sendAddToCart(...args) {
            return einstein.sendAddToCart(...args)
        },
        async getRecommenders(...args) {
            return einstein.getRecommenders(...args)
        },
        async getRecommendations(...args) {
            setState((s) => ({...s, loading: true}))
            const reco = await api.einstein.getRecommendations(...args)
            reco.recommenderName = recommenderName
            const recommendations = await fetchRecProductDetails(reco)
            setState({loading: false, recommendations})
        },
        async getZoneRecommendations(...args) {
            setState((s) => ({...s, loading: true}))
            const reco = await api.einstein.getZoneRecommendations(...args)
            const recommendations = await fetchRecProductDetails(reco)
            setState({loading: false, recommendations})
        }
    }
}

export default useEinstein
