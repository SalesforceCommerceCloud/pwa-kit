/* eslint no-unused-vars: 0 */ // Interfaces are empty, disable for whole file
/** @module */

/**
 * A generic interface for API based or web-scraping ecommerce Connectors.
 *
 * @interface
 */
export class CommerceConnector {
    /**
     * Get the default headers that are sent with every request.
     *
     * @return {Object.<String, String>}
     */
    getDefaultHeaders() {
        throw new Error('Not implemented')
    }

    /**
     * Set the default headers that are sent with every request.
     *
     * @param {Object.<String, String>} headers
     */
    setDefaultHeaders(headers) {
        throw new Error('Not implemented')
    }

    /**
     * Log a customer in and return their details.
     *
     * On backends which support "guest login", credentials can be omitted to
     * give you a guest session.
     *
     * @param {String} username
     * @param {String} password
     * @return {Promise<module:types.Customer>}.
     *
     * @throws {module:errors.InvalidArgumentError} Will throw an error if the username or password aren't provided for type registered.
     * @throws {module:errors.ForbiddenError} Will throw an error if the customer credentials are incorrect.
     */
    login(username, password) {
        throw new Error('Not implemented')
    }

    /**
     * Log a customer out.
     *
     * @return {Promise<undefined>}
     *
     * @throws {module:errors.ServerError} Will throw an error if there was a server-side error.
     */
    logout() {
        throw new Error('Not implemented')
    }

    /**
     * Refresh a session token, on backends that support refresh.
     *
     * @return {Promise<module:types.Customer>}
     *
     * @throws {module:errors.ForbiddenError} Will throw an error if authorization credentials are incorrect
     */
    refreshSession() {
        throw new Error('Not implemented')
    }

    /**
     * Return a customer's details by id.
     *
     * @param {String} id Customer Id
     * @param {Object} [opts] Options object
     * @return {Promise<module:types.Customer>}
     *
     * @throws {module:errors.ServerError} Throw generic error if server has error.
     */
    getCustomer(id, opts = {}) {
        throw new Error('Not implemented')
    }

    /**
     * Search for products, given a productSearchRequest object.
     *
     * @param {module:types.ProductSearchRequest} productSearchRequest Search query
     * @param {Object} [opts] Options object
     * @return {Promise<module:types.ProductSearch>}
     */
    searchProducts(productSearchRequest, opts = {}) {
        throw new Error('Not implemented')
    }

    /**
     * Get a single product by id.
     *
     * @param {String} id The product id.
     * @param {Object} [opts] Options object
     * @return {Promise<module:types.Product>}.
     */
    getProduct(id, opts = {}) {
        throw new Error('Not implemented')
    }

    /**
     * Get multiple products by their ids.
     *
     * On supported backends this method will retrieve products in a single network
     * call. Others may make a call per id to emulate the same behaviour.
     *
     * Invalid ids are ignored and results are not guaranteed to be returned in the
     * order requested.
     *
     * @param {Array<String>} ids The product ids.
     * @param {Object} [opts] Options object
     * @return {Promise<module:types.ProductList>}.
     */
    getProducts(ids, opts = {}) {
        throw new Error('Not implemented')
    }

    /**
     * Get a Store (ie. a physical retail-outlet) by id. Includes addresses, opening
     * hours, etc.
     *
     * @param {String} id The id of the store
     * @param {Object} [opts] Options object
     *
     * @return {Promise<module:types.Store>}.
     */
    getStore(id, opts = {}) {
        throw new Error('Not implemented')
    }

    /**
     * Get a product Category by id.
     *
     * @param {String} id
     * @param {Object} [opts] object
     * @returns {Promise<module:types.Category>}
     */
    getCategory(id, opts = {}) {
        throw new Error('Not implemented')
    }

    /**
     * Returns multiple product Categories by their ids.
     *
     * On supported backends this method will retrieve Categories in a single network
     * call. Others may make a call per id to emulate the same behaviour.
     *
     * Invalid ids are ignored and results are not guaranteed to be returned in the
     * order requested.
     *
     * @param {Array<String>} ids
     * @param {Object} [opts] object
     * @returns {Promise<module:types.CategoryList>}
     */
    getCategories(ids, opts = {}) {
        throw new Error('Not implemented')
    }

    /**
     * Searches for Stores (ie. physical retail-outlets).
     *
     * @param {module:types.StoreSearchRequest} storeSearchRequest
     * @param {Object} [opts] Options object
     * @returns {Promise<module:types.StoreSearchResult>}
     */
    searchStores(storeSearchRequest, opts = {}) {
        throw new Error('Not implemented')
    }

    /**
     * Creates a new cart with an optional cart object.
     *
     * @param {module:types.Cart} oldCcart The cart you'd like to migrate to the new cart
     * @param {Object} [opts] object
     * @return {Promise<module:types.Cart>}
     *
     * @throws Could not create cart.
     */
    createCart(oldCart, opts = {}) {
        throw new Error('Not implemented')
    }

    /**
     * Retrieve cart by id.
     *
     * @param {String} cartId The id of the cart you want to retrieve
     * @param {Object} [opts] object
     * @returns {Promise<module:types.Cart>}
     */
    getCart(cartId, opts = {}) {
        throw new Error('Not implemented')
    }

    /**
     * Deletes the given cart
     *
     * @param {String} cartId The id of the cart you want to delete.
     * @param {Object} [opts] object
     *
     * @throws Could not delete cart.
     */
    deleteCart(cartId) {
        throw new Error('Not implemented')
    }

    /**
     * Adds a cart item to cart.
     * @param {module:types.Cart} cart The cart to add the cart item to.
     * @param {module:types.CartItem} cartItem The cart item to add.
     * @param {Object} opts
     * @return {Promise<module:types.Cart>}
     */
    addCartItem(cart, cartItem, opts = {}) {
        throw new Error('Not implemented')
    }

    /**
     * Remove a cart item from the cart.
     * @param {module:types.Cart} cart The cart to remove the cart item from.
     * @param {String} cartItemId The id of the cart item to remove.
     * @param {Object} opts
     * @return {Promise<module:types.Cart>}
     */
    removeCartItem(cart, cartItemId, opts = {}) {
        throw new Error('Not implemented')
    }

    /**
     * Update an existing cart item in the cart.
     * @param {module:types.Cart} cart The cart to containing the cart item to update.
     * @param {module:types.CartItem} cartItem The cart item to update.
     * @param {Object} opts
     * @return {Promise<module:types.Cart>}
     */
    updateCartItem(cart, cartItem, opts = {}) {
        throw new Error('Not implemented')
    }

    /**
     * Set the shipping address on the cart.
     * @param {module:types.Cart} cart The cart to update the shipping address for.
     * @param {module:types.OrderAddress} shippingAddress The new or modified address.
     * @param {Object} opts
     * @return {Promise<module:types.Cart>}
     */
    setShippingAddress(cart, shippingAddress, opts = {}) {
        throw new Error('Not implemented')
    }

    /**
     * Set the billing address on the cart.
     * @param {module:types.Cart} cart The cart to update the billing address for.
     * @param {module:types.OrderAddress} billingAddress The new or modified address.
     * @param {Object} opts
     * @return {Promise<module:types.Cart>}
     */
    setBillingAddress(cart, billingAddress, opts = {}) {
        throw new Error('Not implemented')
    }

    /**
     * Add a supported payment type to the cart
     * @param {module:types.Cart} cart The cart to remove the payment from.
     * @param {module:types.Payment} payment The payment to add.
     * @param {Object} opts
     * @return {Promise<module:types.Cart>}
     */
    setPayment(cart, payment, opts = {}) {
        throw new Error('Not implemented')
    }

    /**
     * Get all the available shipping methods given the cart details.
     * @param {module:types.Cart} cart The cart to determinen avaialble shipping methods for.
     * @param {Object} opts
     * @return {Promise<Array.<module:types.ShippingMethod>>}
     */
    getShippingMethods(cart, opts = {}) {
        throw new Error('Not implemented')
    }

    /**
     * Set the shipping method for the cart.
     * @param {module:types.Cart} cart The cart to set the shipping method for.
     * @param {module:types.ShippingMethod} shippingMethod The shipping method to set.
     * @param {Object} opts
     * @return {Promise<module:types.Cart>}
     */
    setShippingMethod(cart, shippingMethod, opts = {}) {
        throw new Error('Not implemented')
    }

    /**
     * Set the customer information.
     * @param {module:types.Cart} cart The customer's cart.
     * @param {module:types.CustomerInformation} customerInformation The new or modified customer information.
     * @param {Object} opts
     * @return {Promise<module:types.Cart>}
     */
    setCustomerInformation(cart, customerInformation, opts = {}) {
        throw new Error('Not implemented')
    }

    /**
     * Get the available payment methods for the cart.
     * @param {module:types.Cart} cart The customer's cart.
     * @param {Object} opts
     * @return {Promise<Array<module:types.PaymentMethod>>}
     */
    getPaymentMethods(cart, opts = {}) {
        throw new Error('Not implemented')
    }

    /**
     * Create a new order using a given cart.
     * @param {module:types.Cart} cart The customer's cart.
     * @param {Object} opts
     * @return {Promise<module:types.Order>}.
     */
    createOrder(cart, opts = {}) {
        throw new Error('Not implemented')
    }

    /**
     * Get a single order by id.
     *
     * @param {String} id The order id.
     * @param {Object} [opts] Options object
     * @return {Promise<module:types.Order>}.
     */
    getOrder(id, opts = {}) {
        throw new Error('Not implemented')
    }

    /**
     * Get multiple orders by their ids.
     *
     * On supported backends this method will retrieve orders in a single network
     * call. Others may make a call per id to emulate the same behaviour.
     *
     * Invalid ids are ignored and results are not guaranteed to be returned in the
     * order requested.
     *
     * @param {Array<String>} ids The order ids.
     * @param {Object} [opts] Options object
     * @return {Promise<module:types.OrderList>}.
     */
    getOrders(ids, opts = {}) {
        throw new Error('Not implemented')
    }

    /**
     *
     * Add a coupon to the cart by it's code.
     *
     * @param {module:types.Cart} cart The customer's cart.
     * @param {Object} couponEntry The coupon.
     * @param {Object} opts Options object.
     * @return {Promise<module:types.Cart>}
     */
    addCouponEntry(cart, couponEntry, opts = {}) {
        throw new Error('Not implemented')
    }

    /**
     *
     * Removes a coupon from the cart by its coupon entry id.
     *
     * @param {module:types.Cart} cart The customer's cart.
     * @param {Object} couponEntryId The coupon entry id.
     * @param {Object} opts Options object.
     * @return {Promise<module:types.Cart>}
     */
    removeCouponEntry(cart, couponEntryId, opts = {}) {
        throw new Error('Not implemented')
    }
}

/**
 * ParserHooks allows user to override/customize parsers on Commerce Connector
 * implementations, as needed.
 *
 * For compatibility, the results returned from overridden methods should be
 * valid Commerce Integrations type objects. Typically, adding new properties
 * to returned objects is safe, which removing them is *not*.
 *
 * @interface
 */
export class ParserHooks {
    /**
     * Parse a customer.
     */
    parseCustomer(data) {
        throw new Error('Not implemented')
    }

    /**
     * Parse a category.
     */
    parseCategory(data) {
        throw new Error('Not implemented')
    }

    /**
     * Parse categories.
     */
    parseCategories(data) {
        throw new Error('Not implemented')
    }

    /**
     * Parse a product search result.
     */
    parseSearchProducts(data, searchParams) {
        throw new Error('Not implemented')
    }

    /**
     * Parse a product.
     */
    parseProduct(data) {
        throw new Error('Not implemented')
    }

    /**
     * Parse products.
     */
    parseProducts(data) {
        throw new Error('Not implemented')
    }

    /**
     * Parse a store.
     */
    parseStore(data) {
        throw new Error('Not implemented')
    }

    /**
     * Parse a StoreSearchResult
     */
    parseSearchStores(data, searchParams) {
        throw new Error('Not implemented')
    }

    /**
     * Parse a cart
     */
    parseCart(data) {
        throw new Error('Not implemented')
    }

    /**
     * Parse a cart item
     */
    parseCartItem(data) {
        throw new Error('Not implemented')
    }

    /**
     * Parse an order address
     */
    parseOrderAddress(data) {
        throw new Error('Not implemented')
    }

    /**
     * Parse customer information
     */
    parseCustomerInformation(data) {
        throw new Error('Not implemented')
    }

    /**
     * Parse a shipping method
     */
    parseShippingMethod(data) {
        throw new Error('Not implemented')
    }

    /**
     * Parse a payment.
     */
    parsePayment(data) {
        throw new Error('Not implemented')
    }

    /**
     * Parse a payment method.
     */
    parsePaymentMethod(data) {
        throw new Error('Not implemented')
    }

    /**
     * Parse an order.
     */
    parseOrder(data) {
        throw new Error('Not implemented')
    }

    /**
     * Parse an coupon entry.
     */
    parseCouponEntry(data) {
        throw new Error('Not implemented')
    }
}
