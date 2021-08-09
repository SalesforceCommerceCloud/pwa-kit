import {getAppOrigin} from 'pwa-kit-react-sdk/dist/utils/url'
import {keysToCamel} from '../commerce-api/utils'

const createEinsteinFetch = (config) => async (endpoint, method, body) => {
    const {proxyPath, einsteinId} = config
    const host = `${getAppOrigin()}${proxyPath}`

    if (!config.einsteinId.length > 0) {
        return Promise.resolve()
    }

    // Its recommended that this API Key is not exposed but I'm not sure we have an alternative
    // in PWA Kit in much the same as with needeing to use PKCE flow for login
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

class EinsteinAPI {
    constructor(config, usid) {
        this.usid = usid
        this.siteId = config.siteId
        this.einsteinFetch = createEinsteinFetch(config)
    }

    /**
     * Tells the Einstein engine when a user views a product.
     * https://developer.commercecloud.com/s/api-details/a003k00000UI4hPAAT/commerce-cloud-developer-centereinsteinrecommendations?tabset-888ee=2
     **/
    async sendViewProduct(product, args) {
        const endpoint = `/activities/${this.siteId}/viewProduct`
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
     * https://developer.commercecloud.com/s/api-details/a003k00000UI4hPAAT/commerce-cloud-developer-centereinsteinrecommendations?tabset-888ee=2
     **/
    async sendViewReco(recommenderDetails, products, args) {
        const endpoint = `/activities/${this.siteId}/viewReco`
        const method = 'POST'
        const {__recoUUID, recommenderName} = recommenderDetails
        const body = {
            recommenderName,
            __recoUUID,
            products: products,
            userId: this.usid,
            ...args
        }

        return this.einsteinFetch(endpoint, method, body)
    }

    /**
     * Tells the Einstein engine when a user clicks on a recommendation
     * https://developer.commercecloud.com/s/api-details/a003k00000UI4hPAAT/commerce-cloud-developer-centereinsteinrecommendations?tabset-888ee=2
     **/
    async sendClickReco(recommenderDetails, product, args) {
        const endpoint = `/activities/${this.siteId}/clickReco`
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
            userId: this.usid,
            ...args
        }

        return this.einsteinFetch(endpoint, method, body)
    }

    /**
     * Tells the Einstein engine when a user adds an item to their cart.
     * https://developer.commercecloud.com/s/api-details/a003k00000UI4hPAAT/commerce-cloud-developer-centereinsteinrecommendations?tabset-888ee=2
     **/
    async sendAddToCart(product, args) {
        const endpoint = `/activities/${this.siteId}/addToCart`
        const method = 'POST'
        const body = {
            products: [product],
            userId: this.usid,
            ...args
        }

        return this.einsteinFetch(endpoint, method, body)
    }

    /**
     * Get a list of recommenders that can be used in recommendation requests.
     * https://developer.commercecloud.com/s/api-details/a003k00000UI4hPAAT/commerce-cloud-developer-centereinsteinrecommendations?tabset-888ee=2
     **/
    async getRecommenders() {
        const endpoint = `/personalization/recommenders/${this.siteId}`
        const method = 'GET'
        const body = null

        return this.einsteinFetch(endpoint, method, body)
    }

    /**
     * Get a set of recommendations
     * https://developer.commercecloud.com/s/api-details/a003k00000UI4hPAAT/commerce-cloud-developer-centereinsteinrecommendations?tabset-888ee=2
     **/
    async getRecommendations(recommenderName, args) {
        const endpoint = `/personalization/recs/${this.siteId}/${recommenderName}`
        const method = 'POST'
        const body = {
            userId: this.usid,
            ...args
        }

        return await this.einsteinFetch(endpoint, method, body)
    }

    /**
     * Get a set of recommendations for a zone
     * https://developer.commercecloud.com/s/api-details/a003k00000UI4hPAAT/commerce-cloud-developer-centereinsteinrecommendations?tabset-888ee=2
     **/
    async getZoneRecommendations(zoneName, args) {
        const endpoint = `/personalization/${this.siteId}/zones/${zoneName}/recs`
        const method = 'POST'
        const body = {
            userId: this.usid,
            ...args
        }
        return await this.einsteinFetch(endpoint, method, body)
    }
}

export default EinsteinAPI
