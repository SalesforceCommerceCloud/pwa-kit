/** @module */

import * as hybris from 'hybris-occ-client'
import * as errors from '../errors'
import superagent from 'superagent'
import URL from 'url-parse'

const clone = (x) => JSON.parse(JSON.stringify(x))

/**
 * A connector for the Hybris API.
 *
 * @implements {module:connectors/interfaces.CommerceConnector}
 * @implements {module:connectors/interfaces.ParserHooks}
 */
export class HybrisConnector {
    constructor({client, catalogId, catalogVersionId, authentication}) {
        this.client = client
        this.catalogId = catalogId
        this.catalogVersionId = catalogVersionId
        this.authentication = authentication
    }

    static fromConfig(config) {
        return new this.prototype.constructor({
            client: new hybris.ApiClient(config.clientConfig),
            catalogId: config.catalogId,
            catalogVersionId: config.catalogVersionId,
            authentication: config.authentication
        })
    }

    absoluteURL(path) {
        return new URL(path, this.client.basePath || '').href
    }

    /**
     * Register a new customer account and login.
     *
     * @param {module:types/HybrisCustomerRegistration} data
     * @return {Promise<module:types/Customer>}
     */
    registerCustomer(data) {
        const api = new hybris.UsersApi(this.client)
        return api
            .postUsers({
                firstName: data.firstName,
                lastName: data.lastName,
                password: data.password,
                titleCode: data.titleCode,
                uid: data.email // Must be an email
            })
            .then(() => this.login(data.email, data.password))
    }

    /**
     * @inheritDoc
     */
    login(username, password) {
        const isRegisteredUser = username && password
        const auth = this.authentication
        const body = {
            client_id: auth.clientId,
            client_secret: auth.clientSecret,
            grant_type: 'client_credentials'
        }
        if (isRegisteredUser) {
            Object.assign(body, {
                grant_type: 'password',
                username,
                password
            })
        }

        return superagent
            .post(auth.authorizationUrl)
            .set('Content-Type', 'application/x-www-form-urlencoded')
            .send(body)
            .then((res) => {
                const updatedAuth = {
                    accessToken: res.body.access_token,
                    expiresIn: res.body.expires_in,
                    refreshToken: res.body.refresh_token
                }
                Object.assign(this.client.authentications.auth, updatedAuth)
                return isRegisteredUser
                    ? this.getCustomer('current')
                    : this.getCustomer('anonymous')
            })
            .catch(() => {
                throw new errors.ForbiddenError('Login failed')
            })
    }

    /**
     * @inheritDoc
     */
    logout() {
        const invalidatedAuth = {
            accessToken: undefined,
            expiresIn: undefined,
            refreshToken: undefined
        }
        Object.assign(this.client.authentications.auth, invalidatedAuth)
        return Promise.resolve(undefined)
    }

    /**
     * @inheritDoc
     */
    refreshSession() {
        const refreshToken = this.client.authentications.auth.refreshToken
        const grantType = refreshToken ? 'refresh_token' : 'client_credentials'

        const auth = this.authentication
        const body = {
            client_id: auth.clientId,
            client_secret: auth.clientSecret,
            grant_type: grantType,
            refresh_token: refreshToken
        }

        return superagent
            .post(auth.authorizationUrl)
            .set('Content-Type', 'application/x-www-form-urlencoded')
            .send(body)
            .then((res) => {
                const newAuth = {
                    accessToken: res.body.access_token,
                    expiresIn: res.body.expires_in,
                    refreshToken: res.body.refresh_token
                }
                Object.assign(this.client.authentications.auth, newAuth)
                return refreshToken ? this.getCustomer('current') : this.getCustomer('anonymous')
            })
            .catch(() => {
                throw new errors.ForbiddenError('Failed To Refresh Session')
            })
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
     * Get current authentications object, which can be used to
     * save/restore auth state, eg. for server-side usage.
     *
     * @return {Object}
     */
    getAuthentications() {
        return clone(this.client.authentications)
    }

    /**
     * Set the current authentications object, as returned from getAuthentications.
     * Use to save/restore auth state, eg. for server-side usage.
     *
     * @param {Object} authentications
     */
    setAuthentications(authentications) {
        this.client.authentications = clone(authentications)
    }

    /**
     * @inheritDoc
     */
    getCustomer(id, opts = {}) {
        const api = new hybris.UsersApi(this.client)
        return api.getUser(id, {fields: 'FULL', ...opts}).then((res) => this.parseCustomer(res))
    }

    /**
     * @inheritDoc
     */
    parseCustomer(data) {
        // Hybris validates that uid is an email for registered users.
        const d = data
        const isAnon = d.uid === 'anonymous'
        const anonEmail = d.defaultAddress ? d.defaultAddress.email : undefined
        return {
            id: isAnon ? 'anonymous' : 'current',
            firstName: d.firstName,
            lastName: d.lastName,
            email: isAnon ? anonEmail : d.uid
        }
    }

    /**
     * @inheritDoc
     */
    searchProducts(query, opts = {}) {
        const searchRequest = this.transformSearchParams(query)
        const api = new hybris.ProductsApi(this.client)

        return api
            .getProductSearch(searchRequest, opts)
            .then((data) => this.parseSearchProducts(data, query))
    }

    transformSearchParams(params) {
        const {query, count = 20, start = 0, sort = 'relevance', filters = {}} = params

        // Please refer to Hybris documentation for notes on the shape of the request object.
        // https://help.hybris.com/6.4.0/api/ycommercewebservices/main.html#_products_search_get
        return {
            query: []
                .concat(
                    ...[
                        query ? [`${query}:`] : [],
                        ['', sort],
                        Object.keys(filters)
                            .filter((key) => !['categoryId', 'query'].includes(key))
                            .filter((key) => Boolean(filters[key]))
                            .map((key) => `${key}:${filters[key]}`),
                        filters.categoryId ? [`allCategories:${filters.categoryId}`] : []
                    ]
                )
                .join(':'),
            pageSize: count,
            currentPage: start / count,
            sort,
            fields: 'FULL'
        }
    }

    parseFilterValue({count, name, query}) {
        // Parse query string to get filter value.
        const value = query.query.value.split(':').slice(-1)[0]

        return {
            count,
            label: name,
            value
        }
    }

    parseFilter({name, values}) {
        // Get the filter identifier from the first values query string. There should
        // always be a value or else the filter wouldn't be listed, but to be sure
        // return undefiend if there isn't one.
        let filterId
        const firstValue = values[0]

        if (firstValue) {
            // Parse query string to get filter identifier.
            filterId = firstValue.query.query.value.split(':').slice(-2)[0]
        }

        return {
            id: filterId,
            label: name,
            values: values.map(this.parseFilterValue.bind(this))
        }
    }

    parseSearchProducts(data) {
        const {
            products = [],
            sorts = [],
            pagination,
            freeTextSearch,
            facets = [],
            breadcrumbs = []
        } = data

        const getFilterCrumbs = () => {
            const selectedFilterVals = [].concat(
                ...facets.map((filter) => filter.values.filter((f) => f.selected))
            )

            const selectedBreadcrumbs = [].concat(
                ...selectedFilterVals.map((fv) =>
                    breadcrumbs.filter((bc) => bc.facetValueName === fv.name)
                )
            )

            const allCatsCrumb = breadcrumbs.find((bc) => bc.facetCode === 'allCategories')

            allCatsCrumb && selectedBreadcrumbs.push(allCatsCrumb)
            return selectedBreadcrumbs
        }

        return {
            results: products.map(({stock = {}, images = [], ...product}) => ({
                available: stock.stockLevelStatus === 'inStock',
                productId: product.code,
                productName: product.name,
                link: product.url,
                defaultImage: images[0] && {
                    alt: product.name,
                    src: this.absoluteURL(images[0].url)
                },
                price: product.price.value
            })),
            query: freeTextSearch,
            count: pagination.pageSize,
            start: pagination.currentPage * pagination.pageSize,
            total: pagination.totalResults,
            filters: facets.map(this.parseFilter.bind(this)),
            selectedFilters: getFilterCrumbs().reduce((obj, curr) => {
                obj[curr.facetCode] = curr.facetValueCode
                return obj
            }, {}),
            sortingOptions: sorts.map(({code, name}) => ({
                id: code,
                label: name
            })),
            selectedSortingOption: pagination.sort
        }
    }

    /**
     * @inheritDoc
     */
    getCategory(id, options = {}) {
        const api = new hybris.CatalogsApi(this.client)
        return api
            .getCategory(this.catalogId, this.catalogVersionId, id, options)
            .then((data) => this.parseCategory(data))
    }

    /**
     * @inheritDoc
     */
    getCategories(ids, options = {}) {
        const getCategoryPromises = ids.map((id) => this.getCategory(id, options).catch(() => null))

        return Promise.all(getCategoryPromises).then((categories) => {
            const validCategories = categories.filter((category) => !!category)

            return {
                data: validCategories,
                count: Object.keys(categories).length,
                total: ids.length
            }
        })
    }

    /**
     * Takes an array of OCAPI Category objects and parses it into an
     * commerce-integrations Category type.
     * @param {Object[]} categories an array of OCAPI {@link https://mobify.github.io/hybris-occ-client/module-models_CategoryHierarchy.html|Category} document
     *
     * @returns {Promise<module:types.Category>}
     */
    /* eslint-disable camelcase */
    parseCategories(categories) {
        const parsedCategories = []

        categories.forEach((category) => parsedCategories.push(this.parseCategory(category)))

        return parsedCategories
    }

    /**
     * Takes an OCAPI Category objects and parses it into an
     * commerce-integrations Category type.
     * @param {Object[]} categories an OCAPI {@link https://mobify.github.io/hybris-occ-client/module-models_CategoryHierarchy.html|Category} document
     *
     * @returns {Promise<module:types.Category>}
     */
    parseCategory({id, name, subcategories}) {
        const category = {
            id,
            name
        }

        if (subcategories) {
            category.categories = this.parseCategories(subcategories)
        }

        return category
    }

    /**
     * @inheritDoc
     */
    getProduct(id, opts = {}) {
        let options = {}

        const api = new hybris.ProductsApi(this.client)
        const defaultOptions = {
            fields: 'FULL'
        }

        // Assign options to new object. This allows the user to override
        // the defaults we set.
        options = {
            ...defaultOptions,
            ...opts
        }

        // Get the base product by creating a promise chain recursively.
        const productCache = []
        const getBaseProduct = (id, options) =>
            api.getProduct(id, options).then((product) => {
                const {baseProduct} = product

                // Maintain a cache of all products requested in this command.
                // It will be used lated to de-dup any fetches.
                productCache.push(product)

                return baseProduct ? getBaseProduct(baseProduct, options) : product
            })

        return getBaseProduct(id, options)
            .then((baseProduct) => {
                // Overwrite the base product id with the id we initiality requested so it's parsed
                // out correctly later on.
                baseProduct.code = id

                return Promise.all(
                    (baseProduct.variantOptions || []).map((variantOption) => {
                        // Search product cache and return products already fetched.
                        const cachedProduct = productCache.find(
                            ({code}) => code === variantOption.code
                        )

                        return cachedProduct || api.getProduct(variantOption.code, options)
                    })
                ).then((variations) => ({baseProduct, variations}))
            })
            .then(({baseProduct, variations}) => this.parseProduct(baseProduct, variations))
            .then((parsedProduct) => {
                // Get the variation values from the first product requested.
                const {baseOptions = []} = productCache[0]
                const {selected = {}} = baseOptions[0] || {}
                const {variantOptionQualifiers = []} = selected
                const variationValues = variantOptionQualifiers.reduce(
                    (acc, {qualifier, value}) => ({
                        ...acc,
                        [qualifier]: value
                    }),
                    {}
                )

                // Set the products values.
                parsedProduct.variationValues = variationValues

                return parsedProduct
            })
            .catch(() => {
                throw new errors.NotFoundError('Product Not Found')
            })
    }

    /**
     * @inheritDoc
     */
    getProducts(ids, opts = {}) {
        if (!ids || ids.length <= 0) {
            throw new Error('Please specify list of product ids to get.')
        }

        const getProductPromises = ids.map((id) => this.getProduct(id, opts).catch(() => null))

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
     * Takes a OCAPI ImageGroup object and parses it into a commerce-integrations ImageSet type.
     * @param {Object} data a OCAPI {@link https://documentation.demandware.com/DOC1/topic/com.demandware.dochelp/OCAPI/18.3/shop/Documents/ImageGroup.html|ImageGroup} document
     *
     * @returns {Promise<module:types.ImageSet>}
     */
    /* eslint-disable camelcase */
    parseImageSets(variation) {
        const {images, variantOptions} = variation
        const {variantOptionQualifiers} = variantOptions[0]

        const variationProperties = variantOptionQualifiers.map(({qualifier, name, value}) => ({
            id: qualifier,
            label: name,
            values: [
                {
                    name: value,
                    value
                }
            ]
        }))

        return ['zoom', 'product', 'thumbnail'].map((type) => ({
            images: images
                .filter((image) => image.format === type)
                .map(({altText, url}) => ({
                    alt: altText,
                    description: altText,
                    src: this.absoluteURL(url),
                    title: altText
                })),
            variationProperties,
            sizeType: type
        }))
    }
    /* eslint-enable camelcase */

    /**
     * Takes a OCC Product object and parses it into a commerce-integrations Product type.
     * @param {Object} data a OCC product document
     *
     * @returns {Promise<module:types.Product>}
     */
    /* eslint-disable camelcase */
    parseProduct({code, name, description, categories, price, variantOptions}, variations = []) {
        // Parse all the image sets. We'll use these in our return value as well
        // as for parsing property value images.
        let allImageSets = []
        variations.forEach((variation) => {
            allImageSets = [...allImageSets, ...this.parseImageSets(variation)]
        })

        const allVariantOptions = [
            ...variantOptions,
            ...variations.reduce((acc, {variantOptions}) => [...acc, ...variantOptions], [])
        ]

        const variationProperties = allVariantOptions
            .reduce((acc, variantOption) => [...acc, ...variantOption.variantOptionQualifiers], [])
            .reduce((acc, {qualifier, name, value}) => {
                const variationProperty = acc.find(
                    (variationOptionQualifier) => variationOptionQualifier.id === qualifier
                )

                // Lets get the first image of the correct type from the image sets.
                const variationImageSets = allImageSets.filter(({variationProperties}) =>
                    variationProperties.find(
                        ({id, values}) => id === qualifier && values[0].value === value
                    )
                )

                const filteredProductImageSets = variationImageSets.filter(
                    ({sizeType}) => sizeType === 'product'
                )

                const filteredThumbnailImageSets = variationImageSets.filter(
                    ({sizeType}) => sizeType === 'thumbnail'
                )

                if (variationProperty) {
                    const isNew = !variationProperty.values.find((v) => v.value === value)

                    if (isNew) {
                        variationProperty.values.push({
                            name: value,
                            value,
                            mainImage:
                                filteredProductImageSets.length &&
                                filteredProductImageSets[0].images[0],
                            swatchImage:
                                filteredThumbnailImageSets.length &&
                                filteredThumbnailImageSets[0].images[0]
                        })
                    }
                } else {
                    acc.push({
                        id: qualifier,
                        label: name,
                        values: [
                            {
                                name: value,
                                value,
                                mainImage:
                                    filteredProductImageSets.length &&
                                    filteredProductImageSets[0].images[0],
                                swatchImage:
                                    filteredThumbnailImageSets.length &&
                                    filteredThumbnailImageSets[0].images[0]
                            }
                        ]
                    })
                }

                return acc
            }, [])

        const allVariations = variations
            .map(({variantOptions}) =>
                variantOptions.map(({code, priceData, stock, variantOptionQualifiers}) => ({
                    id: code,
                    price: priceData.value,
                    orderable: stock.stockLevelStatus === 'inStock',
                    values: variantOptionQualifiers.reduce((acc, curr) => {
                        acc[curr.qualifier] = curr.value
                        return acc
                    }, {})
                }))
            )
            .reduce((acc, curr) => [...acc, ...curr], [])

        return {
            id: code,
            name,
            imageSets: allImageSets,
            description,
            categoryId: categories.length ? categories.pop().code : undefined,
            minimumOrderQuantity: 1,
            stepQuantity: 1,
            price: price.value,
            variations: allVariations,
            variationProperties
        }
    }
    /* eslint-enable camelcase */

    /**
     * @inheritDoc
     */
    getStore(id) {
        const api = new hybris.StoresApi(this.client)
        return api.getStore(id, {fields: 'FULL'}).then((data) => {
            return this.parseGetStore({...data, id})
        })
    }

    /**
     * Takes a OCCAPI WeekdayOpeningDay object and parses it into a commerce-integrations Store.hours type.
     * @param {Object} hours a OCCAPI {@link https://help.hybris.com/6.7.0/api/ycommercewebservices/index.html#_weekdayopeningdaywsdto|WeekdayOpneningDay} document
     *
     * @returns {Promise<module:types.Store.hours>}
     */
    parseOpeningHours(hours) {
        const parsedHours = {}

        hours.forEach((h) => {
            parsedHours[h.weekDay] = {
                openingTime: h.openingTime ? h.openingTime.formattedHour : undefined,
                closingTime: h.closingTime ? h.closingTime.formattedHour : undefined
            }
        })
        return parsedHours
    }

    /**
     * Takes a OCCAPI PointOfService object and parses it into a commerce-integrations Store type.
     * @param {Object} data a OCCAPI {@link https://help.hybris.com/6.7.0/api/ycommercewebservices/index.html#_pointofservicewsdto|PointOfService} document
     *
     * @returns {Promise<module:types.Store>}
     */
    parseGetStore(data) {
        const d = data
        const address = d.address
        return {
            addressLine1: address ? address.line1 : undefined,
            addressLine2: address ? address.line2 : undefined,
            city: address ? address.town : undefined,
            country: address && address.country ? address.country.isocode : undefined,
            description: d.description,
            features: d.features ? d.features.entry.map((feature) => feature.value) : undefined,
            email: address ? address.email : undefined,
            name: d.name,
            phone:
                address && address.phone
                    ? address.phone.replace(new RegExp('[(]|[)]|[.]|[ ]|[-]|[#]|[x]', 'g'), '')
                    : undefined,
            postalCode: address ? address.postalCode : undefined,
            hours: this.parseOpeningHours(d.openingHours.weekDayOpeningList),
            images: d.storeImages
                ? d.storeImages.map((image) => {
                      return {src: this.absoluteURL(image.url), alt: d.name}
                  })
                : undefined,
            id: d.id
        }
    }

    transformSearchStoreParams(searchParams) {
        const sp = searchParams
        const count = sp.count > 0 ? sp.count : 20
        const start = sp.start > 0 ? sp.start : 0
        return {
            pageSize: count.toString(),
            currentPage: start.toString(),
            sort: 'relevance',
            latitude: !isNaN(sp.latlon.latitude) ? sp.latlon.latitude.toString() : undefined,
            longitude: !isNaN(sp.latlon.longitude) ? sp.latlon.longitude.toString() : undefined,
            fields: 'FULL'
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

        const api = new hybris.StoresApi(this.client)
        const searchRequest = this.transformSearchStoreParams(storeSearchRequest)
        return api.getStores(searchRequest).then((data) => {
            if (data.stores.length <= 0) {
                throw new Error('No stores found')
            }
            return this.parseSearchStores(data)
        })
    }

    parseSearchStores(data) {
        const d = data

        let count
        const start = d.pagination.currentPage
        const total = d.pagination.totalResults
        const pageSize = d.pagination.pageSize
        const totalPages = d.pagination.totalPages
        if (totalPages === start + 1) {
            // on last page
            if (total > pageSize) {
                const remainder = total % pageSize
                count = remainder !== 0 ? remainder : pageSize
            } else {
                count = total
            }
        } else {
            // middle pages
            count = pageSize
        }
        return {
            count,
            start,
            total,
            stores:
                d.stores.length > 0
                    ? d.stores.map((store) => this.parseGetStore({...store, id: store.name}))
                    : undefined
        }
    }

    isLoggedIn() {
        return this.getAuthentications().auth !== undefined
    }

    /**
     * Returns customer id 'current' if a refresh token is set in the auth
     * Otherwise, returns customer id 'anonymous'
     *
     * @private
     */
    getCustomerIdFromAuth() {
        if (!this.isLoggedIn()) {
            throw new errors.NotAuthenticatedError()
        }
        return this.getAuthentications().auth.refreshToken === undefined ? 'anonymous' : 'current'
    }

    /**
     * @inheritDoc
     */
    createCart(oldCart, opts = {}) {
        const api = new hybris.UsersApi(this.client)
        const customerId = this.getCustomerIdFromAuth()
        return api
            .postCart(customerId, {fields: 'FULL', ...opts})
            .then((newCart) => {
                if (customerId === 'current' && oldCart !== undefined) {
                    return api
                        .postCart(customerId, {
                            // postCart will merge and delete the old cart
                            fields: 'FULL',
                            toMergeCartGuid: newCart.guid,
                            oldCartId: oldCart.id
                        })
                        .catch(() => {
                            throw new errors.ServerError('Could not merge old cart')
                        })
                }
                return newCart
            })
            .then((cart) => this.parseCart(cart))
            .catch(() => {
                throw new errors.ServerError('Could not create cart')
            })
    }

    /**
     * @inheritDoc
     */
    getCart(cartId, opts = {}) {
        const api = new hybris.UsersApi(this.client)
        if (!cartId) {
            throw new errors.InvalidArgumentError(`Parameter 'cartId' is required`)
        }

        return api
            .getCart(this.getCustomerIdFromAuth(), cartId, {fields: 'FULL', ...opts})
            .then((data) => this.parseCart(data))
            .catch(() => {
                throw new errors.ServerError('Could not get cart')
            })
    }

    /**
     * @inheritDoc
     */
    // eslint-disable-next-line no-unused-vars
    deleteCart(cartId, opts = {}) {
        if (!cartId) {
            throw new errors.InvalidArgumentError(`Parameter 'cartId' is required`)
        }

        const api = new hybris.UsersApi(this.client)
        return api.deleteCart(this.getCustomerIdFromAuth(), cartId).catch(() => {
            throw new errors.ServerError('Could not delete cart')
        })
    }

    /**
     * Parse a coupon item
     */
    parseCouponEntry(data) {
        return {
            id: data.code,
            code: data.code
        }
    }

    /**
     * @inheritDoc
     */
    parseCart(data) {
        const d = data
        if (!d.guid && !d.code) {
            throw new Error('Error parsing cart')
        }
        const customerId = this.getCustomerIdFromAuth()
        const cartId = customerId === 'anonymous' ? d.guid : d.code
        const parseNumberValue = (price) => {
            return price ? price.value : undefined
        }
        const parsedDiscounts = parseNumberValue(d.totalDiscounts)
        const discounts = parsedDiscounts === 0 ? parsedDiscounts : Math.abs(parsedDiscounts) * -1 // Our interface requires a negative value

        return {
            id: cartId,
            couponEntries: d.appliedVouchers ? d.appliedVouchers.map(this.parseCouponEntry) : [],
            customerInfo: {
                id: customerId,
                email: d.email
            },
            items: d.entries ? d.entries.map(this.parseCartItem) : [],
            shippingAddress: d.deliveryAddress
                ? this.parseOrderAddress(d.deliveryAddress)
                : undefined,
            billingAddress:
                d.paymentInfo && d.paymentInfo.billingAddress
                    ? this.parseOrderAddress(d.paymentInfo.billingAddress)
                    : undefined,
            selectedShippingMethodId: d.deliveryMode ? d.deliveryMode.code : undefined,
            payments: d.paymentInfo
                ? [this.parsePayment({...d.paymentInfo, amount: d.totalPriceWithTax.value})]
                : [],
            subtotal: parseNumberValue(d.subTotal),
            shipping: parseNumberValue(d.deliveryCost),
            discounts,
            tax: parseNumberValue(d.totalTax),
            total: parseNumberValue(d.totalPriceWithTax)
        }
    }

    /**
     * @inheritDoc
     */
    parseCartItem(data) {
        const d = data
        const quantity = d.quantity || 0

        return {
            id: `${d.entryNumber}`,
            productId: d.product ? d.product.code : undefined,
            productName: d.product ? d.product.name : undefined,
            quantity,
            baseItemPrice: d.basePrice ? d.basePrice.value : 0,
            baseLinePrice: d.basePrice ? d.basePrice.value * quantity : 0,
            itemPrice: d.totalPrice && quantity !== 0 ? d.totalPrice.value / quantity : 0,
            linePrice: d.totalPrice ? d.totalPrice.value : 0
        }
    }

    /**
     * @inheritDoc
     */
    parseShippingMethod(data) {
        return {
            id: data.code,
            name: data.name,
            cost: data.deliveryCost || 0
        }
    }

    /**
     * @inheritDoc
     */
    parseOrderAddress(data) {
        const d = data
        return {
            id: d.id,
            titleCode: d.titleCode,
            firstName: d.firstName,
            lastName: d.lastName,
            phone: d.phone, // BUG: fixed in hybris 6.5, phone field is not saved and returned
            addressLine1: d.line1,
            addressLine2: d.line2,
            countryCode: d.country ? d.country.isocode : undefined,
            stateCode: d.region ? d.region.isocode : undefined,
            city: d.town,
            postalCode: d.postalCode
        }
    }

    /**
     * @inheritDoc
     */
    parsePayment(data) {
        const d = data
        return {
            id: d.id,
            amount: d.amount, // amount is always cart total for now.
            methodId: 'CREDIT_CARD', // only 1 type of payment method, we'll call it 'CREDIT_CARD'
            details: {
                type: d.cardType.code,
                holderName: d.accountHolderName,
                number: undefined, // to add/update payment, provide full number.
                username: undefined,
                maskedNumber: d.cardNumber, // hybris will give back masked number.
                expiryMonth: parseInt(d.expiryMonth),
                expiryYear: parseInt(d.expiryYear),
                ccv: undefined // hybris doesnt have ccv?
            }
        }
    }

    /**
     * @inheritDoc
     */
    parsePaymentMethod(data) {
        return {
            id: data.id,
            name: data.name,
            types: data.types.map((types) => ({id: types.code, name: types.name}))
        }
    }

    /**
     * Transform an orderAddress into hybris' models: billingAddress or shippingAddress
     */
    transformOrderAddress(orderAddress) {
        return {
            country: {
                isocode: orderAddress.countryCode
            },
            firstName: orderAddress.firstName,
            lastName: orderAddress.lastName,
            id: orderAddress.id,
            line1: orderAddress.addressLine1,
            line2: orderAddress.addressLine2,
            phone: orderAddress.phone,
            postalCode: orderAddress.postalCode,
            region: {
                isocode: orderAddress.stateCode
            },
            titleCode: orderAddress.titleCode,
            town: orderAddress.city
        }
    }

    /**
     * Transform a shippingMethod into hybris' model deliveryMethod.
     */
    transformShippingMethod(shippingMethod) {
        return {
            code: shippingMethod.id,
            name: shippingMethod.name,
            deliveryCost: shippingMethod.cost
        }
    }

    /**
     * Transform a cartItem into hybris' model OrderEntryOCC.
     */
    transformCartItem(cartItem) {
        return {
            product: {
                code: cartItem.productId
            },
            quantity: cartItem.quantity
        }
    }

    /**
     * Transform a payment into hybris' model paymentDetail.
     */
    transformPayment(payment, billingAddress) {
        const details = payment.details
        return {
            id: payment.id,
            accountHolderName: details ? details.holderName : undefined,
            billingAddress: this.transformOrderAddress(billingAddress),
            cardNumber: details ? details.number : undefined,
            cardType: {
                code: details ? details.type : undefined
            },
            expiryMonth: details ? details.expiryMonth : undefined,
            expiryYear: details ? details.expiryYear : undefined,
            subscriptionId: details ? details.username : undefined
        }
    }

    /**
     * @inheritDoc
     */
    addCartItem(cart, cartItem, opts = {}) {
        if (!cart) {
            throw new errors.InvalidArgumentError(`Parameter 'cart' is required`)
        }
        if (!cartItem) {
            throw new errors.InvalidArgumentError(`Parameter 'cartItem' is required`)
        }

        const api = new hybris.UsersApi(this.client)

        const entryOrder = this.transformCartItem(cartItem, opts)

        return api
            .postCartEntries(cart.customerInfo.id, cart.id, entryOrder, {...opts, fields: 'FULL'})
            .then(() => api.getCart(cart.customerInfo.id, cart.id, {...opts, fields: 'FULL'}))
            .then((data) => {
                const updatedCart = this.parseCart({...data, email: cart.customerInfo.email})
                // BUG: does not save billing address region when sending billing address through a POST cart payment detail.
                // So lets persist this field on the incoming cart parameter to the returned order.
                if (
                    updatedCart.billingAddress &&
                    !updatedCart.billingAddress.stateCode &&
                    cart.billingAddress.stateCode
                ) {
                    updatedCart.billingAddress.stateCode = cart.billingAddress.stateCode
                }
                return updatedCart
            })
            .catch(() => {
                throw new errors.ServerError('Could not add item to cart')
            })
    }

    /**
     * @inheritDoc
     */
    removeCartItem(cart, cartItemId, opts = {}) {
        if (!cart) {
            throw new errors.InvalidArgumentError(`Parameter 'cart' is required`)
        }
        if (!cartItemId) {
            throw new errors.InvalidArgumentError(`Parameter 'cartItemId' is required`)
        }

        const api = new hybris.UsersApi(this.client)

        return api
            .deleteCartEntry(cart.customerInfo.id, cart.id, cartItemId)
            .then(() => api.getCart(cart.customerInfo.id, cart.id, {...opts, fields: 'FULL'}))
            .then((data) => {
                const updatedCart = this.parseCart({...data, email: cart.customerInfo.email})

                // BUG: does not save billing address region when sending billing address through a POST cart payment detail.
                // So lets persist this field on the incoming cart parameter to the returned order.
                if (
                    updatedCart.billingAddress &&
                    !updatedCart.billingAddress.stateCode &&
                    cart.billingAddress.stateCode
                ) {
                    updatedCart.billingAddress.stateCode = cart.billingAddress.stateCode
                }
                return updatedCart
            })
            .catch(() => {
                throw new errors.ServerError('Could not delete cart item')
            })
    }

    /**
     * @inheritDoc
     */
    updateCartItem(cart, cartItem, opts = {}) {
        if (!cart) {
            throw new errors.InvalidArgumentError(`Parameter 'cart' is required`)
        }
        if (!cartItem) {
            throw new errors.InvalidArgumentError(`Parameter 'cartItem' is required`)
        }

        const api = new hybris.UsersApi(this.client)

        const entryOrder = this.transformCartItem(cartItem, opts)
        return api
            .patchCartEntry(cart.customerInfo.id, cart.id, cartItem.id, entryOrder, {
                fields: 'FULL'
            })
            .then(() => api.getCart(cart.customerInfo.id, cart.id, {fields: 'FULL'}))
            .then((data) => {
                const updatedCart = this.parseCart({...data, email: cart.customerInfo.email})

                // BUG: does not save billing address region when sending billing address through a POST cart payment detail.
                // So lets persist this field on the incoming cart parameter to the returned order.
                if (
                    updatedCart.billingAddress &&
                    !updatedCart.billingAddress.stateCode &&
                    cart.billingAddress.stateCode
                ) {
                    updatedCart.billingAddress.stateCode = cart.billingAddress.stateCode
                }
                return updatedCart
            })
            .catch(() => {
                throw new errors.ServerError('Could not update cart item')
            })
    }

    /**
     * Add a supported payment type to the cart
     * @param {module:types.Cart} cart The cart to add the payment to.
     * @param {module:types.Payment} payment The payment to add.
     * @param {Object} opts
     * @return {Promise<module:types.Cart>}
     *
     * Need to set a billing address before setting a payment.
     * Must call setCustomerInformation() to add an email before setting payment for an anonymous user.
     * cart.paymentDetails.number will be returned as undefined and set as a masked number in cart.paymentDetails.maskedNumber.
     */
    setPayment(cart, payment, opts = {}) {
        if (!cart) {
            throw new errors.InvalidArgumentError(`Parameter 'cart' is required`)
        }
        if (!payment) {
            throw new errors.InvalidArgumentError(`Parameter 'payment' is required`)
        }

        const api = new hybris.UsersApi(this.client)

        if (cart.customerInfo.id === 'anonymous' && cart.customerInfo.email === undefined) {
            throw new errors.InvalidArgumentError('Please set email for guest user cart')
        }

        if (!cart.billingAddress) {
            throw new errors.InvalidArgumentError('Please set billing address first')
        }

        const isMissingFields =
            !payment.details.type ||
            !payment.details.expiryMonth ||
            !payment.details.expiryYear ||
            !payment.details.holderName ||
            !payment.details.number

        if (isMissingFields) {
            throw new errors.InvalidArgumentError('Missing hybris required fields')
        }

        const paymentDetails = this.transformPayment(payment, cart.billingAddress)

        // If the customer is a registered user and a payment already exists on the cart,
        // then the payment is has also been added to the user account. So, update the
        // corresponding payment on the user account to see the reflected changes on the cart.
        const apiCommand =
            cart.payments.length > 0 && cart.customerInfo.id === 'current'
                ? api
                      .putPaymentDetail(cart.customerInfo.id, cart.payments[0].id, paymentDetails)
                      .then(() => this.getCart(cart.id))
                : api
                      .postCartPaymentDetail(cart.customerInfo.id, cart.id, paymentDetails, {
                          ...opts,
                          fields: 'FULL'
                      })
                      .then((data) => {
                          cart.payments[0] = this.parsePayment({...data, amount: cart.total})
                          return cart
                      })

        return apiCommand.catch(() => {
            throw new errors.ServerError('Could not set payment')
        })
    }

    /**
     * Set the customer information.
     * @param {module:types.Cart} cart The customer's cart.
     * @param {module:types.CustomerInformation} customerInformation The new or modified customer information.
     * @param {Object} opts
     * @return {Promise<module:types.Cart>}
     *
     * Email can be set for a guest user but not a registered user.
     */
    setCustomerInformation(cart, customerInfo, opts = {}) {
        if (!cart) {
            throw new errors.InvalidArgumentError(`Parameter 'cart' is required`)
        }
        if (!customerInfo) {
            throw new errors.InvalidArgumentError(`Parameter 'customerInformation' is required`)
        }

        const api = new hybris.UsersApi(this.client)
        const customerId = cart.customerInfo.id

        return api
            .putCartEmail(customerId, cart.id, {...opts, email: customerInfo.email})
            .then(() => {
                cart.customerInfo = {...customerInfo, id: customerId}
                return cart
            })
            .catch(() => {
                throw new errors.ServerError('Could not set customer information')
            })
    }

    /**
     * @inheritDoc
     */
    getShippingMethods(cart, opts = {}) {
        if (!cart) {
            throw new errors.InvalidArgumentError(`Parameter 'cart' is required`)
        }

        const api = new hybris.UsersApi(this.client)

        return api
            .getCartDeliveryModes(cart.customerInfo.id, cart.id, {...opts, fields: 'FULL'})
            .then(({deliveryModes}) => deliveryModes.map(this.parseShippingMethod.bind(this)))
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

        const api = new hybris.UsersApi(this.client)
        return api
            .putCartDeliveryMode(cart.customerInfo.id, cart.id, shippingMethod.id)
            .then(() => {
                cart.selectedShippingMethodId = shippingMethod.id
                return cart
            })
            .catch(() => {
                throw new errors.ServerError('Could not set shipping method')
            })
    }

    /**
     * Set the billing address on the cart.
     * @param {module:types.Cart} cart The cart to update the billing address for.
     * @param {module:types.OrderAddress} billingAddress The new or modified address.
     * @param {Object} opts
     * @return {Promise<module:types.Cart>}
     *
     * Billing Address model : this order address needs to have a titleCode defined.
     * The default titleCodes are: ['mr', 'ms', 'miss', 'mrs', 'dr', 'rev']
     * But these may change depending on your backend, please refer to your backend instance to confirm valid titleCodes.
     *
     * If the billing address is set before adding a payment, the billing address will not yet be saved in the hybris instance.
     * Instead, the billing address will be saved in the hybris instance upon setting a payment.
     */
    setBillingAddress(cart, billingAddress, opts = {}) {
        if (!cart) {
            throw new errors.InvalidArgumentError(`Parameter 'cart' is required`)
        }
        if (!billingAddress) {
            throw new errors.InvalidArgumentError(`Parameter 'billingAddress' is required`)
        }

        const isMissingFields =
            !billingAddress.countryCode ||
            !billingAddress.addressLine1 ||
            !billingAddress.stateCode ||
            !billingAddress.titleCode ||
            !billingAddress.postalCode ||
            !billingAddress.city ||
            !billingAddress.firstName ||
            !billingAddress.lastName
        if (isMissingFields) {
            throw new errors.InvalidArgumentError('Missing hybris required fields')
        }

        // if the cart does not have a payment yet, give back a cart with the billing address set.
        // else, there a payment already exists and it's billing address needs to be updated
        if (cart.payments.length <= 0) {
            cart.billingAddress = billingAddress
            return Promise.resolve(cart)
        }

        const api = new hybris.UsersApi(this.client)

        // For a registered user, the existing payment can be patched to update it's billing address
        if (cart.customerInfo.id === 'current') {
            return api
                .patchPaymentDetail(cart.customerInfo.id, cart.payments[0].id, {
                    billingAddress: this.transformOrderAddress(billingAddress)
                })
                .then(() => {
                    cart.billingAddress = billingAddress
                    return cart
                })
                .catch(() => {
                    throw new errors.ServerError('Could not set billing address')
                })
        }

        // For a guest user, the existing payment can only be updated if the payment detail number is re-injected.
        if (cart.payments[0].details.number === undefined) {
            throw new errors.InvalidArgumentError(
                'As a guest user, please re-inject payment details number before updating billing address'
            )
        }

        return api
            .postCartPaymentDetail(
                cart.customerInfo.id,
                cart.id,
                this.transformPayment(cart.payments[0], billingAddress),
                {...opts, fields: 'FULL'}
            )
            .then((data) => {
                cart.billingAddress = billingAddress
                cart.payments[0] = this.parsePayment({...data, amount: cart.total})
                return cart
            })
            .catch(() => {
                throw new errors.ServerError('Could not set billing address')
            })
    }

    /**
     * Set the shipping method for the cart.
     * @param {module:types.Cart} cart The cart to set the shipping method for.
     * @param {module:types.ShippingMethod} shippingMethod The shipping method to set.
     * @param {Object} opts
     * @return {Promise<module:types.Cart>}
     *
     * Must call setCustomerInformation() to add an email before setting payment for a guest user.
     */
    setShippingAddress(cart, shippingAddress, opts = {}) {
        if (!cart) {
            throw new errors.InvalidArgumentError(`Parameter 'cart' is required`)
        }
        if (!shippingAddress) {
            throw new errors.InvalidArgumentError(`Parameter 'shippingAddress' is required`)
        }

        if (cart.customerInfo.id === 'anonymous' && cart.customerInfo.email === undefined) {
            throw new errors.InvalidArgumentError('Please set email for guest user cart')
        }

        const isMissingFields =
            !shippingAddress.firstName ||
            !shippingAddress.lastName ||
            !shippingAddress.addressLine1 ||
            !shippingAddress.city ||
            !shippingAddress.countryCode ||
            !shippingAddress.stateCode ||
            !shippingAddress.postalCode

        if (isMissingFields) {
            throw new errors.InvalidArgumentError('Missing hybris required fields')
        }

        const api = new hybris.UsersApi(this.client)
        // For a registered user, api.postCartDeliveryAddress() returns an unauthorized error (unknown reason)
        // A workaround: post or put (if already exists a shipping address) the user address and then put that address to the cart by its id.
        let apiCommand
        if (cart.customerInfo.id === 'current') {
            const userAddressApiCommand =
                cart.shippingAddress === undefined
                    ? api.postUserAddress(
                          cart.customerInfo.id,
                          this.transformOrderAddress(shippingAddress),
                          {fields: 'FULL'}
                      )
                    : api.putUserAddress(cart.customerInfo.id, shippingAddress.id, {
                          ...this.transformOrderAddress(shippingAddress),
                          id: shippingAddress.id
                      })

            apiCommand = userAddressApiCommand.then((data) => {
                return api.putCartDeliveryAddress(cart.customerInfo.id, cart.id, data.id)
            })
        } else {
            apiCommand = api.postCartDeliveryAddress(
                cart.customerInfo.id,
                cart.id,
                this.transformOrderAddress(shippingAddress),
                {...opts, fields: 'FULL'}
            )
        }

        return apiCommand
            .then(() => {
                cart.shippingAddress = shippingAddress
                return cart
            })
            .catch(() => {
                throw new errors.ServerError('Could not set shipping address')
            })
    }

    /**
     * Get the available payment methods for the cart
     * @param {module:types.Cart} cart The customer's cart.
     * @param {Object} opts
     * @return {Promise<Array.module:types.PaymentMethod>}
     *
     * Hybris only supports payments by credit card attained from their cardtypes endpoint
     * so this command will return only one payment method with the id 'CREDIT_CARD', name 'Credit Card'
     * and all of it's valid credit card types.
     */
    getPaymentMethods(cart, opts = {}) {
        const api = new hybris.CardtypesApi(this.client)
        return api
            .getCardTypes({...opts, fields: 'FULL'})
            .then((data) => [
                this.parsePaymentMethod({
                    id: 'CREDIT_CARD',
                    name: 'Credit Card',
                    types: data.cardTypes
                })
            ])
            .catch(() => {
                throw new errors.ServerError('Could not get payment methods')
            })
    }

    /**
     * @inheritDoc
     */
    parseOrder(data) {
        const order = this.parseCart(data)
        return {
            ...order,
            id: data.code,
            creationDate: new Date(data.created),
            status: data.statusDisplay,
            customerInfo: {
                id: data.guestCustomer ? 'anonymous' : 'current',
                email: data.paymentInfo.billingAddress.email
            }
        }
    }

    /**
     * @inheritDoc
     */
    getOrder(id, opts = {}) {
        if (!id) {
            throw new errors.InvalidArgumentError(`Parameter 'id' is required`)
        }
        let getOrderPromise
        // BUG: does not save billing address region when sending billing address through a POST cart payment detail.
        // So when retrieving an order by id, region (stateCode field) may be missing in the returned order.
        if (this.getCustomerIdFromAuth() === 'current') {
            const api = new hybris.UsersApi(this.client)
            getOrderPromise = api.getOrder('current', id, {...opts, fields: 'FULL'})
        } else {
            const api = new hybris.OrdersApi(this.client)
            getOrderPromise = api.getOrder(id, {...opts, fields: 'FULL'})
        }

        return getOrderPromise
            .then((data) => this.parseOrder(data))
            .catch(() => {
                throw new errors.ServerError('Order not found')
            })
    }

    /**
     * @inheritDoc
     */
    getOrders(ids, opts = {}) {
        if (!ids || ids.length <= 0) {
            throw new errors.InvalidArgumentError('Please specify list of order ids to get.')
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
    createOrder(cart, opts = {}) {
        const api = new hybris.UsersApi(this.client)
        return api
            .postOrder(cart.customerInfo.id, cart.id, {...opts, fields: 'FULL'})
            .then((data) => {
                const order = this.parseOrder(data)

                // BUG: does not save billing address region when sending billing address through a POST cart payment detail.
                // So lets persist this field on the incoming cart parameter to the returned order.
                if (order.billingAddress && !order.billingAddress.stateCode) {
                    order.billingAddress.stateCode = cart.billingAddress.stateCode
                }

                return order
            })
            .catch(() => {
                throw new errors.ServerError('Could not create order')
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

        const api = new hybris.UsersApi(this.client)

        return api
            .postCartVoucher(cart.customerInfo.id, cart.id, couponCode)
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

        const api = new hybris.UsersApi(this.client)

        return api
            .deleteCartVouchers(cart.customerInfo.id, cart.id, couponEntryId)
            .then(() => this.getCart(cart.id))
            .catch(() => {
                throw new errors.ServerError('Could Not Remove Coupon')
            })
    }
}
