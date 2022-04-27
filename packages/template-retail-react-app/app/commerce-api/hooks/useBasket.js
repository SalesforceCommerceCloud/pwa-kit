/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useContext, useMemo} from 'react'
import useEinstein from './useEinstein'
import {useCommerceAPI, BasketContext} from '../contexts'
import useCustomer from './useCustomer'
import {isError} from '../utils'

export default function useBasket(opts = {}) {
    const {currency} = opts
    const api = useCommerceAPI()
    const customer = useCustomer()
    const einstein = useEinstein()
    const {basket, setBasket: _setBasket} = useContext(BasketContext)

    const setBasket = (basketData) => {
        const _productItemsDetail = basket?._productItemsDetail
        _setBasket({_productItemsDetail, ...basketData})
    }

    const self = useMemo(() => {
        return {
            ...basket,

            // Check if a this represents a valid basket
            get loaded() {
                return basket && basket.basketId
            },

            get itemCount() {
                return basket?.productItems?.length || 0
            },

            /** Items taking into account quantity of each */
            get itemAccumulatedCount() {
                return basket?.productItems?.reduce((prev, next) => prev + next.quantity, 0) || 0
            },

            /** Sum of all order-level discounts */
            get totalOrderDiscount() {
                return (
                    basket?.orderPriceAdjustments?.reduce((sum, item) => {
                        return sum + item.price
                    }, 0) || 0
                )
            },

            /**
             * Get an existing basket, if basket doesn't exist, create a new one.
             *
             * NOTE: This request is the only time we are using the ShopperCustomers API
             * to interact with a customer basket. All other calls are done through the
             * ShopperBaskets API, which in our case, uses OCAPI rather than commerce sdk.
             */
            async getOrCreateBasket() {
                const customerBaskets = await api.shopperCustomers.getCustomerBaskets({
                    parameters: {customerId: customer?.customerId}
                })

                // Throw if there was a problem getting the customer baskets
                if (isError(customerBaskets)) {
                    throw new Error(customerBaskets)
                }

                // We only support single baskets for now. Grab the first one.
                let basket = Array.isArray(customerBaskets?.baskets) && customerBaskets.baskets[0]

                if (!basket) {
                    // Back to using ShopperBaskets for all basket interaction.
                    basket = await api.shopperBaskets.createBasket({})

                    // Throw if there was a problem creating the basket
                    if (isError(basket)) {
                        throw new Error(basket)
                    }
                }

                // Update basket currency if it was created with the wrong one, this will also set the state.
                if (currency && basket.currency !== currency) {
                    await this.updateBasketCurrency(currency, basket.basketId)
                } else {
                    setBasket(basket)
                }

                return basket
            },

            /**
             * Update the currency of the basket
             * @param currency - The currency code.
             * @param basketID - The id of the basket.
             * @returns {Promise<void>}
             */
            async updateBasketCurrency(currency, basketId) {
                const updateBasket = await api.shopperBaskets.updateBasket({
                    body: {currency},
                    parameters: {basketId}
                })
                if (isError(updateBasket)) {
                    throw new Error(updateBasket)
                } else {
                    setBasket(updateBasket)
                }
            },

            /**
             * Add an item to the basket.
             *
             * @param {array} item
             * @param {string} item.productId - The id of the product.
             * @param {number} item.quantity - The quantity of the item.
             */
            async addItemToBasket(item) {
                const response = await api.shopperBaskets.addItemToBasket({
                    body: item,
                    parameters: {basketId: basket.basketId}
                })
                if (response.fault) {
                    throw new Error(response)
                } else {
                    setBasket(response)
                    const einsteinProduct = {
                        id: item[0].productId,
                        sku: '',
                        price: item[0].price,
                        quantity: item[0].quantity
                    }
                    einstein.sendAddToCart(einsteinProduct)
                }
            },

            /**
             * Remove an item from the basket.
             *
             * @param {string} itemId - The id of the basket item.
             */
            async removeItemFromBasket(itemId) {
                const response = await api.shopperBaskets.removeItemFromBasket({
                    parameters: {basketId: basket.basketId, itemId: itemId}
                })
                if (response.fault) {
                    throw new Error(response)
                } else {
                    setBasket(response)
                }
            },

            /**
             * Update an item in the basket.
             *
             * @param {object} item
             * @param {string} item.productId - The id of the product.
             * @param {number} item.quantity - The quantity of the item.
             * @param {string} basketItemId - The id of the item.
             */
            async updateItemInBasket(item, basketItemId) {
                const response = await api.shopperBaskets.updateItemInBasket({
                    body: item,
                    parameters: {basketId: basket.basketId, itemId: basketItemId}
                })
                if (response.fault) {
                    throw new Error(response)
                } else {
                    setBasket(response)
                }
            },

            /**
             * Get the product information for all items in the basket.
             *
             * @param {string} ids - The id(s) of the product, separated by ",".
             * @param {boolean} options - options to pass as params to the api request
             */
            async getProductsInBasket(ids, options) {
                if (!ids) {
                    return
                }

                const response = await api.shopperProducts.getProducts({
                    parameters: {ids: ids, ...options}
                })

                const itemDetail = response.data.reduce((result, item) => {
                    const key = item.id
                    result[key] = item
                    return result
                }, {})

                const updatedBasket = {
                    ...basket,
                    _productItemsDetail: {...basket._productItemsDetail, ...itemDetail}
                }

                setBasket(updatedBasket)
            },

            /**
             * Set the shipping address for the current basket.
             * @external Address
             * @see https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/modules/shopperbaskets.html#orderaddress
             */
            async setShippingAddress(address) {
                const response = await api.shopperBaskets.updateShippingAddressForShipment({
                    body: address,
                    parameters: {
                        basketId: basket.basketId,
                        shipmentId: 'me',
                        useAsBilling: !basket.billingAddress
                    }
                })

                setBasket(response)
            },

            /**
             * Set the shipping method for the current basket.
             *
             * @param {string} id - The id of the shipping method.
             */
            async setShippingMethod(id) {
                const response = await api.shopperBaskets.updateShippingMethodForShipment({
                    body: {id},
                    parameters: {basketId: basket.basketId, shipmentId: 'me'}
                })

                setBasket(response)
            },

            /**
             * Set the billing address for the current basket.
             * @external Address
             * @see https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/modules/shopperbaskets.html#orderaddress
             */
            async setBillingAddress(address) {
                const response = await api.shopperBaskets.updateBillingAddressForBasket({
                    body: address,
                    parameters: {basketId: basket.basketId, shipmentId: 'me'}
                })

                setBasket(response)
            },

            /**
             * Set the payment instrument for the current basket
             *
             * NOTE: API does allow adding multiple payment instruments to split payment. However,
             * we are currently only handling a single payment instrument.
             * Commerce API does not have an endpoint to edit a payment instrument, but OCAPI does.
             * We want to emulate Commerce API behavior (when using OCAPI) so we'll just remove the
             * existing payment and add the new one to simulate editing. We're making an assumption
             * that our basket will never have more than one payment instrument applied at any time.
             *
             * @external PaymentInstrument
             * @see https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/modules/shopperbaskets.html#basketpaymentinstrumentrequest
             */
            async setPaymentInstrument(paymentInstrument) {
                // Keep reference to existing payment instrument id
                let existingPaymentInstrumentId =
                    basket.paymentInstruments && basket.paymentInstruments[0]?.paymentInstrumentId

                // Add the new payment instrument to basket
                let response = await api.shopperBaskets.addPaymentInstrumentToBasket({
                    body: paymentInstrument,
                    parameters: {basketId: basket.basketId}
                })

                // TOOO: Handle possible error when adding payment instrument.
                // We won't attempt to remove the previous payment instrument in this case.

                // Remove the previous payment instrument if it existed
                if (existingPaymentInstrumentId) {
                    response = await api.shopperBaskets.removePaymentInstrumentFromBasket({
                        parameters: {
                            basketId: basket.basketId,
                            paymentInstrumentId: existingPaymentInstrumentId
                        }
                    })
                }

                setBasket(response)
            },

            /**
             * Remove the payment instrument for the current basket
             */
            async removePaymentInstrument() {
                let paymentInstrumentId =
                    basket.paymentInstruments && basket.paymentInstruments[0]?.paymentInstrumentId

                if (!paymentInstrumentId) {
                    return
                }

                const response = await api.shopperBaskets.removePaymentInstrumentFromBasket({
                    parameters: {
                        basketId: basket.basketId,
                        paymentInstrumentId: paymentInstrumentId
                    }
                })

                setBasket(response)
            },

            /**
             * Update the customer information for the current basket.
             *
             * @param {object} info
             * @param {string} info.email - The email of the customer.
             */
            async updateCustomerInfo(info) {
                const response = await api.shopperBaskets.updateCustomerForBasket({
                    body: info,
                    parameters: {basketId: basket.basketId}
                })

                setBasket(response)
            },

            /**
             * Apply a coupon/promo code to the current basket
             * @param {string} code - The promo code to be applied
             */
            async applyPromoCode(code) {
                const response = await api.shopperBaskets.addCouponToBasket({
                    body: {code},
                    parameters: {basketId: basket.basketId}
                })

                if (response.fault) {
                    throw new Error(response)
                }

                setBasket(response)
            },

            /**
             * Remove a coupon/promo code from the current basket
             * @param {string} couponIemId - The item id of the appied code
             */
            async removePromoCode(couponItemId) {
                const response = await api.shopperBaskets.removeCouponFromBasket({
                    parameters: {basketId: basket.basketId, couponItemId}
                })

                if (response.fault) {
                    throw new Error(response)
                }

                setBasket(response)
            },

            /**
             * Fetches and returns promo details for the given IDs
             * @param {Array<string>} ids - The promo ids to fetch
             * @returns {Object} - API response containing data
             */
            async getPromotions(ids) {
                const response = await api.shopperPromotions.getPromotions({
                    parameters: {ids: ids.join(',')}
                })

                return response
            },

            /**
             * Creates an order using the current basket.
             */
            async createOrder() {
                const response = await api.shopperOrders.createOrder({
                    body: {basketId: basket.basketId}
                })

                if (response.fault || (response.title && response.type && response.detail)) {
                    throw new Error(response.title)
                }

                // We replace the basket with the order result data so we can display
                // it on the confirmation page. The basket is automatically deleted
                // in SF so we need to make sure a new one is created when leaving the confirmation.
                setBasket(response)
            },

            /**
             * Fetches the applicable shipping methods for the current basket
             * @returns {Object} - API response containing data
             */
            getShippingMethods() {
                return api.shopperBaskets.getShippingMethodsForShipment({
                    parameters: {basketId: basket.basketId, shipmentId: 'me'}
                })
            },

            /**
             * Merge data from the previous shopper's basket into the current shopper's active basket
             * and delete the previous shopper's basket.
             */
            async mergeBasket() {
                const response = api.shopperBaskets.mergeBasket({
                    headers: {
                        'Content-Type': 'application/json' // This is not required since the request has no body but CommerceAPI throws a '419 - Unsupported Media Type' error if this header is removed.
                    },
                    parameters: {
                        createDestinationBasket: true // If the current shopper has an active basket, this parameter is ignored.
                    }
                })

                if (response.fault) {
                    throw new Error(response)
                }

                setBasket(response)
            }
        }
    }, [customer, basket, setBasket])

    return self
}
