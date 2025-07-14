/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useEffect, useState} from 'react'
import PropTypes from 'prop-types'
import useEinstein from '@salesforce/retail-react-app/app/hooks/use-einstein'
import {useCurrentCustomer} from '@salesforce/retail-react-app/app/hooks/use-current-customer'
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'

const CheckoutContext = React.createContext()

export const CheckoutProvider = ({children}) => {
    const {data: customer} = useCurrentCustomer()
    const {data: basket} = useCurrentBasket()
    const einstein = useEinstein()
    const [step, setStep] = useState()

    const CHECKOUT_STEPS_LIST = [
        'CONTACT_INFO',
        'SHIPPING_ADDRESS',
        'SHIPPING_OPTIONS',
        'PAYMENT',
        'REVIEW_ORDER'
    ]
    const STEPS = CHECKOUT_STEPS_LIST.reduce((acc, step, idx) => ({...acc, [step]: idx}), {})

    const getCheckoutStepName = (step) => CHECKOUT_STEPS_LIST[step]

    useEffect(() => {
        if (!customer || !basket) {
            return
        }

        let step = STEPS.REVIEW_ORDER

        if (customer.isGuest && !basket.customerInfo?.email) {
            step = STEPS.CONTACT_INFO
        } else if (!basket.shipments[0]?.shippingAddress) {
            step = STEPS.SHIPPING_ADDRESS
        } else if (!basket.shipments[0]?.shippingMethod) {
            step = STEPS.SHIPPING_OPTIONS
        } else if (!basket.paymentInstruments || !basket.billingAddress) {
            step = STEPS.PAYMENT
        }

        setStep(step)
    }, [
        customer?.isGuest,
        basket?.customerInfo?.email,
        basket?.shipments[0]?.shippingAddress,
        basket?.shipments[0]?.shippingMethod,
        basket?.paymentInstruments,
        basket?.billingAddress
    ])

    /**************** Einstein ****************/
    // Run this once when checkout begins
    useEffect(() => {
        if (basket?.productItems) {
            einstein.sendBeginCheckout(basket)
        }
    }, [])

    // Run this every time checkout steps change
    useEffect(() => {
        if (step != undefined) {
            einstein.sendCheckoutStep(getCheckoutStepName(step), step, basket)
        }
    }, [step])

    const value = {
        step,
        STEPS,
        goToNextStep: () => setStep(step + 1),
        goToStep: (step) => setStep(step)
    }

    return <CheckoutContext.Provider value={value}>{children}</CheckoutContext.Provider>
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
