/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useMemo, useState} from 'react'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import {
    useCommerceApi,
    useAccessToken,
    useUsid,
    useEncUserId,
    useCustomerType
} from '@salesforce/commerce-sdk-react'
import {keysToCamel} from '@salesforce/retail-react-app/app/utils/utils'

export class EinsteinAPI {
    constructor({host, einsteinId, siteId, isProduction}) {
        this.siteId = siteId
        this.isProduction = isProduction
        this.host = host
        this.einsteinId = einsteinId
    }

    /**
     * Given a POJO append the correct site and environment values
     *
     * @param {object} params
     * @returns {object} The decorated body object.
     */
    _buildBody(params) {
        const instanceType_prd = 'prd'
        const instanceType_sbx = 'sbx'

        const body = {...params}

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
    async sendAddToCart(items, args) {
        const endpoint = `/activities/${this.siteId}/addToCart`
        const method = 'POST'
        const body = {
            products: items.map((item) => this._constructEinsteinItem(item)),
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
    const {getTokenWhenReady} = useAccessToken()
    const {
        app: {einsteinAPI: config}
    } = getConfig()
    const {host, einsteinId, siteId, isProduction} = config

    const {getUsidWhenReady} = useUsid()
    const {getEncUserIdWhenReady} = useEncUserId()
    const {isRegistered} = useCustomerType()

    const einstein = useMemo(
        () =>
            new EinsteinAPI({
                host,
                einsteinId,
                siteId,
                isProduction
            }),
        [host, einsteinId, siteId, isProduction]
    )
    const [isLoading, setIsLoading] = useState(false)
    const [recommendations, setRecommendations] = useState([])

    const fetchRecProductDetails = async (reco) => {
        const ids = reco.recs?.map((rec) => rec.id)
        if (ids?.length > 0) {
            const token = await getTokenWhenReady()
            // Fetch the product details for the recommendations
            const products = await api.shopperProducts.getProducts({
                parameters: {ids: ids.join(',')},
                headers: {
                    Authorization: `Bearer ${token}`
                }
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

    const getEventUserParameters = async () => {
        return {
            cookieId: await getUsidWhenReady(),
            userId: isRegistered ? await getEncUserIdWhenReady() : undefined
        }
    }

    return {
        isLoading,

        recommendations,

        async sendViewProduct(...args) {
            const userParameters = await getEventUserParameters()
            return einstein.sendViewProduct(...args.concat(userParameters))
        },
        async sendViewSearch(...args) {
            const userParameters = await getEventUserParameters()
            return einstein.sendViewSearch(...args.concat(userParameters))
        },
        async sendClickSearch(...args) {
            const userParameters = await getEventUserParameters()
            return einstein.sendClickSearch(...args.concat(userParameters))
        },
        async sendViewCategory(...args) {
            const userParameters = await getEventUserParameters()
            return einstein.sendViewCategory(...args.concat(userParameters))
        },
        async sendClickCategory(...args) {
            const userParameters = await getEventUserParameters()
            return einstein.sendClickCategory(...args.concat(userParameters))
        },
        async sendViewPage(...args) {
            const userParameters = await getEventUserParameters()
            return einstein.sendViewPage(...args.concat(userParameters))
        },
        async sendBeginCheckout(...args) {
            const userParameters = await getEventUserParameters()
            return einstein.sendBeginCheckout(...args.concat(userParameters))
        },
        async sendCheckoutStep(...args) {
            const userParameters = await getEventUserParameters()
            return einstein.sendCheckoutStep(...args.concat(userParameters))
        },
        async sendViewReco(...args) {
            const userParameters = await getEventUserParameters()
            return einstein.sendViewReco(...args.concat(userParameters))
        },
        async sendClickReco(...args) {
            const userParameters = await getEventUserParameters()
            return einstein.sendClickReco(...args.concat(userParameters))
        },
        async sendAddToCart(...args) {
            const userParameters = await getEventUserParameters()
            return einstein.sendAddToCart(...args.concat(userParameters))
        },
        async getRecommenders(...args) {
            return einstein.getRecommenders(...args)
        },
        async getRecommendations(recommenderName, products, ...args) {
            setIsLoading(true)
            try {
                const userParameters = await getEventUserParameters()
                const reco = await einstein.getRecommendations(
                    recommenderName,
                    products,
                    ...args.concat(userParameters)
                )
                reco.recommenderName = recommenderName
                const recommendations = await fetchRecProductDetails(reco)
                setRecommendations(recommendations)
            } catch (err) {
                console.error(err)
            } finally {
                setIsLoading(false)
            }
        },
        async getZoneRecommendations(zoneName, products, ...args) {
            setIsLoading(true)
            try {
                const userParameters = await getEventUserParameters()
                const reco = await einstein.getZoneRecommendations(
                    zoneName,
                    products,
                    ...args.concat(userParameters)
                )
                const recommendations = await fetchRecProductDetails(reco)
                setRecommendations(recommendations)
            } catch (err) {
                console.error(err)
            } finally {
                setIsLoading(false)
            }
        }
    }
}

export default useEinstein
