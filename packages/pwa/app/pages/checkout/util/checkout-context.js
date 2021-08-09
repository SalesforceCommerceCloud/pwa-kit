import React, {useEffect, useState} from 'react'
import PropTypes from 'prop-types'
import useBasket from '../../../commerce-api/hooks/useBasket'
import useCustomer from '../../../commerce-api/hooks/useCustomer'
import {useCommerceAPI} from '../../../commerce-api/utils'
import {getPaymentInstrumentCardType} from '../../../utils/cc-utils'
import {isMatchingAddress} from '../../../utils/utils'

const CheckoutContext = React.createContext()

export const CheckoutProvider = ({children}) => {
    const api = useCommerceAPI()
    const customer = useCustomer()
    const basket = useBasket()

    const [state, setState] = useState({
        // @TODO: use contants to represent checkout steps like const CHECKOUT_STEP_2_SHIPPING = 2
        step: undefined,

        isGuestCheckout: false,
        shippingMethods: undefined,
        paymentMethods: undefined,
        globalError: undefined,
        sectionError: undefined
    })

    const mergeState = (data) => {
        setState((_state) => ({
            ..._state,
            ...data
        }))
    }

    useEffect(() => {
        if (customer.authType === 'registered' && state.isGuestCheckout) {
            mergeState({isGuestCheckout: false})
        }

        if (customer.authType === 'guest' && basket.customerInfo?.email && !state.isGuestCheckout) {
            mergeState({isGuestCheckout: true})
        }

        if (customer.customerId && basket.basketId && state.step == undefined) {
            let step = 0

            if (basket.customerInfo?.email) {
                step += 1
            }
            if (basket.shipments && basket.shipments[0]?.shippingAddress) {
                step += 1
            }
            if (basket.shipments && basket.shipments[0]?.shippingMethod) {
                step += 1
            }
            if (basket.paymentInstruments?.length === 1 && basket.billingAddress) {
                step += 1
            }

            mergeState({step})
        }
    }, [customer, basket])

    // We combine our state and actions into a single context object. This is much more
    // convenient than having to import and bind actions seprately. State updates will
    // cause this object to be reinitialized, which may lead to unecesary rerenders,
    // however, the performance impact is negligible/non-existent. If performance
    // becomes an issue later on, further steps may be taken to optimize it.
    const ctx = React.useMemo(() => {
        return {
            ...state,

            // Getter functions
            // Provides convenient access to various data points and derivations.
            // ----------------

            get customer() {
                return customer
            },

            get basket() {
                return basket
            },

            get selectedShippingAddress() {
                return basket.shipments && basket.shipments[0].shippingAddress
            },

            get selectedShippingMethod() {
                return basket.shipments && basket.shipments[0].shippingMethod
            },

            get selectedPayment() {
                return basket.paymentInstruments && basket.paymentInstruments[0]
            },

            get selectedBillingAddress() {
                return basket.billingAddress
            },

            get isBillingSameAsShipping() {
                if (!ctx.selectedShippingAddress) {
                    return false
                }
                if (!ctx.selectedBillingAddress && ctx.selectedShippingAddress) {
                    return true
                }
                const result = isMatchingAddress(
                    ctx.selectedBillingAddress,
                    ctx.selectedShippingAddress
                )
                return result
            },

            // Local state setters
            // Callbacks/functions for setting local state data
            // ----------------

            goToNextStep() {
                mergeState({step: state.step + 1})
            },

            setCheckoutStep(step) {
                mergeState({step})
            },

            setIsGuestCheckout(isGuestCheckout) {
                mergeState({isGuestCheckout})
            },

            // Async functions
            // Convenience methods for interacting with remote customer and basket data.
            // ----------------

            /**
             * Logs in a registered customer or applies a guest email to basket.
             * @param {Object} credentials
             */
            async login({email, password}) {
                if (!password) {
                    await basket.updateCustomerInfo({email})
                } else {
                    await customer.login({email, password})
                }
            },

            /**
             * Applies the given address to the basket's shipment. Accepts CustomerAddress and OrderAddress.
             * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/modules/shoppercustomers.html#customeraddress}
             * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/modules/shoppercustomers.html#orderaddress}
             * @param {Object} addressData
             */
            async setShippingAddress(addressData) {
                /* eslint-disable no-unused-vars */
                const {
                    id,
                    preferred,
                    creationDate,
                    lastModified,
                    addressId,
                    addressName,
                    ...address
                } = addressData
                /* eslint-enable no-unused-vars */

                await basket.setShippingAddress(address)

                // Save the address to the customer's account if they are registered and they
                // provided a name for it.
                if (!state.isGuestCheckout) {
                    customer.addSavedAddress(address)
                }
            },

            /**
             * Removes a customer's saved address from their account.
             * @param {string} addressId - The name/identifier of the address to be removed
             */
            async removeSavedAddress(addressId) {
                await customer.removeSavedAddress(addressId)
            },

            /**
             * Gets the applicable shipping methods for the basket's items and stores it in local state.
             */
            async getShippingMethods() {
                const shippingMethods = await api.shopperBaskets.getShippingMethodsForShipment({
                    parameters: {basketId: basket.basketId, shipmentId: 'me'}
                })
                mergeState({shippingMethods})
            },

            /**
             * Sets the shipment's shipping method on the basket.
             * @param {string} id - The shipping method id from applicable shipping methods
             */
            async setShippingMethod(id) {
                await basket.setShippingMethod(id)
            },

            /**
             * Gets the applicable payment methods for the order.
             */
            async getPaymentMethods() {
                const paymentMethods = await api.shopperBaskets.getPaymentMethodsForBasket({
                    parameters: {basketId: basket.basketId}
                })
                mergeState({paymentMethods})
            },

            /**
             * Applies the given payment instrument to the basket.
             * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/modules/shoppercustomers.html#orderpaymentinstrument}
             * @param {Object} payment
             */
            async setPayment(payment) {
                // eslint-disable-next-line no-unused-vars
                const {expiry, paymentInstrumentId, ...selectedPayment} = payment

                if (paymentInstrumentId) {
                    // Customer selected a saved card
                    await basket.setPaymentInstrument({
                        customerPaymentInstrumentId: paymentInstrumentId
                    })
                    return
                }

                // The form gices us the expiration date as `MM/YY` - so we need to split it into
                // month and year to submit them as individual fields.
                const [expirationMonth, expirationYear] = expiry.split('/')

                const paymentInstrument = {
                    paymentMethodId: 'CREDIT_CARD',
                    paymentCard: {
                        ...selectedPayment,
                        number: selectedPayment.number.replace(/ /g, ''),
                        cardType: getPaymentInstrumentCardType(selectedPayment.cardType),
                        expirationMonth: parseInt(expirationMonth),
                        expirationYear: parseInt(`20${expirationYear}`),

                        // TODO: These fields are required for saving the card to the customer's
                        // account. Im not sure what they are for or how to get them, so for now
                        // we're just passing some values to make it work. Need to investigate.
                        issueNumber: '',
                        validFromMonth: 1,
                        validFromYear: 2020
                    }
                }

                await basket.setPaymentInstrument(paymentInstrument)

                // Save the payment instrument to the customer's account if they are registered
                if (!state.isGuestCheckout && !selectedPayment.id) {
                    customer.addSavedPaymentInstrument(paymentInstrument)
                }
            },

            /**
             * Removes the currently applied payment instrument from the basket. Multiple payment
             * instruments can be applied to the basket, however we are only dealing with one.
             */
            async removePayment() {
                await basket.removePaymentInstrument()
            },

            /**
             * Applies the given address to the basket's billing address. Accepts CustomerAddress and OrderAddress.
             * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/modules/shoppercustomers.html#customeraddress}
             * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/modules/shoppercustomers.html#orderaddress}
             * @param {Object} addressData
             */
            async setBillingAddress(addressData) {
                /* eslint-disable no-unused-vars */
                const {
                    id,
                    preferred,
                    creationDate,
                    lastModified,
                    addressId,
                    addressName,
                    ...address
                } = addressData
                /* eslint-enable no-unused-vars */

                await basket.setBillingAddress(address)

                // Save the address to the customer's account if they are registered and they
                // provided a name for it.
                if (!state.isGuestCheckout) {
                    customer.addSavedAddress(address)
                }
            },

            async placeOrder() {
                mergeState({globalError: undefined})
                try {
                    await basket.createOrder()
                } catch (error) {
                    mergeState({globalError: error.message})
                    throw error
                }
            }
        }
    }, [state, customer, basket, mergeState])

    return <CheckoutContext.Provider value={ctx}>{children}</CheckoutContext.Provider>
}

CheckoutProvider.propTypes = {
    children: PropTypes.any
}

/**
 * A hook for managing checkout state and actions
 * @returns {Object} Checkout data and actions
 */
export const useCheckout = () => {
    return React.useContext(CheckoutContext)
}
