/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
import {formSubmitErrorWrapper} from '../../analytics/actions'

let connector = {}

export const register = (commands) => {
    connector = commands
}

/**
 * Initializes any required data for the Checkout Shipping page
 * @function
 * @param {string} url The url of the current page
 * @param {string} routeName The route name of the current page
 */
export const initCheckoutShippingPage = (url, routeName) =>
    connector.initCheckoutShippingPage(url, routeName)

/**
 * Initializes any required data for the Checking Payment page
 * @function
 * @param {string} url The url of the current page
 * @param {string} routeName The route name of the current page
 */
export const initCheckoutPaymentPage = (url, routeName) =>
    connector.initCheckoutPaymentPage(url, routeName)

/**
 * Initializes any required data for the Checkout Confirmation page
 * @function
 * @param {string} url The url of the current page
 * @param {string} routeName The route name of the current page
 */
export const initCheckoutConfirmationPage = (url, routeName) =>
    connector.initCheckoutConfirmationPage(url, routeName)

/**
 * Submits the shipping stage of the checkout flow.
 * @function
 * @param {object} formValues All of the values from the shipping form (see store/checkout/constants:SHIPPING_FORM_NAME)
 * @return {Promise} Resolves to the URL to redirect to for
 *                   payment. This is often controlled by the
 *                   backend/connector. If the connector returns a
 *                   valid URL from this command, the app will
 *                   navigate to the URL.
 */
export const submitShipping = (formValues) =>
    formSubmitErrorWrapper(connector.submitShipping(formValues))

/**
 * Submits the payment stage of the checkout flow.
 * @function
 * @param {object} formValues All of the values from the payment form (see store/checkout/constants:PAYMENT_FORM_NAME)
 * @return {Promise} Resolves to the URL to redirect to for
 *                   confirmation. This is often controlled by the
 *                   backend/connector. If the connector returns a
 *                   valid URL from this command, the app will
 *                   navigate to the URL.
 */
export const submitPayment = (formValues) => connector.submitPayment(formValues)

/**
 * Fetches shipping methods estimates for the given checkout stage
 * @function
 * @param {object} inputAddress The address to estimate shipping for
 */
export const fetchShippingMethodsEstimate = (inputAddress) =>
    connector.fetchShippingMethodsEstimate(inputAddress)

/**
 * Updates the registered customer's billing and shipping addresses using the
 * address that was given during checkout. This should be called during checkout
 * once shipping information has been provided.
 * @function
 */
export const updateShippingAndBilling = () => connector.updateShippingAndBilling()

/**
 * Fetches the registered customer's saved shipping addresses
 * @function
 */
export const fetchSavedShippingAddresses = () => connector.fetchSavedShippingAddresses()
