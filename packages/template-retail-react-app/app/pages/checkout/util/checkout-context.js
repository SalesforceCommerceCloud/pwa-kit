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
import {STORE_LOCATOR_IS_ENABLED} from '@salesforce/retail-react-app/app/constants'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import {useConfigurations} from '@salesforce/commerce-sdk-react'

const CheckoutContext = React.createContext()

export const CheckoutProvider = ({children}) => {
    const {data: customer} = useCurrentCustomer()
    const {data: basket, derivedData, isLoading: isBasketLoading} = useCurrentBasket()
    const {data: configurations} = useConfigurations()
    const einstein = useEinstein()
    const [step, setStep] = useState()
    const storeLocatorEnabled = getConfig()?.app?.storeLocatorEnabled ?? STORE_LOCATOR_IS_ENABLED

    const CHECKOUT_STEPS_LIST = [
        'CONTACT_INFO',
        'PICKUP_ADDRESS',
        'SHIPPING_ADDRESS',
        'SHIPPING_OPTIONS',
        'PAYMENT',
        'REVIEW_ORDER'
    ]
    const STEPS = CHECKOUT_STEPS_LIST.reduce((acc, step, idx) => ({...acc, [step]: idx}), {})

    const getCheckoutStepName = (step) => CHECKOUT_STEPS_LIST[step]

    useEffect(() => {
        if (isBasketLoading || !customer || !basket) {
            return
        }
        let step = STEPS.REVIEW_ORDER

        if (customer.isGuest && !basket.customerInfo?.email) {
            step = STEPS.CONTACT_INFO
        } else if (derivedData?.isMissingShippingAddress) {
            step = STEPS.SHIPPING_ADDRESS
        } else if (derivedData?.isMissingShippingMethod) {
            step = STEPS.SHIPPING_OPTIONS
        } else if (!basket.paymentInstruments || !basket.billingAddress) {
            step = STEPS.PAYMENT
        }

        setStep(step)
    }, [
        isBasketLoading,
        customer?.isGuest,
        basket?.customerInfo?.email,
        basket?.shipments,
        basket?.paymentInstruments,
        basket?.billingAddress,
        derivedData?.isMissingShippingAddress,
        derivedData?.isMissingShippingMethod
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

    const goToNextStep = () => {
        // Check if current step is CONTACT_INFO
        if (step === STEPS.CONTACT_INFO) {
            // If all items are pickup at one store, skip directly to payment
            const shouldSkipDirectlyToPayment =
                derivedData?.totalDeliveryShipments === 0 && derivedData?.totalPickupShipments === 1
            if (shouldSkipDirectlyToPayment) {
                setStep(STEPS.PAYMENT)
                return
            }

            // Otherwise go to pickup address for pickup baskets, or shipping address for delivery baskets
            const hasAnyPickupShipment =
                storeLocatorEnabled && derivedData?.totalPickupShipments > 0
            setStep(hasAnyPickupShipment ? STEPS.PICKUP_ADDRESS : STEPS.SHIPPING_ADDRESS)
        } else if (step === STEPS.PICKUP_ADDRESS) {
            const hasDeliveryShipment = derivedData?.totalDeliveryShipments > 0
            setStep(hasDeliveryShipment ? STEPS.SHIPPING_ADDRESS : STEPS.PAYMENT)
        } else {
            setStep(step + 1)
        }
    }

    const goToStep = (step) => setStep(step)

    const value = {
        step,
        STEPS,
        goToNextStep,
        goToStep,
        configurations
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
