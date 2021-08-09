/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2018 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/** @module */

import ShopApi from 'commercecloud-ocapi-client'
import btoa from 'btoa'
import * as errors from '../errors'

const clean = (obj) => {
    Object.keys(obj).forEach(
        (key) => (obj[key] === null || obj[key] === undefined) && delete obj[key]
    )
    return obj
}

const filterAttributeDictionary = {
    categoryId: 'cgid'
}

/**
 * This function will take product search request as we use them in the commerce-integrations
 * and output them into a format usable by the specific connector (ocapi).
 *
 * @private
 */
const transformProductSearchRequest = ({query, count, start, sort, filters = {}}) => ({
    count,
    q: query,
    sort,
    start,
    refine: Object.keys(filters).map(
        (key) => `${filterAttributeDictionary[key] || key}=${filters[key]}`
    )
})

/**
 * Format a message with the the information from a given Fault object.
 *
 * @param {String} message - the message to be displayed
 * @param {Object} fault a OCAPI {@link https://documentation.demandware.com/DOC1/topic/com.demandware.dochelp/OCAPI/18.3/shop/Documents/Fault.html|Fault} fault or {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error} error
 *
 * @return {String} Formatted fault message message.
 * @private
 */
const formatFault = (message = '', fault = {}) => {
    const seperator = '. '
    return [message, fault.type, fault.message].filter((s) => !!s).join(seperator)
}

/**
 * Takes a OCAPI Image object and parses it into a commerce-integrations
 * Image type.
 *
 * @param {Object} data a OCAPI {@link https://documentation.demandware.com/DOC1/topic/com.demandware.dochelp/OCAPI/18.3/shop/Documents/Image.html|Image} document
 *
 * @return {module:types.Image}.
 */
/* eslint-disable camelcase */
const parseImage = ({alt, dis_base_link, link, title}) => ({
    alt,
    description: alt,
    src: dis_base_link || link,
    title
})
/* eslint-enable camelcase */

/**
 * Takes a OCAPI VariationAttributeValue object and parses it into a commerce-integrations
 * ProductSearchResult type.
 *
 * @param {Object} data a OCAPI {@link https://documentation.demandware.com/DOC1/topic/com.demandware.dochelp/OCAPI/18.3/shop/Documents/VariationAttributeValue.html|VariationAttributeValue} document
 * @return {module:types.VariationPropertyValue}
 * @private
 */
/* eslint-disable camelcase */
const parseVariationPropertyValue = ({image, image_swatch, name, value}) => ({
    name,
    value,
    mainImage: image ? parseImage(image) : undefined,
    swatchImage: image_swatch ? parseImage(image_swatch) : undefined
})
/* eslint-enable camelcase */

/**
 * Takes a OCAPI VariationAttribute object and parses it into a commerce-integrations
 * VariationProperty type.
 *
 * @param {Object} data a OCAPI {@link https://documentation.demandware.com/DOC1/topic/com.demandware.dochelp/OCAPI/18.3/shop/Documents/VariationAttribute.html|VariationAttribute} document
 * @return {module:types.VariationProperty}
 * @private
 */
const parseVariationProperty = ({id, name, values = []}) => ({
    id,
    label: name,
    values: values.map(parseVariationPropertyValue)
})

/**
 * Takes a OCAPI ProductSearchHit object and parses it into a commerce-integrations
 * ProductSearchResult type.
 *
 * @param {Object} data a OCAPI {@link https://documentation.demandware.com/DOC1/topic/com.demandware.dochelp/OCAPI/18.3/shop/Documents/ProductSearchHit.html|ProductSearchHit} document
 *
 * @returns {module:types.ProductSearchResult}.
 */
/* eslint-disable camelcase */
const parseProductSearchResult = ({
    product_id,
    product_name,
    image,
    orderable,
    price,
    variation_attributes
}) => ({
    available: orderable,
    productId: product_id,
    productName: product_name,
    price,
    defaultImage: image ? parseImage(image) : undefined,
    variationProperties: variation_attributes
        ? variation_attributes.map(parseVariationProperty)
        : []
})
/* eslint-enable camelcase */

/**
 * Takes a OCAPI ProductSearchRefinementValue object and parses it into a commerce-integrations
 * FilterValue type.
 *
 * @param {Object} data a OCAPI
 * {@link https://documentation.demandware.com/DOC1/topic/com.demandware.dochelp/OCAPI/18.3/shop/Documents/ProductSearchRefinementValue.html|ProductSearchRefinementValue} document
 *
 * @returns {module:types.FilterValue}.
 */
/* eslint-disable camelcase */
const parseFilterValue = ({hit_count, label, value}) => ({
    count: hit_count,
    label,
    value
})
/* eslint-enable camelcase */

/**
 * Takes a OCAPI ProductSearchRefinement object and parses it into a commerce-integrations
 * Filter type.
 *
 * @param {Object} data a OCAPI
 * {@link https://documentation.demandware.com/DOC1/topic/com.demandware.dochelp/OCAPI/18.3/shop/Documents/ProductSearchRefinement.html|ProductSearchRefinement} document // eslint-disable-line
 *
 * @returns {module:types.Filter}.
 */
/* eslint-disable camelcase */
const parseFilters = ({label, attribute_id, values}) => ({
    propertyId: attribute_id,
    label,
    values: values ? values.map((value) => parseFilterValue(value)) : undefined
})
/* eslint-enable camelcase */

/**
 * Takes a OCAPI ProductSearchResult object and parses it into a commerce-integrations
 * ProductSearch type.
 *
 * @param {Object} data a OCAPI
 * {@link https://documentation.demandware.com/DOC1/topic/com.demandware.dochelp/OCAPI/18.3/shop/Documents/ProductSearchResult.html?cp=0_12_5_96|ProductSearchResult} document // eslint-disable-line
 *
 * @returns {module:types.ProductSearch}
 */
/* eslint-disable camelcase */
const parseProductSearch = ({
    count,
    hits = [],
    query,
    refinements = [],
    selected_sorting_option,
    selected_refinements,
    sorting_options,
    start,
    total
}) => ({
    count,
    filters: refinements.map((refinement) => parseFilters(refinement)),
    query,
    results: hits.map((hit) => parseProductSearchResult(hit)),
    selectedFilters: selected_refinements,
    selectedSortingOption: selected_sorting_option,
    sortingOptions: sorting_options,
    start,
    total
})
/* eslint-enable camelcase */

/**
 * Takes a OCAPI Variant object and parses it into a commerce-integrations Variation type.
 * @param {Object} data a OCAPI {@link https://documentation.demandware.com/DOC1/topic/com.demandware.dochelp/OCAPI/18.3/shop/Documents/Variant.html|Variant} document
 *
 * @returns {Promise<module:types.Variation>}
 */
/* eslint-disable camelcase */
const parseVariation = ({product_id, price, orderable, variation_values}) => ({
    id: product_id,
    price,
    orderable,
    values: variation_values
})
/* eslint-enable camelcase */

/**
 * Takes a OCAPI ImageGroup object and parses it into a commerce-integrations ImageSet type.
 * @param {Object} data a OCAPI {@link https://documentation.demandware.com/DOC1/topic/com.demandware.dochelp/OCAPI/18.3/shop/Documents/ImageGroup.html|ImageGroup} document
 *
 * @returns {Promise<module:types.ImageSet>}
 */
/* eslint-disable camelcase */
const parseImageSet = ({images, view_type, variation_attributes}) => ({
    images: images.map(parseImage),
    variationProperties: variation_attributes && variation_attributes.map(parseVariationProperty),
    sizeType: view_type
})
/* eslint-enable camelcase */

/**
 * Takes a OCAPI Product object and parses it into a commerce-integrations Product type.
 * @param {Object} data a OCAPI {@link https://documentation.demandware.com/DOC1/topic/com.demandware.dochelp/OCAPI/18.3/shop/Documents/Product.html|Product} document
 *
 * @returns {Promise<module:types.Product>}
 */
/* eslint-disable camelcase */
const parseProduct = ({
    id,
    image_groups = [],
    name,
    long_description,
    primary_category_id,
    brand,
    min_order_quantity,
    step_quantity,
    upc,
    unit,
    price,
    prices,
    variants = [],
    variation_attributes = [],
    variation_values = {}
}) => ({
    id,
    name,
    imageSets: image_groups.map(parseImageSet),
    description: long_description,
    categoryId: primary_category_id,
    brand,
    minimumOrderQuantity: min_order_quantity,
    stepQuantity: step_quantity,
    upc,
    unit,
    price,
    prices,
    variations: variants.map(parseVariation),
    variationProperties: variation_attributes.map(parseVariationProperty),
    variationValues: variation_values
})
/* eslint-enable camelcase */

/* eslint-disable camelcase */
const parseCustomer = ({customer_id, first_name, last_name, email}) => ({
    id: customer_id,
    firstName: first_name,
    lastName: last_name,
    email
})
/* eslint-enable camelcase */

const transformOrderAddress = (shippingAddress) => ({
    first_name: shippingAddress.firstName,
    last_name: shippingAddress.lastName,
    phone: shippingAddress.phone,
    address1: shippingAddress.addressLine1,
    address2: shippingAddress.addressLine2,
    country_code: shippingAddress.countryCode,
    state_code: shippingAddress.stateCode,
    city: shippingAddress.city,
    postal_code: shippingAddress.postalCode
})

const transformPayment = (payment) => ({
    amount: payment.amount,
    payment_card: {
        issue_number: payment.details.number,
        security_code: payment.details.ccv,
        holder: payment.details.holderName,
        card_type: payment.details.type,
        expiration_month: payment.details.expiryMonth,
        expiration_year: payment.details.expiryYear
    },
    payment_method_id: payment.methodId
})

const transformShippingMethod = (shippingMethod) => ({
    id: shippingMethod.id
})

const transformCustomerInformation = (customerInfo) => ({
    customer_id: customerInfo.id,
    email: customerInfo.email
})

const transformCartItem = (cartItem) => ({
    product_id: cartItem.productId,
    quantity: cartItem.quantity
})

const transformCart = (cart) => {
    const transformedCart = {}
    const {billingAddress, customerInfo, items, payments, shippingAddress} = cart

    // Transform our mobify api schema to salesforce ocapi schema
    if (billingAddress) {
        transformedCart.billing_address = transformOrderAddress(billingAddress)
    }
    if (customerInfo) {
        transformedCart.customer_info = transformCustomerInformation(customerInfo)
    }
    if (items) {
        transformedCart.product_items = items.map(transformCartItem)
    }
    if (payments) {
        transformedCart.payment_instruments = payments.map(transformPayment)
    }
    if (shippingAddress) {
        transformedCart.shipments = [
            {
                shipment_id: 'me',
                shipping_address: transformOrderAddress(shippingAddress)
            }
        ]
    }

    return transformedCart
}

/**
 * A connector for the Salesforce Commerce Cloud API.
 *
 * @implements {module:connectors/interfaces.CommerceConnector}
 * @implements {module:connectors/interfaces.ParserHooks}
 */
export class SalesforceConnector {
    /**
     * @param client {ShopApi.ApiClient}
     */
    constructor(client) {
        this.client = client
    }

    /**
     * Given a configuration in the form of a plain object, this method returns
     * a new SalesforceConnector instance.
     *
     * @param {Object} config {@link https://github.com/mobify/commercecloud-ocapi-client/blob/develop/src/ApiClient.js#L44}
     * @returns {module:sfcc.SalesforceConnector} The new SalesforceConnector instance.
     */
    static fromConfig(config) {
        return new this.prototype.constructor(new ShopApi.ApiClient(config))
    }

    /**
     * @inheritDoc
     */
    createCart(oldCart) {
        const api = new ShopApi.BasketsApi(this.client)
        const options = {}

        // Append the cart to the body.
        if (oldCart) {
            options.body = transformCart(oldCart)
        }

        return api
            .postBaskets(options)
            .then((data) => this.parseCart(data))
            .catch(() => {
                throw new errors.ServerError('Could Not Create Cart')
            })
    }

    /**
     * @inheritDoc
     */
    getCart(cartId) {
        if (!cartId) {
            throw new errors.InvalidArgumentError(`Parameter 'cartId' is required`)
        }

        const api = new ShopApi.BasketsApi(this.client)

        return api
            .getBasketsByID(cartId)
            .then((data) => this.parseCart(data))
            .catch(() => {
                throw new errors.NotFoundError('Cart Not Found')
            })
    }

    /**
     * @inheritDoc
     */
    deleteCart(cartId) {
        if (!cartId) {
            throw new errors.InvalidArgumentError(`Parameter 'cartId' is required`)
        }

        const api = new ShopApi.BasketsApi(this.client)
        return api.deleteBasketsByID(cartId).catch(() => {
            throw new errors.ServerError('Could Not Delete Cart')
        })
    }

    /**
     * @inheritDoc
     */
    addCartItem(cart, cartItem) {
        if (!cart) {
            throw new errors.InvalidArgumentError(`Parameter 'cart' is required`)
        }
        if (!cartItem) {
            throw new errors.InvalidArgumentError(`Parameter 'cartItem' is required`)
        }

        const api = new ShopApi.BasketsApi(this.client)

        // eslint-disable-next-line no-undef
        cartItem = transformCartItem(cartItem)

        return api
            .postBasketsByIDItems(cart.id, [cartItem])
            .then((data) => this.parseCart(data))
            .catch(() => {
                throw new errors.ServerError('Could Not Add Cart Item')
            })
    }

    /**
     * @inheritDoc
     */
    removeCartItem(cart, cartItemId) {
        if (!cart) {
            throw new errors.InvalidArgumentError(`Parameter 'cart' is required`)
        }
        if (!cartItemId) {
            throw new errors.InvalidArgumentError(`Parameter 'cartItemId' is required`)
        }

        const api = new ShopApi.BasketsApi(this.client)

        return api
            .deleteBasketsByIDItemsByID(cart.id, cartItemId)
            .then((data) => this.parseCart(data))
            .catch(() => {
                throw new errors.ServerError('Could Not Remove Cart')
            })
    }

    /**
     * @inheritDoc
     */
    updateCartItem(cart, cartItem) {
        if (!cart) {
            throw new errors.InvalidArgumentError(`Parameter 'cart' is required`)
        }
        if (!cartItem) {
            throw new errors.InvalidArgumentError(`Parameter 'cartItem' is required`)
        }

        const api = new ShopApi.BasketsApi(this.client)
        const cartItemId = cartItem.id

        // eslint-disable-next-line no-undef
        cartItem = transformCartItem(cartItem)

        return api
            .patchBasketsByIDItemsByID(cart.id, cartItemId, cartItem)
            .then((data) => this.parseCart(data))
            .catch(() => {
                throw new errors.ServerError('Could Not Update Cart')
            })
    }

    /**
     * @inheritDoc
     */
    setShippingAddress(cart, shippingAddress) {
        if (!cart) {
            throw new errors.InvalidArgumentError(`Parameter 'cart' is required`)
        }
        if (!shippingAddress) {
            throw new errors.InvalidArgumentError(`Parameter 'shippingAddress' is required`)
        }

        const api = new ShopApi.BasketsApi(this.client)

        // Transform Mobify schema into OCAPI schema
        // eslint-disable-next-line no-undef
        shippingAddress = transformOrderAddress(shippingAddress)

        return api
            .putBasketsByIDShipmentsByIDShippingAddress(cart.id, 'me', shippingAddress)
            .then((data) => this.parseCart(data))
            .catch(() => {
                throw new errors.ServerError('Could Not Set Shipping Address')
            })
    }

    /**
     * @inheritDoc
     */
    setBillingAddress(cart, billingAddress) {
        if (!cart) {
            throw new errors.InvalidArgumentError(`Parameter 'cart' is required`)
        }
        if (!billingAddress) {
            throw new errors.InvalidArgumentError(`Parameter 'billingAddress' is required`)
        }

        const api = new ShopApi.BasketsApi(this.client)

        // Transform Mobify schema into OCAPI schema
        // eslint-disable-next-line no-undef
        billingAddress = transformOrderAddress(billingAddress)

        return api
            .putBasketsByIDBillingAddress(cart.id, {body: billingAddress})
            .then((data) => this.parseCart(data))
            .catch(() => {
                throw new errors.ServerError('Could Not Set Billing Address')
            })
    }

    /**
     * @inheritDoc
     */
    setPayment(cart, payment) {
        if (!cart) {
            throw new errors.InvalidArgumentError(`Parameter 'cart' is required`)
        }
        if (!payment) {
            throw new errors.InvalidArgumentError(`Parameter 'payment' is required`)
        }

        const api = new ShopApi.BasketsApi(this.client)

        // Only allow one payment of a given type. If there is already a type in the cart,
        // then get it's id so we can `patch` it.
        const {payments = []} = cart
        const oldPayment = payments.find(({methodId}) => methodId === payment.methodId)

        // Transform Mobify schema into OCAPI schema
        // eslint-disable-next-line no-undef
        payment = transformPayment(payment)

        const request = !oldPayment
            ? api.postBasketsByIDPaymentInstruments(cart.id, payment)
            : api.patchBasketsByIDPaymentInstrumentsByID(cart.id, oldPayment.id, payment)

        return request
            .then((data) => this.parseCart(data))
            .catch(() => {
                throw new errors.ServerError('Could Not Add Payment')
            })
    }

    /**
     * Register a new customer account and login.
     *
     * @param {module:types/CustomerRegistration} data
     * @return {Promise<module:types/Customer>}
     */
    registerCustomer(data) {
        const body = {
            password: data.password,
            customer: {
                first_name: data.firstName,
                last_name: data.lastName,
                login: data.email,
                email: data.email
            }
        }
        const api = new ShopApi.CustomersApi(this.client)
        return api.postCustomers(body).then(() => this.login(data.email, data.password))
    }

    /**
     * @inheritDoc
     */
    login(username, password) {
        const type = username && password ? 'credentials' : 'guest'
        const api = new ShopApi.CustomersApi(this.client)

        const authParam =
            type === 'credentials'
                ? {authorization: `Basic ${btoa(`${username}:${password}`)}`}
                : undefined

        // Clear authorization from previous login
        delete api.apiClient.defaultHeaders.authorization

        return api
            .postCustomersAuth({type}, authParam)
            .then((data) => this.parseCustomer(data))
            .catch((fault) => {
                throw new errors.ForbiddenError(formatFault('Login error', fault))
            })
    }

    /**
     * @inheritDoc
     */
    logout() {
        const api = new ShopApi.CustomersApi(this.client)
        return api
            .deleteCustomersAuth()
            .then(() => {
                // Clear authorization from current login
                delete api.apiClient.defaultHeaders.authorization
                return undefined
            })
            .catch((fault) => {
                throw new errors.ServerError(formatFault('Logout error', fault))
            })
    }

    /**
     * @inheritDoc
     */
    getShippingMethods(cart) {
        if (!cart) {
            throw new errors.InvalidArgumentError(`Parameter 'cart' is required`)
        }

        const api = new ShopApi.BasketsApi(this.client)

        return (
            api
                .getBasketsByIDShipmentsByIDShippingMethods(cart.id, 'me')
                // eslint-disable-next-line camelcase
                .then(({applicable_shipping_methods = []}) =>
                    applicable_shipping_methods.map(this.parseShippingMethod)
                )
                .catch((fault) => {
                    throw new errors.ServerError(
                        formatFault('Could Not Get Shipping Methods', fault)
                    )
                })
        )
    }

    /**
     * @inheritDoc
     */
    refreshSession() {
        const api = new ShopApi.CustomersApi(this.client)

        return api
            .postCustomersAuth({type: 'refresh'})
            .then((data) => this.parseCustomer(data))
            .catch((fault) => {
                throw new errors.ForbiddenError(formatFault('Unable to refresh session', fault))
            })
    }

    /**
     * @inheritDoc
     */
    getPaymentMethods(cart) {
        if (!cart) {
            throw new errors.InvalidArgumentError(`Parameter 'cart' is required`)
        }

        const api = new ShopApi.BasketsApi(this.client)

        return (
            api
                .getBasketsByIDPaymentMethods(cart.id, 'me')
                // eslint-disable-next-line camelcase
                .then(({applicable_payment_methods = []}) =>
                    applicable_payment_methods.map(this.parsePaymentMethod)
                )
        )
    }

    /**
     * @inheritDoc
     */
    setShippingMethod(cart, shippingMethod) {
        if (!cart) {
            throw new errors.InvalidArgumentError(`Parameter 'cart' is required`)
        }
        if (!shippingMethod) {
            throw new errors.InvalidArgumentError(`Parameter 'shippingMethod' is required`)
        }

        const api = new ShopApi.BasketsApi(this.client)

        // Transform Mobify schema into OCAPI schema
        // eslint-disable-next-line no-undef
        shippingMethod = transformShippingMethod(shippingMethod)

        return api
            .putBasketsByIDShipmentsByIDShippingMethod(cart.id, 'me', shippingMethod)
            .then((data) => this.parseCart(data))
            .catch((fault) => {
                throw new errors.ServerError(formatFault('Could Not Set Shipping Method', fault))
            })
    }

    /**
     * @inheritDoc
     */
    setCustomerInformation(cart, customerInformation) {
        if (!cart) {
            throw new errors.InvalidArgumentError(`Parameter 'cart' is required`)
        }
        if (!customerInformation) {
            throw new errors.InvalidArgumentError(`Parameter 'customerInformation' is required`)
        }

        const api = new ShopApi.BasketsApi(this.client)

        // Transform Mobify schema into OCAPI schema
        // eslint-disable-next-line no-undef
        customerInformation = transformCustomerInformation(customerInformation)

        return api
            .putBasketsByIDCustomer(cart.id, customerInformation)
            .then((data) => this.parseCart(data))
    }

    /**
     * Parse a cart item
     */
    parseCartItem(data) {
        return {
            id: data.item_id,
            baseItemPrice: data.base_price,
            baseLinePrice: data.base_price * data.quantity,
            productId: data.product_id,
            productName: data.product_name,
            quantity: data.quantity,
            itemPrice: data.price_after_order_discount / data.quantity,
            linePrice: data.price_after_order_discount
        }
    }

    /**
     * Parse a coupon item
     */
    parseCouponEntry(data) {
        return {
            id: data.coupon_item_id,
            code: data.code
        }
    }

    /**
     * Parse an order address
     */
    parseOrderAddress(data) {
        return {
            firstName: data.first_name,
            lastName: data.last_name,
            phone: data.phone,
            addressLine1: data.address1,
            addressLine2: data.address2,
            city: data.city,
            countryCode: data.country_code,
            stateCode: data.state_code,
            postalCode: data.postal_code
        }
    }

    /**
     * Parse customer information
     */
    parseCustomerInformation(data) {
        return {
            id: data.customer_id,
            email: data.email || undefined
        }
    }

    /**
     * Parse a shipping method
     */
    parseShippingMethod(data) {
        return {
            id: data.id,
            cost: data.price,
            label: `${data.name} - ${data.description}`
        }
    }

    /**
     * Parse a payment method
     */
    parsePaymentMethod(data) {
        const {cards} = data
        const method = {
            id: data.id,
            name: data.name
        }

        if (cards) {
            method.types = cards.map((card) => ({
                id: card.card_type,
                name: card.name
            }))
        }

        return method
    }

    /**
     * Parse a payment.
     */
    parsePayment(data) {
        return {
            id: data.payment_instrument_id,
            amount: data.amount,
            methodId: data.payment_method_id,
            details: {
                type: data.payment_card.card_type,
                expiryMonth: data.payment_card.expiration_month,
                expiryYear: data.payment_card.expiration_year,
                holderName: data.payment_card.holder,
                number: data.payment_card.issue_number,
                maskedNumber: data.payment_card.masked_number
            }
        }
    }

    /**
     * Parse a cart
     */
    parseCart(data) {
        /* eslint-disable camelcase */
        const {
            billing_address,
            shipments = [],
            coupon_items = [],
            payment_instruments = [],
            product_items = [],
            customer_info
        } = data
        let shippingAddress
        let selectedShippingMethodId

        const shipment = shipments.length ? shipments[0] : undefined
        if (shipment) {
            shippingAddress = shipment.shipping_address
                ? this.parseOrderAddress(shipment.shipping_address)
                : undefined

            selectedShippingMethodId = shipment.shipping_method
                ? shipment.shipping_method.id
                : undefined
        }
        const billingAddress = billing_address ? this.parseOrderAddress(billing_address) : undefined

        const payments = payment_instruments.map(this.parsePayment)
        const items = product_items.map(this.parseCartItem)
        const couponEntries = coupon_items.map(this.parseCouponEntry)

        const parseNumberValue = (value) => {
            return value !== null ? value : undefined
        }
        const id = data.basket_id
        const customerInfo = customer_info
            ? this.parseCustomerInformation(customer_info)
            : undefined
        const subtotal = parseNumberValue(data.product_sub_total)
        const discounts = (data.order_price_adjustments || []).reduce(
            (acc, curr) => acc + curr.price,
            0
        )
        const shipping = parseNumberValue(data.shipping_total)
        const tax = parseNumberValue(data.tax_total || data.merchandize_total_tax)
        const total = parseNumberValue(data.order_total || data.product_total)

        return {
            id,
            discounts,
            billingAddress,
            couponEntries,
            customerInfo,
            items,
            payments,
            shippingAddress,
            selectedShippingMethodId,
            shipping,
            subtotal,
            tax,
            total
        }
        /* eslint-enable camelcase */
    }

    /**
     * @inheritDoc
     */
    getDefaultHeaders() {
        return Object.assign({}, this.client.defaultHeaders)
    }

    /**
     * @inheritDoc
     */
    setDefaultHeaders(headers) {
        this.client.defaultHeaders = Object.assign({}, headers)
    }

    /**
     * @inheritDoc
     */
    getCustomer(id, opts) {
        const api = new ShopApi.CustomersApi(this.client)
        const defaultOptions = {
            expand: ['addresses', 'paymentinstruments'],
            allImages: true
        }
        const options = {
            ...defaultOptions,
            ...opts
        }
        return api.getCustomersByID(id, options).then((data) => this.parseCustomer(data))
    }

    /**
     * Takes a OCAPI Customer object and parses it into a commerce-integrations Customer type.
     * @param {Object} data a OCAPI {@link https://documentation.demandware.com/DOC1/topic/com.demandware.dochelp/OCAPI/18.3/shop/Documents/Customer.html|Customer} document
     *
     * @returns {Promise<module:types.Customer>}
     */
    parseCustomer(data) {
        return parseCustomer(data)
    }

    /**
     * @inheritDoc
     */
    getProduct(id, opts = {}) {
        const api = new ShopApi.ProductsApi(this.client)
        const defaultOptions = {
            expand: ['availability', 'prices', 'variations', 'images'],
            allImages: true
        }
        const options = {
            ...defaultOptions,
            ...opts
        }
        return api
            .getProductsByID(id, options)
            .then((data) => this.parseProduct(data))
            .catch((fault) => {
                throw new errors.NotFoundError(formatFault('Product Not Found', fault))
            })
    }

    /**
     * @inheritDoc
     */
    getProducts(ids, opts = {}) {
        if (!ids || ids.length <= 0) {
            throw new Error('Please specify list of product ids to get.')
        }

        const api = new ShopApi.ProductsApi(this.client)
        const defaultOptions = {
            expand: ['availability', 'prices', 'variations', 'images'],
            allImages: true
        }
        const options = {
            ...defaultOptions,
            ...opts
        }
        return api.getProductsByIDs(ids, options).then(({count, data = [], total}) => {
            return {
                count,
                data: data.map(this.parseProduct),
                total
            }
        })
    }

    /**
     * Takes a OCAPI Product object and parses it into a commerce-integrations Product type.
     * @param {Object} data a OCAPI {@link https://documentation.demandware.com/DOC1/topic/com.demandware.dochelp/OCAPI/18.3/shop/Documents/Product.html|Product} document
     *
     * @returns {Promise<module:types.Product>}
     */
    parseProduct(data) {
        return parseProduct(data)
    }

    /**
     * @inheritDoc
     */
    searchProducts(productSearchRequest, opts = {}) {
        let searchRequest = transformProductSearchRequest(productSearchRequest)
        const api = new ShopApi.ProductSearchApi(this.client)

        const defaultOptions = {
            expand: ['availability', 'prices', 'variations', 'images']
        }

        // Assign options to new object. This allows the user to override
        // and defaults we set.
        searchRequest = {
            ...searchRequest,
            ...defaultOptions,
            ...opts
        }

        return api
            .getProductSearch(searchRequest)
            .then((data) => this.parseSearchProducts(data, searchRequest))
    }

    /**
     * Takes a OCAPI ProductSearchResult object and parses it into a commerce-integrations
     * ProductSearch type.
     *
     * @param {Object} data a OCAPI
     * {@link https://documentation.demandware.com/DOC1/topic/com.demandware.dochelp/OCAPI/18.3/shop/Documents/ProductSearchResult.html?cp=0_12_5_96|ProductSearchResult} document
     *
     * @returns {Promise<module:types.ProductSearch>}
     */
    parseSearchProducts(data, searchParams) {
        return parseProductSearch(data, searchParams)
    }

    /**
     * @inheritDoc
     */
    getStore(id) {
        const api = new ShopApi.StoresApi(this.client)

        return api.getStoresByID(id).then((data) => this.parseGetStore(data))
    }

    /**
     * Takes a OCAPI Store object and parses it into a commerce-integrations Store type.
     * @param {Object} data a OCAPI {@link https://documentation.demandware.com/DOC1/topic/com.demandware.dochelp/OCAPI/18.3/shop/Documents/Store.html|Store} document
     *
     * @returns {Promise<module:types.Store>}
     */
    parseGetStore(data) {
        const d = data
        return {
            addressLine1: d.address1,
            addressLine2: d.address2,
            city: d.city,
            country: d.country_code,
            email: d.email,
            id: d.id,
            name: d.name,
            phone: d.phone
                ? d.phone.replace(new RegExp('[(]|[)]|[.]|[ ]|[-]|[#]|[x]', 'g'), '')
                : undefined,
            postalCode: d.postal_code,
            hours: d.store_hours,
            images: d.image ? {src: d.image, alt: d.name} : undefined
        }
    }

    /**
     * This function will take product search request as we use them in the commerce-integrations
     * and output them into a format usable by the specific connector (ocapi).
     */
    transformSearchStoreParams(searchParams) {
        const sp = searchParams
        return {
            count: sp.count > 0 ? sp.count : 20,
            start: sp.start > 0 ? sp.start : 0,
            distanceUnit: 'km', // only 'mi' and 'km' supported
            latitude: sp.latlon.latitude,
            longitude: sp.latlon.longitude
        }
    }

    /**
     * @inheritDoc
     */
    // eslint-disable-next-line no-unused-vars
    searchStores(storeSearchRequest, opts = {}) {
        if (
            isNaN(storeSearchRequest.latlon.latitude) ||
            isNaN(storeSearchRequest.latlon.longitude)
        ) {
            throw new Error('Provide Latitude and Longitude coordinates')
        }

        const api = new ShopApi.StoresApi(this.client)
        const searchRequest = this.transformSearchStoreParams(storeSearchRequest)
        return api.getStores(searchRequest).then((data) => this.parseSearchStores(data))
    }

    parseSearchStores(data) {
        const d = data
        return {
            count: d.count,
            start: d.start,
            total: d.total,
            stores: d.data ? d.data.map((store) => this.parseGetStore(store)) : undefined
        }
    }

    /**
     * @inheritDoc
     */
    getCategory(id, options = {}) {
        const api = new ShopApi.CategoriesApi(this.client)
        return api.getCategoriesByID(id, options).then((data) => this.parseCategory(data))
    }

    /**
     * @inheritDoc
     */
    getCategories(ids, options = {}) {
        const api = new ShopApi.CategoriesApi(this.client)
        return api.getCategoriesByIDs(ids, options).then(({data, count, total}) => ({
            data: this.parseCategories(data),
            count,
            total
        }))
    }

    /**
     * Takes an array of OCAPI Category objects and parses it into an
     * commerce-integrations Category type.
     * @param {Object[]} categories an array of OCAPI {@link https://mobify.github.io/commercecloud-ocapi-client/module-models_Category.html|Category} document
     *
     * @returns {Array<module:types.Category>}
     */
    parseCategories(categories) {
        return categories.map((c) => this.parseCategory(c))
    }

    /**
     * Takes a OCAPI Category objects and parses it into an
     * commerce-integrations Category type.
     * @param {Object[]} categories an OCAPI {@link https://mobify.github.io/commercecloud-ocapi-client/module-models_Category.html|Category} document
     *
     * @returns {module:types.Category}
     */
    /* eslint-disable camelcase */
    parseCategory({
        id,
        name,
        page_description,
        categories: subCategories,
        image: backgroundImage,
        thumbnail: thumbnailImage
    }) {
        const imageAttributes = {
            alt: name,
            description: page_description,
            title: name
        }
        const category = {
            id,
            name,
            description: page_description,
            thumbnailImage: thumbnailImage && this.parseImage(thumbnailImage, imageAttributes),
            backgroundImage: backgroundImage && this.parseImage(backgroundImage, imageAttributes)
        }

        if (subCategories) {
            category.categories = this.parseCategories(subCategories)
        }

        return clean(category)
    }
    /* eslint-enable camelcase */

    /**
     * Takes an image url and its attributes and return an
     * commerce-integrations Image type.
     * @param {string} imageUrl
     * @param {Object} attributes additional attributes of an image
     *
     * @returns {Promise<module:types.Image>}
     */
    parseImage(imageUrl, attributes) {
        return {
            ...attributes,
            src: imageUrl
        }
    }

    /**
     * @inheritDoc
     */
    parseOrder(data) {
        const order = this.parseCart(data)

        return {
            ...order,
            creationDate: new Date(data.creation_date),
            id: data.order_no,
            status: data.shipping_status
        }
    }

    /**
     * Create a new order using a given cart. This command will trigger the appropriate
     * OCAPI order authorization hooks. If orders placed through this command aren't progressing
     * from the `created` status, it's possible that your API hooks haven't been set up. Please
     * consult your Saleforce professional.
     * @param {module:types.Cart} cart The customer's cart.
     * @param {Object} opts
     * @return {Promise<module:types.Order>}.
     */
    // eslint-disable-next-line no-unused-vars
    createOrder(cart, opts = {}) {
        if (!cart) {
            throw new errors.InvalidArgumentError(`Parameter 'cart' is required`)
        }

        const api = new ShopApi.OrdersApi(this.client)

        // OCAPI only requires that you pass in the id of the basket, so we don't need
        // a complex transformation here.
        return api
            .postOrders({basket_id: cart.id})
            .then((data) => {
                // The OCAPI backend doesn't like having this value defined, so let's remove it.
                delete data.payment_instruments[0].payment_card.credit_card_expired

                // To ensure that the OCAPI backend triggers the payment authorization hook, we have
                // to either update the order payment intruments or add one. He you can see we are just
                // re-submitting the payments after it's creation.
                return api.patchOrdersByIDPaymentInstrumentsByID(
                    data.order_no,
                    data.payment_instruments[0].payment_instrument_id,
                    {
                        amount: data.payment_instruments[0].amount,
                        payment_card: data.payment_instruments[0].payment_card,
                        payment_method_id: data.payment_instruments[0].payment_method_id
                    }
                )
            })
            .then((data) => this.parseOrder(data))
    }

    /**
     * @inheritDoc
     */
    // eslint-disable-next-line no-unused-vars
    getOrder(id, opts = {}) {
        if (!id) {
            throw new errors.InvalidArgumentError(`Parameter 'id' is required`)
        }
        const api = new ShopApi.OrdersApi(this.client)

        // OCAPI only requires that you pass in the id of the basket, so we don't need
        // a complex transformation here.
        return api
            .getOrdersByID(id)
            .then((data) => this.parseOrder(data))
            .catch((fault) => {
                throw new errors.NotFoundError(formatFault('Order Not Found', fault))
            })
    }

    /**
     * @inheritDoc
     */
    // eslint-disable-next-line no-unused-vars
    getOrders(ids, opts = {}) {
        if (!ids || ids.length <= 0) {
            throw new errors.InvalidArgumentError(`Parameter 'ids' is required`)
        }

        const getOrderPromises = ids.map((id) => this.getOrder(id, opts).catch(() => null))

        return Promise.all(getOrderPromises).then((orders) => {
            const validOrders = orders.filter((order) => !!order)
            return {
                count: validOrders.length,
                data: validOrders,
                total: validOrders.length
            }
        })
    }

    /**
     * @inheritDoc
     */
    // eslint-disable-next-line no-unused-vars
    addCouponEntry(cart, couponCode, opts = {}) {
        if (!cart) {
            throw new errors.InvalidArgumentError(`Parameter 'cart' is required`)
        }
        if (!couponCode) {
            throw new errors.InvalidArgumentError(`Parameter 'couponCode' is required`)
        }

        const api = new ShopApi.BasketsApi(this.client)

        return api
            .postBasketsByIDCoupons(cart.id, {code: couponCode})
            .then((data) => this.parseCart(data))
            .catch((fault) => {
                throw new errors.ServerError(formatFault('Could Not Add Coupon', fault))
            })
    }

    /**
     * @inheritDoc
     */
    // eslint-disable-next-line no-unused-vars
    removeCouponEntry(cart, couponEntryId, opts = {}) {
        if (!cart) {
            throw new errors.InvalidArgumentError(`Parameter 'cart' is required`)
        }
        if (!couponEntryId) {
            throw new errors.InvalidArgumentError(`Parameter 'couponEntryId' is required`)
        }

        const api = new ShopApi.BasketsApi(this.client)

        return api
            .deleteBasketsByIDCouponsByID(cart.id, couponEntryId)
            .then((data) => this.parseCart(data))
            .catch((fault) => {
                throw new errors.ServerError(formatFault('Could Not Remove Coupon', fault))
            })
    }
}
