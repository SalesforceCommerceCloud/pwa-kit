/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useCallback, useEffect, useRef, useState} from 'react'
import PropTypes from 'prop-types'
import useEinstein from '../../../hooks/use-einstein'
import {useCommerceAPI} from '../../../commerce-api/contexts'
import {getPaymentInstrumentCardType} from '../../../utils/cc-utils'
import {isMatchingAddress} from '../../../utils/utils'
import {useIntl} from 'react-intl'
import {useCurrentCustomer} from '../../../hooks/use-current-customer'
import {useCurrentBasket} from '../../../hooks/use-current-basket'

const CheckoutContext = React.createContext()

export const CheckoutProvider = ({children}) => {
    const mounted = useRef()
    const api = useCommerceAPI()
    const {data: customer} = useCurrentCustomer()
    const {data: basket} = useCurrentBasket()
    const {formatMessage} = useIntl()
    const einstein = useEinstein()

    const [state, setState] = useState({
        step: undefined,
        isGuestCheckout: false,
        shippingMethods: undefined,
        paymentMethods: undefined,
        sectionError: undefined
    })

    const CheckoutStepsList = [
        'Contact_Info',
        'Shipping_Address',
        'Shipping_Options',
        'Payment',
        'Review_Order'
    ]
    const CheckoutSteps = CheckoutStepsList.reduce((acc, step, idx) => ({...acc, [step]: idx}), {})

    const getCheckoutStepName = (step) => CheckoutStepsList[step]

    const mergeState = useCallback((data) => {
        // If we become unmounted during an async call that results in updating state, we
        // skip the update to avoid React errors about setting state in unmounted components.
        if (!mounted.current) {
            return
        }
        setState((_state) => ({
            ..._state,
            ...data
        }))
    })

    // We use this to track mounted state.
    useEffect(() => {
        mounted.current = true
        return () => {
            mounted.current = false
        }
    }, [])

    useEffect(() => {
        if (customer.isRegistered && state.isGuestCheckout) {
            mergeState({isGuestCheckout: false})
        }

        if (customer.isGuest && basket?.customerInfo?.email && !state.isGuestCheckout) {
            mergeState({isGuestCheckout: true})
        }

        // Derive the starting step for checkout based on current state of basket.
        // A failed condition sets the current step and returns early (order matters).
        if (customer.customerId && basket?.basketId && state.step === undefined) {
            if (!basket.customerInfo?.email) {
                mergeState({step: CheckoutSteps.Contact_Info})
                return
            }
            if (basket.shipments && !basket.shipments[0]?.shippingAddress) {
                mergeState({step: CheckoutSteps.Shipping_Address})
                return
            }
            if (basket.shipments && !basket.shipments[0]?.shippingMethod) {
                mergeState({step: CheckoutSteps.Shipping_Options})
                return
            }
            if (!basket.paymentInstruments || !basket.billingAddress) {
                mergeState({step: CheckoutSteps.Payment})
                return
            }

            mergeState({step: CheckoutSteps.Review_Order})
        }
    }, [customer, basket])

    /**************** Einstein ****************/
    // Run this once when checkout begins
    useEffect(() => {
        if (basket?.productItems) {
            einstein.sendBeginCheckout(basket)
        }
    }, [])

    // Run this every time checkout steps change
    useEffect(() => {
        if (state.step != undefined) {
            einstein.sendCheckoutStep(getCheckoutStepName(state.step), state.step, basket)
        }
    }, [state.step])

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

            get checkoutSteps() {
                return CheckoutSteps
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
            //
            // @TODO: ALL METHODS BELOW SHOULD BE REMOVED BY THE END OF HOOK INTEGRATION
            //
            // ----------------

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
                const {expiry, paymentInstrumentId, ...selectedPayment} = payment

                if (paymentInstrumentId) {
                    // Customer selected a saved card
                    await basket.setPaymentInstrument({
                        customerPaymentInstrumentId: paymentInstrumentId
                    })
                    return
                }

                // The form gives us the expiration date as `MM/YY` - so we need to split it into
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
                const {
                    id,
                    preferred,
                    creationDate,
                    lastModified,
                    addressId,
                    addressName,
                    ...address
                } = addressData

                await basket.setBillingAddress(address)

                // Save the address to the customer's account if they are registered and its a new address
                if (!state.isGuestCheckout && !id && !addressId) {
                    customer.addSavedAddress(address)
                }
            },

            async placeOrder() {
                try {
                    await basket.createOrder()
                } catch (error) {
                    // Note: It is possible to get localized error messages from OCAPI, but this
                    // is not available for all locales or all error messages. Therefore, we
                    // recommend using your own error messages, rather than those provided by OCAPI.
                    const message = formatMessage({
                        id: 'checkout.message.generic_error',
                        defaultMessage: 'An unexpected error occurred during checkout.'
                    })
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
