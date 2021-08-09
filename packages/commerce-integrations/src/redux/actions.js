import stringify from 'fast-json-stable-stringify'
import {createAction} from 'redux-actions'

export const receiveCartData = createAction('Receive Cart Data', (payload) => payload)
export const receiveCartShippingMethods = createAction(
    'Receive Cart Shipping Methods Data',
    (payload) => payload
)
export const receiveCartPaymentMethods = createAction(
    'Receive Cart Payment Methods Data',
    (payload) => payload
)
export const receiveCategoryData = createAction('Receive Category Data', (payload) => payload)
export const receiveCustomerData = createAction('Receive Customer Data', (payload) => payload)
export const receiveOrderData = createAction('Receive Order Data', (payload) => payload)
export const receiveProductData = createAction('Receive Product Data', (payload) => payload)
export const receiveProductSearchData = createAction(
    'Receive Product Search Data',
    (payload) => payload
)
export const receiveStoreData = createAction('Receive Store Data', (payload) => payload)
export const receiveStoreSearchData = createAction(
    'Receive Store Search Data',
    (payload) => payload
)

export const createCart = (oldCart, opts) => (dispatch, _, {api}) => {
    return api.createCart(oldCart, opts).then((cart) => dispatch(receiveCartData(cart)))
}

export const getCart = (cartId, opts) => (dispatch, _, {api}) => {
    return api.getCart(cartId, opts).then((cart) => dispatch(receiveCartData(cart)))
}

export const addCartItem = (cart, cartItem, opts) => (dispatch, _, {api}) => {
    return api.addCartItem(cart, cartItem, opts).then((cart) => dispatch(receiveCartData(cart)))
}

export const updateCartItem = (cart, cartItem, opts) => (dispatch, _, {api}) => {
    return api.updateCartItem(cart, cartItem, opts).then((cart) => dispatch(receiveCartData(cart)))
}

export const removeCartItem = (cart, cartItemId, opts) => (dispatch, _, {api}) => {
    return api
        .removeCartItem(cart, cartItemId, opts)
        .then((cart) => dispatch(receiveCartData(cart)))
}

export const addCouponEntry = (cart, couponEntry, opts) => (dispatch, _, {api}) => {
    return api
        .addCouponEntry(cart, couponEntry, opts)
        .then((cart) => dispatch(receiveCartData(cart)))
}

export const removeCouponEntry = (cart, couponEntryId, opts) => (dispatch, _, {api}) => {
    return api
        .removeCouponEntry(cart, couponEntryId, opts)
        .then((cart) => dispatch(receiveCartData(cart)))
}

export const setPayment = (cart, payment, opts) => (dispatch, _, {api}) => {
    return api.setPayment(cart, payment, opts).then((cart) => dispatch(receiveCartData(cart)))
}

export const setCustomerInformation = (cart, customerInformation, opts) => (dispatch, _, {api}) => {
    return api
        .setCustomerInformation(cart, customerInformation, opts)
        .then((cart) => dispatch(receiveCartData(cart)))
}

export const setBillingAddress = (cart, billingAddress, opts) => (dispatch, _, {api}) => {
    return api
        .setBillingAddress(cart, billingAddress, opts)
        .then((cart) => dispatch(receiveCartData(cart)))
}

export const setShippingAddress = (cart, shippingAddress, opts) => (dispatch, _, {api}) => {
    return api
        .setShippingAddress(cart, shippingAddress, opts)
        .then((cart) => dispatch(receiveCartData(cart)))
}

export const setShippingMethod = (cart, shippingMethod, opts) => (dispatch, _, {api}) => {
    return api
        .setShippingMethod(cart, shippingMethod, opts)
        .then((cart) => dispatch(receiveCartData(cart)))
}

export const getShippingMethods = (cart, opts) => (dispatch, _, {api}) => {
    return api
        .getShippingMethods(cart, opts)
        .then((shippingMethods) => dispatch(receiveCartShippingMethods(shippingMethods)))
}

export const getPaymentMethods = (cart, opts) => (dispatch, _, {api}) => {
    return api
        .getPaymentMethods(cart, opts)
        .then((paymentMethods) => dispatch(receiveCartPaymentMethods(paymentMethods)))
}

export const deleteCart = (id, opts) => (dispatch, _, {api}) => {
    return api.deleteCart(id, opts).then(() => dispatch(receiveCartData(null)))
}

export const createOrder = (cart, opts) => (dispatch, _, {api}) => {
    return api
        .createOrder(cart, opts)
        .then((order) =>
            dispatch(
                receiveOrderData({
                    [order.id]: order
                })
            )
        )
        .then(() => {
            // Some e-comm backend automatically delete the cart after an order is
            // placed. So trap any errors that might happen here, and remove the cart
            // from the redux store.
            // TODO: This should be in the delete cart action. But we need deleteCart to
            // return a more descriptive error with a code so we can conditionally clear
            // the redux store.
            return dispatch(deleteCart(cart.id)).catch(() => dispatch(receiveCartData(null)))
        })
}

export const getOrder = (id, opts) => (dispatch, _, {api}) => {
    return api.getOrder(id, opts).then((order) =>
        dispatch(
            receiveOrderData({
                [id]: order
            })
        )
    )
}

export const getOrders = (ids, opts) => (dispatch, _, {api}) => {
    return api.getOrders(ids, opts).then((orders) => {
        // TODO: This looks like a common theme, consider refactoring.
        // This accumulator will make sure if we have requested a order that
        // isn't in the result set, that a null value is added to the redux store.
        // This will allow the UI to know that a value wasn't found on the server.
        const accumulator = (acc, curr) => {
            const order = orders.data.find((order) => order.id === curr)
            return {
                ...acc,
                [curr]: order ? order : null
            }
        }
        const payload = ids.reduce(accumulator, {})

        return dispatch(receiveOrderData(payload))
    })
}

export const registerCustomer = (data) => (dispatch, _, {api}) => {
    return api.registerCustomer(data).then((customer) => dispatch(receiveCustomerData(customer)))
}

export const login = (username, password) => (dispatch, _, {api}) => {
    return api.login(username, password).then((customer) => dispatch(receiveCustomerData(customer)))
}

export const logout = () => (dispatch, _, {api}) => {
    return api.logout().then(() => dispatch(receiveCustomerData(null)))
}

export const getCustomer = (id, opts) => (dispatch, _, {api}) => {
    return api.getCustomer(id, opts).then((customer) => dispatch(receiveCustomerData(customer)))
}

export const getCategory = (id, opts) => (dispatch, _, {api}) => {
    return api.getCategory(id, opts).then((category) =>
        dispatch(
            receiveCategoryData({
                [id]: category
            })
        )
    )
}

export const getCategories = (ids, opts) => (dispatch, _, {api}) => {
    return api.getCategories(ids, opts).then((categories) => {
        // This accumulator will make sure if we have requested a category that
        // isn't in the result set, that a null value is added to the redux store.
        // This will allow the UI to know that a value wasn't found on the server.
        const accumulator = (acc, curr) => {
            const category = categories.data.find((category) => category.id === curr)
            return {
                ...acc,
                [curr]: category ? category : null
            }
        }
        // TODO: We'll have to account for child categories at some point
        const payload = ids.reduce(accumulator, {})

        dispatch(receiveCategoryData(payload))
    })
}

export const getProduct = (id, opts) => (dispatch, _, {api}) => {
    return api.getProduct(id, opts).then((product) =>
        dispatch(
            receiveProductData({
                [id]: product
            })
        )
    )
}

export const getProducts = (ids, opts) => (dispatch, _, {api}) => {
    return api.getProducts(ids, opts).then((products) => {
        // This accumulator will make sure if we have requested a product that
        // isn't in the result set, that a null value is added to the redux store.
        // This will allow the UI to know that a value wasn't found on the server.
        const accumulator = (acc, curr) => {
            const product = products.data.find((product) => product.id === curr)
            return {
                ...acc,
                [curr]: product ? product : null
            }
        }
        const payload = ids.reduce(accumulator, {})

        return dispatch(receiveProductData(payload))
    })
}

export const searchProducts = (searchParams) => (dispatch, _, {api}) => {
    const resultKey = stringify(searchParams)

    const transformProductSearchResult = (productSearchResult) => ({
        id: productSearchResult.productId,
        name: productSearchResult.productName,
        price: productSearchResult.price,
        imageSets: [
            {
                images: [productSearchResult.defaultImage],
                variationProperties: [],
                sizeType: 'default'
            }
        ],
        variationProperties: productSearchResult.variationProperties
    })

    return api.searchProducts(searchParams).then((productSearch) => {
        // Populate the product store, this will help with preloading.
        const accumulator = (acc, curr) => ({
            ...acc,
            [curr.productId]: transformProductSearchResult(curr)
        })
        const products = (productSearch.results || []).reduce(accumulator, {})
        dispatch(receiveProductData(products))

        // Add the search results to the store.
        return dispatch(
            receiveProductSearchData({
                [resultKey]: productSearch
            })
        )
    })
}

export const getStore = (id, opts) => (dispatch, _, {api}) => {
    return api.getStore(id, opts).then((store) =>
        dispatch(
            receiveStoreData({
                [id]: store
            })
        )
    )
}

export const searchStores = (searchParams, opts) => (dispatch, _, {api}) => {
    const resultKey = stringify(searchParams)

    return api.searchStores(searchParams, opts).then((StoreSearchResult) => {
        // Add the search results to the store.
        return dispatch(
            receiveStoreSearchData({
                [resultKey]: StoreSearchResult
            })
        )
    })
}
