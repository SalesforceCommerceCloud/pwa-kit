/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
import {
    formSubmitErrorWrapper,
    dispatchWishlistAnalytics,
    dispatchCartAnalytics
} from '../../analytics/actions'
import {EVENT_ACTION} from '../../analytics/data-objects/'

let connector = {}

export const register = (commands) => {
    connector = commands
}

/**
 * Initializes any required data for Account Dashboard page.
 * @function
 * @param {string} url The url of the current page
 * @param {string} routeName The route name of the current page
 */
export const initAccountDashboardPage = (url, routeName) =>
    connector.initAccountDashboardPage(url, routeName)

/**
 * Initializes any required data for Account Order List page.
 * @function
 * @param {string} url The url of the current page
 * @param {string} routeName The route name of the current page
 */
export const initAccountOrderListPage = (url, routeName) =>
    connector.initAccountOrderListPage(url, routeName)

/**
 * Initializes any required data for Account Info page.
 * @function
 * @param {string} url The url of the current page
 * @param {string} routeName The route name of the current page
 */
export const initAccountInfoPage = (url, routeName) => connector.initAccountInfoPage(url, routeName)

/**
 * Updates the user's account info.
 * @function
 * @param {object} formValues The form values provided from the account info
 */
export const updateAccountInfo = (formValues) => connector.updateAccountInfo(formValues)

/**
 * Updates the user's account password.
 * @function
 * @param {object} formValues The form values provided from the account password
 */
export const updateAccountPassword = (formValues) => connector.updateAccountPassword(formValues)

/**
 * Initializes any required data for Account Address page.
 * @function
 * @param {string} url The url of the current page
 * @param {string} routeName The route name of the current page
 */
export const initAccountAddressPage = (url, routeName) =>
    connector.initAccountAddressPage(url, routeName)

/**
 * Initializes any required data for the Login page.
 * @function
 * @param {string} url The url of the current page
 * @param {string} routeName The route name of the current page
 */
export const initLoginPage = (url, routeName) => connector.initLoginPage(url, routeName)

/**
 * Initializes any required data for the Register page.
 * @function
 * @param {string} url The url of the current page
 * @param {string} routeName The route name of the current page
 */
export const initRegisterPage = (url, routeName) => connector.initRegisterPage(url, routeName)

/**
 * Initializes any required data for the Wishlist page.
 * @function
 * @param {string} url The url of the current page
 * @param {string} routeName The route name of the current page
 */
export const initWishlistPage = (url, routeName) => connector.initWishlistPage(url, routeName)

/**
 * Initializes any required data for the Account View Order  page.
 * @function
 * @param {string} url The url of the current page
 * @param {string} routeName The route name of the current page
 */
export const initAccountViewOrderPage = (url, routeName) =>
    connector.initAccountViewOrderPage(url, routeName)

/**
 * Adds an item to the cart from the wishlist
 * This command is separate from the add to cart command since
 * some connectors will also remove the item from the wishlist
 * @function
 * @param {string} productId The ID for the product that's being added to the cart
 * @param {object} formValues The form values required for the command
 */
export const addToCartFromWishlist = (productId, formValues) => (dispatch, getState) => {
    return dispatch(connector.addToCartFromWishlist(productId, formValues)).then((...args) => {
        dispatchCartAnalytics(EVENT_ACTION.addToCart, dispatch, getState, productId)
        return args
    })
}

/**
 * Removes an item from the wishlist
 * Some connectors might not give items within a wishlist a different ID
 * than their product ID. In that case use the same value for both params
 * @function
 * @param {string} itemID The id for the item in the wishlist that should be removed
 * @param {string} wishlistID The id for the wishlist the item should be removed from
 * @param {string} productID The product id for the item being removed
 * @param {string} quantity The quantity of items being removed
 */
export const removeItemFromWishlist = (itemID, wishlistID, productId, quantity) => (
    dispatch,
    getState
) => {
    return dispatch(connector.removeItemFromWishlist(itemID, wishlistID, productId)).then(
        (...args) => {
            dispatchWishlistAnalytics(
                EVENT_ACTION.removeFromWishlist,
                dispatch,
                getState,
                productId,
                quantity
            )
            return args
        }
    )
}

/**
 * Updates the quantity of an item in a wishlist
 * @function
 * @param {string} quantity The new quantity of the item in the wishlist
 * @param {string} itemId  The wishlist item ID
 * @param {string} wishlistId The ID of the wishlist
 */
export const updateWishlistItemQuantity = (quantity, itemId, wishlistId) => (dispatch) => {
    return dispatch(connector.updateWishlistItemQuantity(quantity, itemId, wishlistId))
}

/**
 * Updates an item in the wishlist
 * Some connectors might not give items within a wishlist a different ID
 * than their product ID. In that case use the same value for both params
 * @function
 * @param {string} itemID The id for the item in the wishlist that should be removed
 * @param {string} wishlistID The id for the wishlist the item should be removed from
 * @param {string} quantity The quantity of items being removed
 */
export const updateWishlistItem = (itemID, wishlistID, quantity) => (dispatch) => {
    return dispatch(connector.updateWishlistItem(itemID, wishlistID, quantity))
}

/**
 * Called when the user switches between the Sign In and Register sections.
 * @function
 * @param {object} router The React router object
 * @param {string} routes The routes configured in this application
 * @param {string} sectionName The section that was selected (typically this maps to a route name, but that is not guaranteed)
 */
export const navigateToSection = (router, routes, sectionName) =>
    connector.navigateToSection(router, routes, sectionName)

/**
 * Logs the user in with the given credentials.
 * @function
 * @param {string} username The user's username
 * @param {string} password The password provided by the user in clear text
 * @param {boolean} rememberMe `true` if the login should be persistent (this may be ignored by the connector)
 *
 * @return {Promise} Resolves to the URL to redirect to. This is often
 *                   controlled by the backend/connector. If the
 *                   connector returns a valid URL from this command,
 *                   the app will navigate to the URL.
 */
export const login = (username, password, rememberMe) =>
    connector.login(username, password, rememberMe)

/**
 * Logs the current user out.
 * @function
 */
export const logout = () => connector.logout()

/**
 * Creates an account using the given parameters.
 * @function
 * @param {string} firstname The user's first name
 * @param {string} lastname The user's lastname
 * @param {string} email The user's email
 * @param {string} password The user's password
 * @param {object} extraFields An object contains connector specific user information such as {titleCode: 'Mr.'}
 */
export const registerUser = (firstname, lastname, email, password, extraFields = {}) =>
    connector.registerUser(firstname, lastname, email, password, extraFields)

/**
 * Updates the user's shipping address to the given address.
 * Some backends don't distinguish between a save shipping and saved billing address.
 * In those cases this command will still save the address for the user.
 * @function
 * @param {object} formValues The form values provided from the address form
 */
export const updateShippingAddress = (formValues) =>
    formSubmitErrorWrapper(connector.updateShippingAddress(formValues))

/**
 * Updates the user's billing address to the given address.
 * Some backends don't distinguish between a saved shipping and saved billing addresses.
 * In those cases this command will still save the address for the user.
 * @function
 * @param {object} formValues The form values provided from the address form
 */
export const updateBillingAddress = (formValues) =>
    formSubmitErrorWrapper(connector.updateBillingAddress(formValues))

/**
 * Adds a new address to a user's account
 * @function
 * @param {Object} address - the address object
 */
export const addAddress = (address) => connector.addAddress(address)

/**
 * Edits an existing address on a user's account
 * @param {Object} address - the address object
 * @param {String} addressId - the unique ID of the address to be edited
 */
export const editAddress = (address, addressId) => connector.editAddress(address, addressId)

/**
 * Deletes an address from the user's account
 * @function
 * @param {String} addressId - the unique ID of the address to be deleted
 */
export const deleteAddress = (addressId) => connector.deleteAddress(addressId)

/**
 * Adds a previous order's items to a user's cart
 * @function
 * @param {String} orderId
 */
export const reorderPreviousOrder = (orderId) => connector.reorderPreviousOrder(orderId)
