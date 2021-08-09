/**
 * @module @mobify/commerce-integrations/dist/connectors/merlins
 * @private
 */
import {ScrapingConnector} from './scraping-connector'
import * as errors from '../errors'
import * as cj from 'cookiejar'

const ROOT_CATEGORY = 'root'

/**
 * Takes commerce-integrations Integer type and returns the URL
 * representation used to view a product details page on the website.
 *
 * @param {module:@mobify/commerce-integrations/dist/types.Integer} id
 * @returns {String}
 * @private
 */
const getProductUrl = (id) => {
    return `/${id.replace(/\s/g, '-').toLowerCase()}.html`
}

/**
 * Utility function, takes a string and caplitalizes each word.
 */
const titleCase = (str) =>
    str
        .split(' ')
        .map((word) => `${word.charAt(0).toUpperCase()}${word.substring(1)}`)
        .join(' ')

/**
 * Takes a Magento product attribute value object and parses out a
 * commerce-integrations VariationPropertyValue type
 *
 * @param {Object} data
 * @returns {module:@mobify/commerce-integrations/dist/types.VariationPropertyValue}
 * @private
 */
const parseVariationPropertyValue = ({label, id}) => ({
    name: label,
    value: id
})

/**
 * Takes a Magento product variation attribute object and parses out a
 * commerce-integrations VariationProperty type
 *
 * @param {Object} data
 * @returns {module:@mobify/commerce-integrations/dist/types.VariationProperty}
 * @private
 */
const parseVariationProperty = ({code, label, options = []}) => ({
    id: code,
    label,
    values: options.map(parseVariationPropertyValue)
})

/**
 * Takes a Magento product object and parses out an
 * commerce-integrations Variation type
 *
 * @param {Object} data
 * @returns {module:@mobify/commerce-integrations/dist/types.Variation}
 * @private
 */
const parseVariation = (id, upc, value, config) => {
    const convertedValues = Object.keys(value).reduce((acc, curr) => {
        acc[config.attributes[curr].code] = value[curr]

        return acc
    }, {})

    // Id's in magento look something like this "Eye Of Newt-20 ml-Red-1" which can be broken
    // down to this template "{sku}-{varationPropertyLabel1}-{varationPropertyLabelN}-{NumericalMasterProductId}". The below
    // code makes sure we get these variation property labels to use in the construction of
    // the id value.
    const variationValueLabels = Object.keys(value)
        .map(
            (key) => config.attributes[key].options.find((option) => option.id === value[key]).label
        )
        .sort()

    return {
        id: `${[upc, ...variationValueLabels].join('-')}-${config.productId}`,
        price: parseFloat(config.optionPrices[id].basePrice.amount),
        orderable: true, // Magento doesn't show out of stock variations... I think...
        values: convertedValues
    }
}

/**
 * Takes a takes a Magento image object and returns a set of commerce-integrations
 * Image type.
 *
 * @param {Object} data
 * @returns {Array.<module:@mobify/commerce-integrations/dist/types.Image>}
 * @private
 */
const parseImageSet = ({caption, full, thumb}) => {
    const sets = []

    // Parse `full` image
    sets.push({
        images: [{title: caption, src: full, alt: caption}],
        variationProperties: [],
        sizeType: 'full'
    })

    // Parse `thumb` image
    sets.push({
        images: [{title: caption, src: thumb, alt: caption}],
        variationProperties: [],
        sizeType: 'thumb'
    })

    return sets
}

/**
 * Takes a document object and parses out a commerce-integrations Product type
 *
 * @param {Object} htmlDoc a {@link https://developer.mozilla.org/en-US/docs/Web/API/Document|Document} object
 * @returns {Promise<module:@mobify/commerce-integrations/dist/types.Product>}
 * @private
 */
const parseProduct = (htmlDoc) => {
    const name = htmlDoc.querySelector('.page-title').textContent
    const description = htmlDoc.querySelector('.product.description').textContent
    const categoryEl = htmlDoc.querySelector('.breadcrumbs .item:nth-last-child(2) a')
    const priceEl = htmlDoc.querySelector('meta[property="product:price:amount"]')
    const skuEl = htmlDoc.querySelector('.sku .value')

    // Parse the categoryId
    let categoryId
    if (categoryEl) {
        const categoryIdMatch = categoryEl.pathname.match(/\/([^.]+)\.html/)
        categoryId = categoryIdMatch && categoryIdMatch[1]
    }

    // Parse the currency, price, prices, upc
    let price
    let upc

    if (priceEl) {
        price = parseFloat(priceEl.getAttribute('content'))
    }
    if (skuEl) {
        upc = skuEl.textContent
    }

    // We'll get alot of the product information from an inline script which contains
    // product details in the form of JSON.
    let productConfig
    const productScriptEls = htmlDoc.querySelectorAll('.product-add-form script')
    if (productScriptEls && productScriptEls.length > 1) {
        // NOTE: If there are variations there will be more than 1 script
        const productScriptJSON = JSON.parse(productScriptEls[0].textContent)
        productConfig = productScriptJSON['#product_addtocart_form'].configurable.spConfig
    }

    let galleryConfig
    const galleryScriptEl = htmlDoc.querySelector('.product.media script')
    if (galleryScriptEl) {
        const galleryScriptJSON = JSON.parse(galleryScriptEl.textContent)
        galleryConfig =
            galleryScriptJSON['[data-gallery-role=gallery-placeholder]']['mage/gallery/gallery']
                .data
    }

    return {
        id: upc,
        name,
        imageSets:
            galleryConfig &&
            galleryConfig.reduce((acc, curr) => [...acc, ...parseImageSet(curr)], []),
        description,
        categoryId, // NOTE: Without the category in the path, it won't show up in the bread crumbs.
        brand: `Merlin's Potions`,
        minimumOrderQuantity: 1,
        stepQuantity: 1,
        upc,
        unit: 'ea',
        price,
        prices:
            productConfig &&
            Object.keys(productConfig.prices).reduce(
                (acc, curr) => ({...acc, ...{[curr]: productConfig.prices[curr].amount}}),
                {}
            ),
        variations:
            productConfig &&
            Object.keys(productConfig.index).map((key) =>
                parseVariation(key, upc, productConfig.index[key], productConfig)
            ),
        variationProperties:
            productConfig &&
            Object.keys(productConfig.attributes).map((attributeId) =>
                parseVariationProperty(productConfig.attributes[attributeId])
            ),
        variationValues: productConfig && productConfig.defaultValues
    }
}

// Transform Methods
const transformOrderAddress = (shippingAddress) => ({
    firstname: shippingAddress.firstName,
    lastname: shippingAddress.lastName,
    telephone: shippingAddress.phone,
    street: [shippingAddress.addressLine1, shippingAddress.addressLine2],
    countryId: shippingAddress.countryCode,
    regionId: shippingAddress.stateCode,
    city: shippingAddress.city,
    postcode: shippingAddress.postalCode
})

const transformShippingMethod = (shippingMethod) => ({
    amount: shippingMethod.cost,
    carrier_code: shippingMethod.id
})

const transformCartItem = (cartItem) => ({
    cartItem: {
        sku: cartItem.productId,
        qty: cartItem.quantity
    }
})

/**
 * A connector for www.merlinspotions.com, using screen-scraping.
 *
 * @implements {module:@mobify/commerce-integrations/dist/connectors/interfaces.CommerceConnector}
 */
export class MerlinsConnector extends ScrapingConnector {
    constructor({window, basePath, dondeGeoBasePath, dondeApiBasePath, cookieDomainRewrites}) {
        super({window, cookieDomainRewrites})
        this.basePath = basePath
        this.dondeGeoBasePath = dondeGeoBasePath
        this.dondeApiBasePath = dondeApiBasePath
    }

    /**
     * @private
     */
    loginUrl() {
        return `${this.basePath}/customer/account/login/`
    }

    /**
     * @inheritDoc
     */
    login(username, password) {
        if (!(username && password)) {
            // This is a magic customer id and shouldn't passed to the server.
            return Promise.resolve({
                id: 'anonymous'
            })
        }

        // Magento has separate logins for the API and the HTML site. Login to both.
        const apiLogin = this.agent
            .post(`${this.basePath}/rest/default/V1/integration/customer/token`)
            .send({username, password})
            .then((res) => this.agent.set('Authorization', `Bearer ${res.body}`))
            .catch(() => {
                throw new errors.ServerError('Could not get customer token')
            })

        const htmlLogin = this.agent
            .get(this.loginUrl())
            .then((res) => this.buildDocument(res))
            .then((doc) => {
                const titleEl = doc.querySelector('h1.page-title')
                const title = (titleEl && titleEl.textContent) || undefined
                const formKeyEl = doc.querySelector('#login-form input[name="form_key"]')
                const formKey = (formKeyEl && formKeyEl.value) || undefined

                if (title === 'My Dashboard') {
                    // If redirected to the dashboard, we're already logged in.
                    return Promise.resolve()
                } else {
                    return this.agent
                        .post(`${this.basePath}/customer/account/loginPost/`)
                        .type('form')
                        .send({
                            form_key: formKey,
                            'login[username]': username,
                            'login[password]': password,
                            persistent_remember_me: 'on',
                            send: ''
                        })
                }
            })

        return Promise.all([apiLogin, htmlLogin]).then(() => this.getCustomer('me'))
    }

    /**
     * Register a new customer account and login.
     *
     * @param {module:@mobify/commerce-integrations/dist/types.CustomerRegistration} data
     * @return {Promise<module:@mobify/commerce-integrations/dist/types.Customer>}
     */
    registerCustomer(data) {
        const defaults = {newLetterSignup: false, rememberMe: false}
        const fields = ['firstName', 'lastName', 'email', 'password']
        data = Object.assign({}, defaults, data)
        fields.forEach((field) => {
            if (!data.hasOwnProperty(field)) {
                throw new errors.InvalidArgumentError(`Missing required field ${field}`)
            }
        })
        return this.agent
            .post(`${this.basePath}/customer/account/createpost/`)
            .type('form')
            .send({
                success_url: '',
                error_url: '',
                firstname: data.firstName,
                lastname: data.lastName,
                email: data.email,
                password: data.password,
                password_confirmation: data.password,
                ...(data.rememberMe ? {persistent_remember_me: 'on'} : {}),
                ...(data.newLetterSignup ? {is_subscribed: 1} : {})
            })
            .then((res) => this.buildDocument(res))
            .then((doc) => {
                // If we see the signup form again, there was an error.
                const form = doc.querySelector('form.form-create-account')
                return form
                    ? Promise.reject(new errors.ServerError('Could not create account'))
                    : data
            })
            .then(() => {
                // After creating an account the server leaves the user in
                // a logged-in state. This doesn't cover API login though, so
                // do a part-redundant call to login here.
                return this.login(data.email, data.password)
            })
    }

    /**
     * @inheritDoc
     */
    logout() {
        return this.agent.post(`${this.basePath}/customer/account/logout/`).then(() => {
            if (!this.inBrowser()) {
                // Really kill all cookies, if not in the browser
                this.agent.jar = cj.CookieJar()
            }
            const {agent} = this
            // Clear out Authorization headers if there are any.
            agent._defaults = agent._defaults.filter(
                (def) => !(def.fn === 'set' && def.arguments[0] === 'Authorization')
            )
        })
    }

    /**
     * @inheritDoc
     */
    getCustomer(id) {
        if (id !== 'me') {
            return Promise.reject(
                new Error(
                    'This backend only supports getting the current customer ' +
                        '(pass "me" as the ID)'
                )
            )
        }
        return this.agent
            .get(`${this.basePath}/customer/account/edit/`)
            .then((res) => this.buildDocument(res))
            .then((doc) => {
                // Selector is over-specific to ensure we are on the correct page
                // (could have followed a redirect if logged-out).
                const form = doc.querySelector('#form-validate.form-edit-account')

                if (!form) {
                    return Promise.reject(new Error('logged out'))
                } else {
                    return Promise.resolve({
                        id: 'me',
                        firstName: form.querySelector('input[name="firstname"]').value,
                        lastName: form.querySelector('input[name="lastname"]').value,
                        email: form.querySelector('input[name="email"]').value
                    })
                }
            })
    }

    /**
     * @inheritDoc
     */
    refreshSession() {
        // This is for interface compatibility - it's not necessary
        // on a screen-scraping connector, generally.
        return this.getCustomer('me')
    }

    /**
     * Given a configuration in the form of a plain object, this method returns
     * a new MerlinsConnector instance.
     *
     * @param {Object} config
     *
     * @returns {module:@mobify/commerce-integrations/dist/types.MerlinsConnector} The new MerlinsConnector instance.
     */
    static fromConfig(config) {
        return new this.prototype.constructor(config)
    }

    /**
     * @inheritDoc
     */
    getProduct(id) {
        const url = `${this.basePath}${getProductUrl(id)}`
        return this.agent
            .get(url)
            .then((res) => this.buildDocument(res))
            .then((htmlDoc) => {
                if (htmlDoc.title === '404 Not Found') {
                    throw new errors.NotFoundError('Product Not Found')
                }
                return htmlDoc
            })
            .then((htmlDoc) => this.parseProduct(htmlDoc))
    }

    /**
     * @inheritDoc
     */
    getProducts(ids = []) {
        const getProductPromises = ids.map((id) => this.getProduct(id).catch(() => null))
        return Promise.all(getProductPromises).then((products) => {
            const validProducts = products.filter((product) => !!product)
            return {
                count: validProducts.length,
                data: validProducts,
                total: validProducts.length
            }
        })
    }

    /**
     * Takes a OCAPI Product object and parses it into a commerce-integrations Product type.
     * @param {Object} data a OCAPI {@link https://documentation.demandware.com/DOC1/topic/com.demandware.dochelp/OCAPI/18.3/shop/Documents/Product.html|Product} document
     *
     * @returns {Promise<module:@mobify/commerce-integrations/dist/types.Store>}
     */
    parseProduct(data) {
        return parseProduct(data)
    }

    /**
     * @inheritDoc
     */
    searchProducts(productSearchRequest) {
        const url = `${this.basePath}${this.getSearchUrl(productSearchRequest)}`
        if (!productSearchRequest.count || ![4, 8, 12].includes(productSearchRequest.count)) {
            console.warn(
                `The Merlins backend only supports 'count' values of 4, 8, 12. Defaulting to 4.`
            )
            productSearchRequest.count = 4
        }

        return this.agent
            .get(url)
            .then((res) => this.buildDocument(res))
            .then((htmlDoc) => this.parseSearchProducts(htmlDoc, productSearchRequest))
    }

    parseGetStore(htmlDoc) {
        // Parse the page into the models unique parts and assign them to the result.
        const mainContent = htmlDoc.getElementById('maincontent')
        const name = mainContent.querySelector('.location-title').textContent
        const addressLine1 = mainContent
            .querySelector('[itemprop="streetAddress"]')
            .textContent.trim()
        const city = mainContent.querySelector('[itemprop="addressLocality"]').textContent

        const country = mainContent.querySelector('.location-crumb.first-crumb').textContent
        const phone = mainContent
            .querySelector('[itemprop="telephone"]')
            .textContent.replace(new RegExp('[(]|[)]|[.]|[ ]|[-]|[#]|[x]', 'g'), '')
        const postalCode = mainContent.querySelector('[itemprop="postalCode"]').textContent

        const hoursContent = this.window.document.createElement('div')
        hoursContent.innerHTML = mainContent.querySelector('#hoursBlock').textContent

        const hours = {}
        const hoursNodeList = hoursContent.querySelectorAll('.fh-item')
        hoursNodeList.forEach((hour) => {
            const content = hour.querySelector('[itemprop="name"]')
            if (content) {
                const day = content.textContent.slice(0, -1)
                const openingTime = hour.querySelector('[itemprop="opens"]').textContent
                const closingTime = hour.querySelector('[itemprop="closes"]').textContent
                hours[day] = {
                    openingTime,
                    closingTime
                }
            }
        })
        return {
            addressLine1,
            city,
            country,
            name,
            phone: phone ? phone : undefined,
            postalCode: postalCode ? postalCode : undefined,
            hours: hours ? hours : undefined
        }
    }

    /**
     * @private
     */
    hasAuthorization() {
        const headers = this.getDefaultHeaders() || {}
        const keys = Object.keys(headers)

        return keys.filter((key) => headers[key].Authorization).length > 0
    }

    /**
     * Parse an order address
     */
    parseOrderAddress(data) {
        return {
            firstName: data.firstname,
            lastName: data.lastname,
            phone: data.telephone,
            addressLine1: data.street[0],
            addressLine2: data.street[1],
            city: data.city,
            countryCode: data.country_id,
            stateCode: data.region_id.toString(),
            postalCode: data.postcode
        }
    }

    /**
     * Parse a cart item
     * cart item will not have price until a payment is set.
     */
    parseCartItem(data) {
        return {
            id: data.item_id.toString(),
            baseItemPrice: data.price,
            baseLinePrice: data.price * data.qty,
            productId: data.sku,
            productName: data.name,
            quantity: data.qty,
            itemPrice: data.price,
            linePrice: data.price * data.qty
        }
    }

    /**
     * Parse a shipping method
     */
    parseShippingMethod(data) {
        return {
            id: data.carrier_code,
            cost: data.amount,
            label: `${data.method_title} - ${data.carrier_title}`
        }
    }

    /**
     * Parse a payment method
     */
    parsePaymentMethod(data) {
        return {
            id: data.code,
            name: data.title
        }
    }

    /**
     * Parse a coupon item
     */
    parseCouponEntry(data) {
        return {
            id: data.coupon_code,
            code: data.coupon_code
        }
    }

    /**
     * Parse a cart
     */
    /* eslint-disable camelcase */
    parseCart(data) {
        const {billing_address, customer} = data
        const hasBillingAddress = billing_address && billing_address.street[0] !== ''

        return {
            id: data.id,
            billingAddress: hasBillingAddress ? this.parseOrderAddress(billing_address) : undefined,
            customerInfo: {
                id: customer.id ? customer.id.toString() : 'anonymous',
                email: customer.email
            }
        }
    }
    /* eslint-enable camelcase */

    /**
     * @inheritDoc
     */
    // eslint-disable-next-line no-unused-vars
    createCart(oldCart, opts = {}) {
        return this.agent
            .post(
                `${this.basePath}/rest/default/V1/${
                    this.hasAuthorization() ? 'carts/mine' : 'guest-carts'
                }`
            )
            .then((res) => res.body)
            .then((cartId) => this.getCart(cartId))
            .then((cart) => {
                if (oldCart && !cart.customerInfo.email && oldCart.customerInfo.email) {
                    cart.customerInfo.email = oldCart.customerInfo.email
                }
                // Have not found a way to retrieve shippingAddress from the backend. so lets persist it from the incoming cart parameter to the returned cart.
                if (oldCart && oldCart.shippingAddress) {
                    cart.shippingAddress = oldCart.shippingAddress
                }

                // Have not found a way to retrieve selectedShippingMethodId from the backend. so lets persist it from the incoming cart parameter to the returned cart.
                if (oldCart && oldCart.selectedShippingMethodId) {
                    cart.selectedShippingMethodId = oldCart.selectedShippingMethodId
                }
                return cart
            })
    }

    /**
     * @inheritDoc
     */
    getCart(cartId) {
        if (!cartId) {
            throw new errors.InvalidArgumentError(`Parameter 'cartId' is required`)
        }

        const basePath = `${this.basePath}/rest/default/V1/${
            this.hasAuthorization() ? `carts/mine` : `guest-carts/${cartId}`
        }`

        const cartPromise = this.agent
            .get(`${basePath}`)
            .then(({body}) => this.parseCart({...body, id: cartId}))

        const itemsPromise = this.agent
            .get(`${basePath}/items`)
            .then(({body}) => body && body.map(this.parseCartItem))
            .catch(() => [])

        const paymentsPromise = this.agent
            .get(`${basePath}/selected-payment-method`)
            .then(({body}) => {
                return body.method ? [{id: 'mine', methodId: body.method}] : []
            })
            .catch(() => [])

        const totalsPromise = this.agent
            .get(`${basePath}/totals`)
            .then(({body}) => this.parseCartTotals(body))
            .catch(() => {
                throw new errors.ServerError(`Could not get cart totals`)
            })

        return Promise.all([cartPromise, itemsPromise, paymentsPromise, totalsPromise])
            .then(([cart, items, payments, totals]) => {
                // Apply payments, items, totals and payment amount to the cart.
                cart.payments = payments
                cart.items = items

                if (cart.payments && cart.payments.length > 0) {
                    cart.payments[0].amount = totals.total
                }

                return {
                    ...cart,
                    ...totals
                }
            })
            .catch(() => {
                throw new errors.ServerError(`Could not retrieve cart`)
            })
    }

    /**
     * Parse the cart money totals
     * totals not calculated until shipping address/method is set.
     */
    parseCartTotals(data) {
        return {
            couponEntries: data.coupon_code ? [this.parseCouponEntry(data)] : [],
            subtotal: data.subtotal,
            shipping: data.shipping_amount,
            discounts: data.discount_amount,
            tax: data.tax_amount,
            total: data.base_grand_total
        }
    }

    /**
     * @inheritDoc
     */
    deleteCart() {
        throw new errors.UnsupportedError('This function is not supported by the Magento API')
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

        // eslint-disable-next-line no-undef
        cartItem = transformCartItem(cartItem)
        cartItem.cartItem.quote_id = cart.id

        return (
            this.agent
                .post(
                    `${this.basePath}/rest/default/V1/${
                        this.hasAuthorization() ? 'carts/mine' : `guest-carts/${cart.id}`
                    }/items`
                )
                .send(cartItem)
                // Have not found a way to retrieve shippingAddress and selectedShippingMethodId from the backend and email is not saved in the backend for a guest user.
                // So lets persist these fields on the incoming cart parameter to the returned cart.
                .then(() => this.getCart(cart.id))
                .then((updatedCart) => ({
                    ...updatedCart,
                    shippingAddress: cart.shippingAddress,
                    customerInfo: cart.customerInfo,
                    selectedShippingMethodId: cart.selectedShippingMethodId
                }))
                .catch(() => {
                    throw new errors.ServerError('Could Not Add Cart Item')
                })
        )
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

        const cartItemId = cartItem.id
        // eslint-disable-next-line no-undef
        cartItem = transformCartItem(cartItem)
        cartItem.cartItem.quote_id = cart.id

        return (
            this.agent
                .put(
                    `${this.basePath}/rest/default/V1/${
                        this.hasAuthorization() ? 'carts/mine' : `guest-carts/${cart.id}`
                    }/items/${cartItemId}`
                )
                .send(cartItem)
                // Have not found a way to retrieve shippingAddress from the backend and email is not saved in the backend for a guest user.
                // So lets persist these fields on the incoming cart parameter to the returned cart.
                .then(() => this.getCart(cart.id))
                .then((updatedCart) => ({
                    ...updatedCart,
                    shippingAddress: cart.shippingAddress,
                    customerInfo: cart.customerInfo
                }))
                .catch(() => {
                    throw new errors.ServerError('Could Not Update Cart Item')
                })
        )
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

        return (
            this.agent
                .delete(
                    `${this.basePath}/rest/default/V1/${
                        this.hasAuthorization() ? 'carts/mine' : `guest-carts/${cart.id}`
                    }/items/${cartItemId}`
                )
                // Have not found a way to retrieve shippingAddress and selectedShippingMethodId from the backend and email is not saved in the backend for a guest user.
                // So lets persist these fields on the incoming cart parameter to the returned cart.
                .then(() => this.getCart(cart.id))
                .then((updatedCart) => ({
                    ...updatedCart,
                    shippingAddress: cart.shippingAddress,
                    customerInfo: cart.customerInfo,
                    selectedShippingMethodId: cart.selectedShippingMethodId
                }))
                .catch(() => {
                    throw new errors.ServerError('Could Not Add Cart Item')
                })
        )
    }

    /**
     * This updates the given cart object with the given customerInformation object and returns it.
     * It will not persist in the backend until a payment is added.
     */
    setCustomerInformation(cart, customerInformation) {
        if (!cart) {
            throw new errors.InvalidArgumentError(`Parameter 'cart' is required`)
        }
        if (!customerInformation) {
            throw new errors.InvalidArgumentError(`Parameter 'customerInformation' is required`)
        }

        const cartCopy = JSON.parse(JSON.stringify(cart))
        cartCopy.customerInfo.email = customerInformation.email

        return Promise.resolve(cartCopy)
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

        const originalBillingAddress = {
            ...billingAddress,
            titleCode: undefined
        }
        // Transform Mobify schema into OCAPI schema
        // eslint-disable-next-line no-undef
        billingAddress = transformOrderAddress(billingAddress)

        return this.agent
            .post(
                `${this.basePath}/rest/default/V1/${
                    this.hasAuthorization() ? 'carts/mine' : `guest-carts/${cart.id}`
                }/billing-address`
            )
            .send({address: billingAddress})
            .then(() => {
                return {
                    ...cart,
                    billingAddress: originalBillingAddress
                }
            })
            .catch(() => {
                throw new errors.ServerError('Could Not Set Billing Address')
            })
    }

    /**
     * @inheritDoc
     */
    getShippingMethods(cart) {
        if (!cart) {
            throw new errors.InvalidArgumentError(`Parameter 'cart' is required`)
        }
        if (!cart.shippingAddress) {
            throw new errors.InvalidArgumentError(`Parameter 'cart.shippingAddress' is required`)
        }

        const hasItems = cart.items && cart.items.length
        if (!hasItems) {
            console.warn(`You must first add items to your cart to get valid shipping methods`)
        }

        const shippingAddress = transformOrderAddress(cart.shippingAddress)

        return this.agent
            .post(
                `${this.basePath}/rest/default/V1/${
                    this.hasAuthorization() ? 'carts/mine' : `guest-carts/${cart.id}`
                }/estimate-shipping-methods`
            )
            .send({
                address: shippingAddress
            })
            .then(({body = []}) => body.map(this.parseShippingMethod))
            .catch(() => {
                throw new errors.ServerError('Could Not Get Shipping Methods')
            })
    }

    /**
     * @private
     */
    setShippingInformation(cart, shippingAddress, shippingMethod) {
        // Set the shipping method id on the cart. We do this because we can't get
        // shipping information back from the server. If we figure out how to do this
        // we can remove this line.
        cart.selectedShippingMethodId = shippingMethod.id

        // Transform the shipping address and method into objects that the server
        // will understand.
        shippingAddress = transformOrderAddress(shippingAddress)
        shippingMethod = transformShippingMethod(shippingMethod)

        // Append the customer email to the shipping address if we have one.
        if (cart.customerInfo && cart.customerInfo.email) {
            shippingAddress.email = cart.customerInfo.email
        }

        return this.agent
            .post(
                `${this.basePath}/rest/default/V1/${
                    this.hasAuthorization() ? 'carts/mine' : `guest-carts/${cart.id}`
                }/shipping-information`
            )
            .send({
                addressInformation: {
                    shippingMethodCode: shippingMethod.carrier_code,
                    shippingCarrierCode: shippingMethod.carrier_code,
                    shipping_address: shippingAddress
                }
            })
            .then(({body}) => {
                const totals = this.parseCartTotals(body.totals)

                if (cart.payments && cart.payments.length > 0) {
                    cart.payments[0].amount = totals.total
                }

                return {
                    ...cart,
                    ...totals
                }
            })
            .catch(() => {
                throw new errors.ServerError('Could Not Set Shipping Information')
            })
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
        if (!cart.shippingAddress) {
            throw new errors.InvalidArgumentError(
                `Shipping Address must be set prior to setting shipping method`
            )
        }

        return this.setShippingInformation(cart, cart.shippingAddress, shippingMethod)
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
        shippingAddress.titleCode = undefined

        const {shippingMethods, selectedShippingMethod} = cart

        // If we don't have the shipping methods set, fake it, and return the cart with the
        // shipping address merged in.
        if (!shippingMethods) {
            return Promise.resolve({
                ...cart,
                shippingAddress
            })
        }

        return this.setShippingInformation(
            cart,
            shippingAddress,
            selectedShippingMethod || shippingMethods[0]
        )
    }

    /**
     * @inheritDoc
     */
    getPaymentMethods(cart) {
        if (!cart) {
            throw new errors.InvalidArgumentError(`Parameter 'cart' is required`)
        }

        return this.agent
            .get(
                `${this.basePath}/rest/default/V1/${
                    this.hasAuthorization() ? 'carts/mine' : `guest-carts/${cart.id}`
                }/payment-methods`
            )
            .then(({body = []}) => body.map(this.parsePaymentMethod))
            .catch(() => {
                throw new errors.ServerError('Could not get payment methods')
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
        if (!payment.methodId) {
            throw new errors.InvalidArgumentError(
                `Payment methodId address on parameter 'payment' is required`
            )
        }
        if (!cart.customerInfo.email) {
            throw new errors.InvalidArgumentError(`Email on cart is required`)
        }
        if (!cart.billingAddress) {
            throw new errors.InvalidArgumentError(`Billing address on cart is required`)
        }
        if (!cart.shippingAddress) {
            throw new errors.InvalidArgumentError(`Shipping address on cart is required`)
        }

        const billingAddress = transformOrderAddress(cart.billingAddress)
        const paymentInformation = {
            paymentMethod: {
                method: payment.methodId
            },
            billingAddress,
            email: cart.customerInfo.email
        }

        const basePath = `${this.basePath}/rest/default/V1/${
            this.hasAuthorization() ? 'carts/mine' : `guest-carts/${cart.id}`
        }`

        return (
            this.agent
                .post(`${basePath}/set-payment-information`)
                .send(paymentInformation)
                // Have not found a way to retrieve shippingAddress and selectedShippingMethodId from the backend and email is not saved in the backend for a guest user.
                // So lets persist these fields on the incoming cart parameter to the returned cart.
                .then(() => this.getCart(cart.id))
                .then((updatedCart) => ({
                    ...updatedCart,
                    shippingAddress: cart.shippingAddress,
                    customerInfo: cart.customerInfo,
                    selectedShippingMethodId: cart.selectedShippingMethodId
                }))
                .catch(() => {
                    throw new errors.ServerError('Could not set payment')
                })
        )
    }

    /**
     * @inheritDoc
     */
    getStore(id) {
        const storesBasePath = this.basePath.replace('www', 'locations')
        const url = `${storesBasePath}/${id}.html?utm_source=storelocator`
        return this.agent
            .get(url)
            .then((res) => this.buildDocument(res))
            .then((htmlDoc) => this.parseGetStore(htmlDoc))
            .then((data) => ({...data, id}))
    }

    /**
     * @inheritDoc
     */
    getCategory(id) {
        // Always request the basePath for getting all categories
        return this.agent
            .get(this.basePath)
            .then((res) => this.buildDocument(res))
            .then((htmlDoc) => {
                let category

                if (id === ROOT_CATEGORY) {
                    const categoryEls = [...htmlDoc.querySelectorAll('.navigation a')].map(
                        (el) => el.parentElement
                    )
                    const categories = categoryEls.map(this.parseCategory)

                    category = {
                        id: ROOT_CATEGORY,
                        name: 'Categories',
                        categories
                    }
                } else {
                    const categoryAnchorEl = htmlDoc.querySelector(`.navigation a[href*="${id}"]`)
                    if (!categoryAnchorEl) {
                        throw new Error('Category Not Found')
                    }
                    category = this.parseCategory(categoryAnchorEl.parentElement)
                }
                return category
            })
    }

    /**
     * @inheritDoc
     */
    getCategories(ids = []) {
        const getCategoryPromises = ids.map((id) => this.getCategory(id).catch(() => null))

        return Promise.all(getCategoryPromises).then((categories) => {
            const validCategories = categories.filter((category) => !!category)

            return {
                count: validCategories.length,
                data: validCategories,
                total: validCategories.length
            }
        })
    }

    /**
     * Takes a html element that represents a category and parses it into a commerce-integrations
     * Category type.
     *
     * @param {Object} htmlDoc a {@link https://developer.mozilla.org/en-US/docs/Web/API/Element|Element} object
     *
     * @returns {Promise<module:@mobify/commerce-integrations/dist/types.Category>}
     */
    parseCategory(categoryEl) {
        const anchorEl = categoryEl.querySelector('a')
        const idMatch = anchorEl.pathname.match(/[^\\](\w+).html$/)

        return {
            id: idMatch && idMatch[1],
            name: anchorEl.textContent
        }
    }

    /**
     * Takes commerce-integrations ProductSearchRequest type and returns the URL
     * representation used to query the website.
     *
     * @param {module:@mobify/commerce-integrations/dist/types.ProductSearchRequest} productSearchRequest
     *
     * @returns {String}
     */
    getSearchUrl({count, sort, start, total, query, filters = {}}) {
        const params = []
        const pathname = query ? '/catalogsearch/result/' : `/${filters.categoryId}.html`

        if (count) {
            params.push(`product_list_limit=${count}`)
        }
        if (total) {
            params.push(`product_list_total=${total}`)
        }
        if (sort) {
            params.push(`product_list_order=${sort}`)
        }
        if (start) {
            params.push(`p=${Math.ceil(total / start)}`)
        }
        if (query) {
            params.push(`q=${query}`)
        }

        // Compose the filters part of the url
        Object.keys(filters)
            .filter((key) => !['categoryId'].includes(key))
            .forEach((key) => {
                params.push(`${key}=${filters[key]}`)
            })

        return `${pathname}?${params.sort().join('&')}`
    }

    /**
     * Takes a dom element representing a merlins search result product tile and parses out an
     * commerce-integrations ProductSearchResult type.
     *
     * @param {Object} productEl a {@link https://developer.mozilla.org/en-US/docs/Web/API/Element|Element} object
     *
     * @returns {module:@mobify/commerce-integrations/dist/types.ProductSearchResult}
     */
    parseProductSearchResult(productEl) {
        const linkEl = productEl.querySelector('.product-item-link')
        const imageEl = productEl.querySelector('.product-image-photo')
        const priceEl = productEl.querySelector('.price')
        const stockEl = productEl.querySelector('.stock')

        const productName = linkEl.textContent
        const productIdMatch = linkEl.href.match(/([^/]+).html$/)
        const productId = productIdMatch
            ? titleCase(productIdMatch[1].replace(/-/g, ' '))
            : undefined
        const available = !stockEl

        let price
        if (available) {
            const priceMatch = priceEl.textContent.match(/\$(.+)/)
            price = priceMatch ? parseFloat(priceEl.textContent.match(/\$(.+)/)[1]) : ''
        } else {
            price = -1 // Something obviously invalid
        }

        const image = {
            alt: imageEl.getAttribute('alt'),
            description: imageEl.getAttribute('alt'),
            src: imageEl.getAttribute('src'),
            title: imageEl.getAttribute('alt')
        }

        return {
            available,
            productId,
            productName,
            defaultImage: image,
            price,
            variationProperties: []
        }
    }

    /**
     * Takes a dom element representing a merlins sorting select and parses out an
     * array od commerce-integrations SortOption type.
     *
     * @param {Object} sortEl a {@link https://developer.mozilla.org/en-US/docs/Web/API/Element|Element} object
     *
     * @returns {Array.<module:@mobify/commerce-integrations/dist/types.SortOption>}
     */
    parseSortingOptions(sortEl) {
        const optionEls = sortEl.querySelectorAll('option')
        return [...optionEls].map((el) => ({
            id: el.value,
            label: el.innerHTML
        }))
    }

    /**
     * Takes a dom element representing a merlins filter and parses out an
     * commerce-integrations Filter type.
     *
     * @param {Object} optionEl a {@link https://developer.mozilla.org/en-US/docs/Web/API/Element|Element} object
     *
     * @returns {module:@mobify/commerce-integrations/dist/types.Filter}
     */
    parseFilter(optionEl) {
        const label = optionEl.querySelector('.filter-options-title').textContent
        const propertyId = label.toLowerCase()

        const valueEls = optionEl.querySelectorAll('.items .item')
        const values = [...valueEls].map((valueEl) => {
            const countEl = valueEl.querySelector('.count')
            const anchorEl = valueEl.querySelector('a')

            // Parse out the count and then remove the element so we can get the label text.
            const count = parseInt(countEl.textContent)
            countEl.remove()

            return {
                count,
                label: anchorEl.textContent.trim(),
                value: anchorEl.search.match(/\w=([^&]+)/)[1]
            }
        })

        return {
            propertyId,
            label,
            values
        }
    }

    /**
     * Takes a dom element representing a merlins selected filter and parses out a
     * commerce-integrations Filter type.
     *
     * @param {Object} selectedEl a {@link https://developer.mozilla.org/en-US/docs/Web/API/Element|Element} object
     * @param {String} currentUrl The current page url used to help determine filter values.
     *
     * @returns {module:@mobify/commerce-integrations/dist/types.Filter}
     */
    parseSelectedFilter(selectedEl, currentUrl) {
        // Use an anchor to parse out the search string
        const anchorEl = this.window.document.createElement('a')
        anchorEl.href = currentUrl

        const label = selectedEl.querySelector('.filter-label').textContent
        const propertyId = label.toLowerCase()

        const valueLabel = selectedEl.querySelector('.filter-value').textContent
        const valueValue = anchorEl.search.match(new RegExp(`${propertyId}=([^&]+)`))[1]

        return {
            propertyId,
            label,
            values: [
                {
                    label: valueLabel,
                    value: valueValue
                }
            ]
        }
    }

    /**
     * Takes a dom element and parses out an array of commerce-integrations
     * Filter type representing those filters that are selected.
     *
     * @param {Object} selectedFiltersEl a {@link https://developer.mozilla.org/en-US/docs/Web/API/Element|Element} object
     * @param {String} currentUrl The current page url used to help determine filter values.
     *
     * @returns {Array.<module:@mobify/commerce-integrations/dist/types.Filter>}
     */
    parseSelectedFilters(selectedFiltersEl, currentUrl) {
        const selectedEls = selectedFiltersEl.querySelectorAll('.items .item')
        return [...selectedEls].map((el) => this.parseSelectedFilter(el, currentUrl))
    }

    /**
     * Takes a dom element and parses out an array of commerce-integrations
     * Filter type.
     *
     * @param {Object} filterOptionsEl a {@link https://developer.mozilla.org/en-US/docs/Web/API/Element|Element} object
     * @param {String} currentUrl The current page url used to help determine filter values.
     *
     * @returns {Array.<module:@mobify/commerce-integrations/dist/types.Filter>}
     */
    parseFilters(filterOptionsEl, currentUrl) {
        // Note: Merlin's Potion's is unique in the way that it handles filters, normally
        // you'd see checkboxes of all the filters with those that are selected being filled
        // in. That makes it easy to parse. But in this case they are split up in two sections,
        // one is the filters that aren't selected and a list of links, and the other is a
        // section of selected filters with it's value.
        // we'll have to parse these both to get as close to a complete list of all the filters.
        const optionsEls = filterOptionsEl.querySelectorAll('.filter-options-item')
        return [...optionsEls].map((el) => this.parseFilter(el, currentUrl))
    }

    /**
     * @inheritDoc
     */
    parseSearchProducts(htmlDoc, searchRequest) {
        const {filters, query} = searchRequest

        // Parse get the mainContent element and any product elements in it.
        const mainContent = htmlDoc.getElementById('maincontent')
        const resultEls = mainContent.querySelectorAll('.products.product-items > .product-item')

        const is404 = htmlDoc.title === '404 Not Found'
        const isEmpty = !resultEls.length

        if (is404 || isEmpty) {
            return {
                count: 0,
                filters: [],
                results: [],
                query,
                selectedFilters: filters,
                sortingOptions: [],
                start: 0,
                total: 0
            }
        }

        // This is the current url of the page, it'll be used to get filter values, etc.
        const currentUrl = JSON.parse(
            htmlDoc.querySelector('.toolbar-products').getAttribute('data-mage-init')
        ).productListToolbarForm.url

        // Parse other page information from document.
        const pageSize = parseInt(mainContent.querySelector('#limiter').value)
        const pageEl = mainContent.querySelector('.pages .current span:last-child')
        const page = pageEl ? parseInt(pageEl.textContent) - 1 : 0

        const filterOptionsEl = mainContent.querySelector('.filter-options')
        const selectedFiltersEl = mainContent.querySelector('.filter-current')

        const filterOptions = filterOptionsEl ? this.parseFilters(filterOptionsEl, currentUrl) : []
        const selectedFilters = selectedFiltersEl
            ? this.parseSelectedFilters(selectedFiltersEl, currentUrl)
            : []

        const sortEl = mainContent.querySelector('#sorter')
        const totalEl = mainContent.querySelector('#toolbar-amount .toolbar-number')

        return {
            count: resultEls.length,
            query: htmlDoc.querySelector('#search').value || query,
            filters: [...filterOptions, ...selectedFilters],
            results: [...resultEls].map(this.parseProductSearchResult),
            selectedFilters: selectedFilters.reduce((obj, curr) => {
                obj[curr.propertyId] = curr.values[0].value
                return obj
            }, {}),
            selectedSortingOption: sortEl ? sortEl.value : '',
            sortingOptions: sortEl ? this.parseSortingOptions(sortEl) : [],
            start: page * pageSize,
            total: totalEl ? parseInt(totalEl.textContent) : 0
        }
    }

    /**
     * @inheritDoc
     */
    searchStores(storeSearchRequest) {
        let count = storeSearchRequest.count > 0 ? storeSearchRequest.count : 20
        const start = storeSearchRequest.start > 0 ? storeSearchRequest.start : 0
        const latitude = storeSearchRequest.latlon.latitude
        const longitude = storeSearchRequest.latlon.longitude
        let total
        if (isNaN(latitude) || isNaN(longitude)) {
            throw new Error('Provide Latitude and Longitude coordinates')
        }

        const getStoresUrl = `${this.dondeApiBasePath}/near?center=${latitude},${longitude}&dondeKey=56c3681586312e000e000001&_=1527268304391`
        return this.agent
            .get(getStoresUrl)
            .then((res) => res.body)
            .then((jsonRes) => {
                total = jsonRes.length
                const stores = jsonRes.map((store) => {
                    const storeId = store.llp_url.replace('.html', '').substring(1)
                    return this.getStore(storeId).then((data) => {
                        return data
                    })
                })
                return Promise.all(stores).then((stores) => {
                    let storesToReturn
                    const totalPages = Math.ceil(total / count)
                    if (totalPages === start + 1) {
                        // on last page
                        const remainder = total % count
                        if (remainder > 0) {
                            count = remainder
                        }
                        storesToReturn = stores.slice(stores.length - remainder)
                    } else if (totalPages < start + 1) {
                        throw new Error('No stores found')
                    } else {
                        // middle pages
                        storesToReturn = stores.slice(start * count, (start + 1) * count)
                    }

                    return {
                        count,
                        start,
                        total,
                        stores: storesToReturn
                    }
                })
            })
    }

    /**
     * @inheritDoc
     */
    parseOrder(htmlDoc, id) {
        const status = htmlDoc.querySelector('.order-status').textContent
        const creationDateText = htmlDoc.querySelector('.order-date date').textContent
        const creationDate = new Date(creationDateText)

        // Order Items and Totals
        const orderItemsEl = htmlDoc.getElementById('my-orders-table')

        // Shipping/Billing Addresses
        const shippingAddressEl = htmlDoc.querySelector('.box-order-shipping-address address')
        const billingAddressEl = htmlDoc.querySelector('.box-order-billing-address address')

        // Parse various sub units of order information.
        const parseElPrice = (el) => parseFloat(el.textContent.slice(1))
        const totals = {
            discounts: 0, // TODO: This will be completed when we add coupons to the API.
            shipping: parseElPrice(orderItemsEl.querySelector('.shipping .price')),
            subtotal: parseElPrice(orderItemsEl.querySelector('.subtotal .price')),
            tax: parseElPrice(orderItemsEl.querySelector('.totals-tax .price')),
            total: parseElPrice(orderItemsEl.querySelector('.grand_total .price'))
        }

        const parseItem = (itemEl) => ({
            id: itemEl.querySelector('.sku').textContent.trim(),
            productId: itemEl.querySelector('.sku').textContent.trim(),
            productName: itemEl.querySelector('.sku').textContent.trim(),
            baseItemPrice: parseElPrice(itemEl.querySelector('.price .price')),
            baseLinePrice: parseElPrice(itemEl.querySelector('.subtotal .price')),
            itemPrice: parseElPrice(itemEl.querySelector('.price .price')),
            linePrice: parseElPrice(itemEl.querySelector('.subtotal .price')),
            quantity: parseInt(itemEl.querySelector('.qty .content').textContent.trim())
        })

        const itemsEls = orderItemsEl.querySelectorAll('tbody tr')
        const items = itemsEls && [...itemsEls].map(parseItem)

        const shippingAddressParts = shippingAddressEl && shippingAddressEl.textContent.split('\n')
        const shippingAddress = shippingAddressParts && {
            firstName: shippingAddressParts[0].split(' ')[0],
            lastName: shippingAddressParts[0].split(' ')[1],
            phone: shippingAddressParts[8].replace('T: ', ''),
            addressLine1: shippingAddressParts[2],
            addressLine2: shippingAddressParts[3],
            city: shippingAddressParts[6].split(',')[0],
            countryCode: shippingAddressParts[7],
            stateCode: shippingAddressParts[6].split(',')[1],
            postalCode: shippingAddressParts[6].split(', ')[2]
        }

        // NOTE: Known issue, we can't get the proper code for country and state, only the
        // values.
        const billingAddressParts = billingAddressEl && billingAddressEl.textContent.split('\n')
        const billingAddress = billingAddressParts && {
            firstName: billingAddressParts[0].split(' ')[0],
            lastName: billingAddressParts[0].split(' ')[1],
            phone: billingAddressParts[8].replace('T: ', ''),
            addressLine1: billingAddressParts[2],
            addressLine2: billingAddressParts[3],
            city: billingAddressParts[6].split(',')[0],
            countryCode: billingAddressParts[7], // NOTE: Should be a code not a value.
            stateCode: billingAddressParts[6].split(',')[1], // NOTE: Should be a code not a value.
            postalCode: billingAddressParts[6].split(', ')[2]
        }

        // Create a fake payment method id to allow correct mapping of the payment name
        const payments = [{id: 'mine', amount: totals.total, methodId: 'checkmo'}]

        // Create a fake shipping method id to allow correct mapping of the shipping name
        const selectedShippingMethodId = 'mine'

        return {
            id,
            billingAddress,
            creationDate,
            items,
            status,
            payments,
            selectedShippingMethodId,
            shippingAddress,
            ...totals
        }
    }

    /**
     * @inheritDoc
     */
    // eslint-disable-next-line no-unused-vars
    createOrder(cart, opts = {}) {
        if (!cart) {
            throw new errors.InvalidArgumentError(`Parameter 'cart' is required`)
        }

        const paymentMethod = {
            method: cart.payments[0].methodId
        }

        return this.agent
            .put(
                `${this.basePath}/rest/default/V1/${
                    this.hasAuthorization() ? 'carts/mine' : `guest-carts/${cart.id}`
                }/order`
            )
            .send(paymentMethod)
            .then((res) => ({
                ...cart,
                id: res.body,
                creationDate: new Date(),
                status: 'Pending'
            }))
    }

    /**
     * @inheritDoc
     */
    // eslint-disable-next-line no-unused-vars
    getOrder(id, opts = {}) {
        const url = `${this.basePath}/sales/order/view/order_id/${id}/`

        return this.agent
            .get(url)
            .then((res) => this.buildDocument(res))
            .then((htmlDoc) => {
                const isLoginPage = !!htmlDoc.querySelector('body.customer-account-login')
                const isHistoryPage = !!htmlDoc.querySelector('body.sales-order-history')

                // If we were redirected to the account order history page, it means that
                // you need to log in to see this order.
                if (isLoginPage) {
                    throw new errors.NotAuthenticatedError()
                }

                // If we were redirected to the account order history page, it means that
                // the order we were looking for wasn't found.
                if (isHistoryPage) {
                    throw new errors.NotFoundError('Order Not Found')
                }

                return htmlDoc
            })
            .then((htmlDoc) => this.parseOrder(htmlDoc, id))
    }

    /**
     * @inheritDoc
     */
    // eslint-disable-next-line no-unused-vars
    getOrders(ids, opts = {}) {
        const getOrderPromises = ids.map((id) => this.getOrder(id).catch(() => undefined))
        return Promise.all(getOrderPromises).then((orders) => {
            const validOrders = orders.filter((product) => !!product)
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

        return this.agent
            .put(
                `${this.basePath}/rest/default/V1/${
                    this.hasAuthorization() ? 'carts/mine' : `guest-carts/${cart.id}`
                }/coupons/${couponCode}`
            )
            .then(() => this.getCart(cart.id))
            .catch(() => {
                throw new errors.ServerError('Could Not Add Coupon')
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

        // Transform coupon into something the server understands.
        const coupon = {
            coupon_item_id: couponEntryId
        }

        return this.agent
            .delete(
                `${this.basePath}/rest/default/V1/${
                    this.hasAuthorization() ? 'carts/mine' : `guest-carts/${cart.id}`
                }/coupons`
            )
            .send(coupon)
            .then(() => this.getCart(cart.id))
            .catch(() => {
                throw new errors.ServerError('Could Not Remove Coupon')
            })
    }
}
