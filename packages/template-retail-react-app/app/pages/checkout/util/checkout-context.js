/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useCallback, useEffect, useRef, useState} from 'react'
import PropTypes from 'prop-types'
import useEinstein from '../../../hooks/use-einstein'
import {isMatchingAddress} from '../../../utils/utils'
import {useCurrentCustomer} from '../../../hooks/use-current-customer'
import {useCurrentBasket} from '../../../hooks/use-current-basket'

const CheckoutContext = React.createContext()

export const CheckoutProvider = ({children}) => {
    const mounted = useRef()
    const {data: customer} = useCurrentCustomer()
    const {data: basket} = useCurrentBasket()
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
